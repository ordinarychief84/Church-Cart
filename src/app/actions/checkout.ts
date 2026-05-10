"use server";

import { redirect } from "next/navigation";
import { DeliveryType, PaymentStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { checkoutSchema } from "@/lib/validation/checkout";
import { computeOrderTotals } from "@/lib/orders/totals";
import { generatePickupCode } from "@/lib/orders/pickupCode";
import { generatePaymentReference, createPaymentIntent } from "@/lib/payments";
import { getLogisticsProvider } from "@/lib/logistics";
import { emit, NotificationTypes } from "@/lib/notifications";
import { env } from "@/lib/env";

type Result = { error?: string; fieldErrors?: Record<string, string[]> };

export async function createCheckoutAction(_prev: Result, formData: FormData): Promise<Result> {
  const buyer = await requireRole("BUYER");

  const parsed = checkoutSchema.safeParse({
    deliveryType: formData.get("deliveryType"),
    deliveryAddress: formData.get("deliveryAddress") || "",
    deliveryCity: formData.get("deliveryCity") || "",
    deliveryState: formData.get("deliveryState") || "",
    churchBranchId: formData.get("churchBranchId") || "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const input = parsed.data;

  const cart = await prisma.cart.findUnique({
    where: { userId: buyer.id },
    include: { items: { include: { product: { include: { vendor: true } } } } },
  });
  if (!cart || cart.items.length === 0) {
    return { error: "Your cart is empty." };
  }

  // Validate church branch if church pickup
  let church = null;
  if (input.deliveryType === DeliveryType.CHURCH_PICKUP) {
    church = await prisma.churchBranch.findFirst({
      where: { id: input.churchBranchId!, status: "APPROVED" },
    });
    if (!church) return { error: "Selected church branch is unavailable." };
  }

  // Group cart items by vendor
  const byVendor = new Map<string, typeof cart.items>();
  for (const item of cart.items) {
    const list = byVendor.get(item.product.vendorId) ?? [];
    list.push(item);
    byVendor.set(item.product.vendorId, list);
  }

  // Inventory check (best-effort; final check inside transaction)
  for (const item of cart.items) {
    if (item.product.inventoryQty < item.quantity) {
      return { error: `Not enough stock for "${item.product.title}".` };
    }
    if (!item.product.available) {
      return { error: `"${item.product.title}" is no longer available.` };
    }
  }

  const logistics = getLogisticsProvider();
  const reference = generatePaymentReference();

  // Compute logistics quote per vendor (mock returns flat fees)
  const vendorQuotes = new Map<string, number>();
  for (const [vendorId, items] of byVendor) {
    const vendor = items[0].product.vendor;
    const totalWeight = items.reduce((s, i) => s + (i.product.weightGrams ?? 0) * i.quantity, 0);
    const allDigital = items.every((i) => i.product.isDigital);
    const quote = await logistics.getDeliveryQuote({
      origin: {
        name: vendor.businessName,
        phone: vendor.phone,
        address: vendor.address,
        city: vendor.city,
        state: vendor.state,
      },
      destination:
        input.deliveryType === DeliveryType.CHURCH_PICKUP && church
          ? {
              name: church.branchName,
              phone: church.contactPhone,
              address: church.address,
              city: church.city,
              state: church.state,
            }
          : {
              name: buyer.fullName,
              phone: buyer.phone || "",
              address: input.deliveryAddress!,
              city: input.deliveryCity!,
              state: input.deliveryState!,
            },
      weightGrams: totalWeight,
      isDigital: allDigital,
      isChurchPickup: input.deliveryType === DeliveryType.CHURCH_PICKUP,
    });
    vendorQuotes.set(vendorId, quote.amountKobo);
  }

  // Create everything in one transaction
  const orderIds = await prisma.$transaction(async (tx) => {
    // Decrement inventory atomically
    for (const item of cart.items) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, inventoryQty: { gte: item.quantity }, available: true },
        data: { inventoryQty: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        throw new Error(`Stock changed for "${item.product.title}". Please review your cart.`);
      }
    }

    // Sum totals across vendors for the single Payment
    let paymentAmountKobo = 0;
    let paymentPlatformFeeKobo = 0;
    let paymentVendorAmountKobo = 0;
    let paymentLogisticsFeeKobo = 0;

    for (const [, items] of byVendor) {
      const lines = items.map((i) => ({ priceKobo: i.priceKobo, quantity: i.quantity }));
      const totals = computeOrderTotals(lines, vendorQuotes.get(items[0].product.vendorId) ?? 0);
      paymentAmountKobo += totals.totalKobo;
      paymentPlatformFeeKobo += totals.platformFeeKobo;
      paymentVendorAmountKobo += totals.vendorAmountKobo;
      paymentLogisticsFeeKobo += totals.logisticsFeeKobo;
    }

    const payment = await tx.payment.create({
      data: {
        reference,
        amountKobo: paymentAmountKobo,
        platformFeeKobo: paymentPlatformFeeKobo,
        vendorAmountKobo: paymentVendorAmountKobo,
        logisticsFeeKobo: paymentLogisticsFeeKobo,
        status: PaymentStatus.INITIATED,
      },
    });

    const createdIds: string[] = [];
    for (const [vendorId, items] of byVendor) {
      const lines = items.map((i) => ({ priceKobo: i.priceKobo, quantity: i.quantity }));
      const totals = computeOrderTotals(lines, vendorQuotes.get(vendorId) ?? 0);

      // 6-digit codes have only ~900k possibilities, so under load we can
      // collide with an existing unique code. Retry up to 5 times before
      // giving up — at which point something is very wrong.
      let pickup: { code: string; token: string } | null = null;
      if (input.deliveryType === DeliveryType.CHURCH_PICKUP) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate = generatePickupCode();
          const taken = await tx.order.findUnique({
            where: { pickupCode: candidate.code },
            select: { id: true },
          });
          if (!taken) {
            pickup = candidate;
            break;
          }
        }
        if (!pickup) {
          throw new Error("Could not allocate a pickup code, please try again.");
        }
      }

      const order = await tx.order.create({
        data: {
          buyerId: buyer.id,
          vendorId,
          status: OrderStatus.PENDING_PAYMENT,
          deliveryType: input.deliveryType,
          deliveryAddress:
            input.deliveryType === DeliveryType.HOME_DELIVERY ? input.deliveryAddress : null,
          deliveryCity:
            input.deliveryType === DeliveryType.HOME_DELIVERY ? input.deliveryCity : null,
          deliveryState:
            input.deliveryType === DeliveryType.HOME_DELIVERY ? input.deliveryState : null,
          churchBranchId:
            input.deliveryType === DeliveryType.CHURCH_PICKUP ? input.churchBranchId : null,
          pickupCode: pickup?.code ?? null,
          pickupToken: pickup?.token ?? null,
          subtotalKobo: totals.subtotalKobo,
          platformFeeKobo: totals.platformFeeKobo,
          logisticsFeeKobo: totals.logisticsFeeKobo,
          totalKobo: totals.totalKobo,
          vendorAmountKobo: totals.vendorAmountKobo,
          paymentId: payment.id,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              title: i.product.title,
              priceKobo: i.priceKobo,
              quantity: i.quantity,
            })),
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: OrderStatus.PENDING_PAYMENT,
              actorId: buyer.id,
              note: "Order created",
            },
          },
        },
      });

      // Create a PickupRecord shell for church pickups
      if (input.deliveryType === DeliveryType.CHURCH_PICKUP) {
        await tx.pickupRecord.create({
          data: { orderId: order.id, churchBranchId: input.churchBranchId! },
        });
      }

      // Notification: order placed
      await emit(
        {
          type: NotificationTypes.ORDER_PLACED,
          recipientId: buyer.id,
          payload: { orderId: order.id, totalKobo: totals.totalKobo },
        },
        tx
      );

      createdIds.push(order.id);
    }

    // Clear the cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return createdIds;
  });

  // Initialise the payment provider (mock returns redirect to /checkout/mock-payment)
  const intent = await createPaymentIntent({
    reference,
    amountKobo: 0, // handled at provider; provider doesn't need to know in mock mode
    callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/orders`,
  });

  redirect(`${intent.redirectUrl}&orders=${orderIds.join(",")}`);
}
