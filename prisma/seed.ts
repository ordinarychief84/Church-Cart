import { PrismaClient, Role, OrderStatus, DeliveryType, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Password123!";

const CATEGORIES = [
  { slug: "christian-books", name: "Christian books" },
  { slug: "fashion", name: "Fashion" },
  { slug: "beauty", name: "Beauty" },
  { slug: "food", name: "Food" },
  { slug: "gifts", name: "Gifts" },
  { slug: "church-supplies", name: "Church supplies" },
  { slug: "event-products", name: "Event products" },
  { slug: "digital-products", name: "Digital products" },
];

async function main() {
  console.log("Resetting database…");
  // Delete in dependency order
  await prisma.notificationEvent.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.review.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.orderStatusEvent.deleteMany();
  await prisma.pickupRecord.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.churchBranch.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  console.log("Seeding categories…");
  const categories = await Promise.all(
    CATEGORIES.map((c) => prisma.productCategory.create({ data: c }))
  );
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  console.log("Seeding admin…");
  await prisma.user.create({
    data: {
      fullName: "Platform Admin",
      email: "admin@churchcart.test",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log("Seeding church admins + branches…");
  const churchSeeds = [
    {
      email: "rccg-cod@churchcart.test",
      fullName: "Pastor Adebayo",
      churchName: "RCCG",
      denomination: "Pentecostal",
      branchName: "City of David Parish",
      address: "Plot 51 Ahmadu Bello Way, Victoria Island",
      city: "Lagos",
      state: "Lagos",
    },
    {
      email: "winners-faith@churchcart.test",
      fullName: "Pastor Chukwu",
      churchName: "Winners Chapel",
      denomination: "Pentecostal",
      branchName: "Faith Tabernacle",
      address: "Canaan Land, Ota",
      city: "Lagos",
      state: "Lagos",
    },
    {
      email: "ce-vi@churchcart.test",
      fullName: "Pastor Ngozi",
      churchName: "Christ Embassy",
      denomination: "Pentecostal",
      branchName: "Victoria Island",
      address: "Plot 1633 Bishop Oluwole Street",
      city: "Lagos",
      state: "Lagos",
    },
    {
      email: "deeper-gwarinpa@churchcart.test",
      fullName: "Brother Olu",
      churchName: "Deeper Life",
      denomination: "Pentecostal",
      branchName: "Gwarinpa District",
      address: "Plot 12, 6th Avenue Gwarinpa",
      city: "Abuja",
      state: "FCT",
    },
    {
      email: "catholic-sacred@churchcart.test",
      fullName: "Father Eze",
      churchName: "Catholic Church",
      denomination: "Catholic",
      branchName: "Sacred Heart Parish",
      address: "Aba Road",
      city: "Port Harcourt",
      state: "Rivers",
    },
    {
      email: "anglican-stjames@churchcart.test",
      fullName: "Reverend Tunde",
      churchName: "Anglican Church",
      denomination: "Anglican",
      branchName: "Cathedral Church of St James",
      address: "Oke Bola",
      city: "Ibadan",
      state: "Oyo",
    },
  ];

  const branches = [];
  for (const c of churchSeeds) {
    const user = await prisma.user.create({
      data: { fullName: c.fullName, email: c.email, passwordHash, role: Role.CHURCH_ADMIN },
    });
    const branch = await prisma.churchBranch.create({
      data: {
        adminUserId: user.id,
        churchName: c.churchName,
        denomination: c.denomination,
        branchName: c.branchName,
        slug: `${c.churchName.toLowerCase().replace(/\s+/g, "-")}-${c.branchName.toLowerCase().replace(/\s+/g, "-")}`,
        address: c.address,
        city: c.city,
        state: c.state,
        contactPerson: c.fullName,
        contactPhone: "+2348012345678",
        operatingDays: "Mon-Fri,Sun",
        operatingHours: "09:00-18:00",
        pickupCapacity: 50,
        status: "APPROVED",
      },
    });
    branches.push(branch);
  }

  console.log("Seeding vendors + products…");
  const vendorSeeds = [
    {
      email: "vendor1@churchcart.test",
      fullName: "Adaeze Okeke",
      businessName: "Glory Books NG",
      city: "Lagos",
      state: "Lagos",
      address: "12 Allen Avenue, Ikeja",
      churchAffiliation: "RCCG",
      products: [
        { title: "Streams in the Desert (Devotional)", priceKobo: 750_000, qty: 25, cat: "christian-books" },
        { title: "Jesus Calling — Hardcover", priceKobo: 1_200_000, qty: 12, cat: "christian-books" },
        { title: "Worship Notebook A5", priceKobo: 280_000, qty: 60, cat: "gifts" },
      ],
    },
    {
      email: "vendor2@churchcart.test",
      fullName: "Tunde Bello",
      businessName: "Crown Modest Wear",
      city: "Lagos",
      state: "Lagos",
      address: "5 Adeola Odeku, Victoria Island",
      churchAffiliation: "Winners Chapel",
      products: [
        { title: "Ankara Sunday Dress", priceKobo: 1_850_000, qty: 8, cat: "fashion" },
        { title: "Men's Plain Cotton Shirt — White", priceKobo: 950_000, qty: 20, cat: "fashion" },
        { title: "Children's Sunday Vest", priceKobo: 420_000, qty: 30, cat: "fashion" },
      ],
    },
    {
      email: "vendor3@churchcart.test",
      fullName: "Chiamaka Eze",
      businessName: "Naturals by Chi",
      city: "Abuja",
      state: "FCT",
      address: "Plot 8 Wuse 2",
      churchAffiliation: "Christ Embassy",
      products: [
        { title: "Shea Butter Body Cream 250ml", priceKobo: 380_000, qty: 100, cat: "beauty" },
        { title: "Black Soap Bar", priceKobo: 150_000, qty: 200, cat: "beauty" },
        { title: "Anointing Oil Roll-on", priceKobo: 220_000, qty: 80, cat: "church-supplies" },
      ],
    },
    {
      email: "vendor4@churchcart.test",
      fullName: "Emeka Nwosu",
      businessName: "Holy Communion Supplies",
      city: "Port Harcourt",
      state: "Rivers",
      address: "23 Aba Road",
      churchAffiliation: "Catholic Church",
      products: [
        { title: "Communion Wafers (Box of 500)", priceKobo: 920_000, qty: 30, cat: "church-supplies" },
        { title: "Altar Cloth — White Linen", priceKobo: 650_000, qty: 25, cat: "church-supplies" },
        { title: "Brass Offering Plate", priceKobo: 1_400_000, qty: 10, cat: "church-supplies" },
      ],
    },
    {
      email: "vendor5@churchcart.test",
      fullName: "Funke Adeyemi",
      businessName: "Faith Foods",
      city: "Ibadan",
      state: "Oyo",
      address: "Bodija Market Road",
      churchAffiliation: "Anglican Church",
      products: [
        { title: "Premium Garri 5kg", priceKobo: 380_000, qty: 100, cat: "food" },
        { title: "Stockfish Pack 250g", priceKobo: 550_000, qty: 60, cat: "food" },
        { title: "Local Honey 500ml", priceKobo: 480_000, qty: 40, cat: "food" },
      ],
    },
  ];

  const vendors: { vendor: { id: string; userId: string; businessName: string }; products: { id: string; priceKobo: number; title: string }[] }[] = [];
  for (const v of vendorSeeds) {
    const user = await prisma.user.create({
      data: { fullName: v.fullName, email: v.email, passwordHash, role: Role.VENDOR, phone: null },
    });
    const vendor = await prisma.vendorProfile.create({
      data: {
        userId: user.id,
        businessName: v.businessName,
        slug: v.businessName.toLowerCase().replace(/\s+/g, "-"),
        phone: "+2348011223344",
        address: v.address,
        city: v.city,
        state: v.state,
        churchAffiliation: v.churchAffiliation,
        status: "VERIFIED",
        description: `${v.businessName} serves the Body of Christ across Nigeria with quality goods.`,
      },
    });
    const products = [];
    for (const p of v.products) {
      const product = await prisma.product.create({
        data: {
          vendorId: vendor.id,
          categoryId: catBySlug[p.cat].id,
          title: p.title,
          slug: `${p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 6)}`,
          description:
            "Lovingly handpicked for the churchCart community. Quality assured, ships from a verified vendor.",
          priceKobo: p.priceKobo,
          inventoryQty: p.qty,
          available: true,
          isDigital: false,
          weightGrams: 500,
        },
      });
      products.push(product);
    }
    vendors.push({ vendor, products });
  }

  console.log("Seeding buyers…");
  const buyers = await Promise.all(
    [
      ["buyer1@churchcart.test", "Bukola Ade"],
      ["buyer2@churchcart.test", "Daniel Obi"],
      ["buyer3@churchcart.test", "Grace Musa"],
      ["buyer4@churchcart.test", "Samuel Idowu"],
      ["buyer5@churchcart.test", "Esther Yusuf"],
      ["buyer6@churchcart.test", "Peter Okon"],
    ].map(async ([email, name]) => {
      const user = await prisma.user.create({
        data: { email, fullName: name, passwordHash, role: Role.BUYER, phone: null },
      });
      await prisma.cart.create({ data: { userId: user.id } });
      return user;
    })
  );

  console.log("Seeding orders across the lifecycle…");
  const lifecycle: { status: OrderStatus; deliveryType: DeliveryType; paid: boolean }[] = [
    { status: "PENDING_PAYMENT", deliveryType: "CHURCH_PICKUP", paid: false },
    { status: "PENDING_PAYMENT", deliveryType: "HOME_DELIVERY", paid: false },
    { status: "PAID", deliveryType: "CHURCH_PICKUP", paid: true },
    { status: "PAID", deliveryType: "HOME_DELIVERY", paid: true },
    { status: "SHIPPED", deliveryType: "HOME_DELIVERY", paid: true },
    { status: "ARRIVED_AT_CHURCH", deliveryType: "CHURCH_PICKUP", paid: true },
    { status: "READY_FOR_PICKUP", deliveryType: "CHURCH_PICKUP", paid: true },
    { status: "PICKED_UP", deliveryType: "CHURCH_PICKUP", paid: true },
    { status: "DELIVERED", deliveryType: "HOME_DELIVERY", paid: true },
    { status: "FAILED_PICKUP", deliveryType: "CHURCH_PICKUP", paid: true },
  ];

  let orderIdx = 0;
  for (const tpl of lifecycle) {
    const buyer = buyers[orderIdx % buyers.length];
    const { vendor, products } = vendors[orderIdx % vendors.length];
    const product = products[0];
    const branch = branches[orderIdx % branches.length];

    const subtotalKobo = product.priceKobo;
    const platformFeeKobo = Math.floor((subtotalKobo * 500) / 10000);
    const vendorAmountKobo = subtotalKobo - platformFeeKobo;
    const logisticsFeeKobo = tpl.deliveryType === "HOME_DELIVERY" ? 150_000 : 80_000;
    const totalKobo = subtotalKobo + logisticsFeeKobo;

    const reference = `seed_${Math.random().toString(36).slice(2, 12)}`;
    const payment = await prisma.payment.create({
      data: {
        reference,
        amountKobo: totalKobo,
        platformFeeKobo,
        vendorAmountKobo,
        logisticsFeeKobo,
        status: tpl.paid ? PaymentStatus.SUCCEEDED : PaymentStatus.INITIATED,
        verifiedAt: tpl.paid ? new Date() : null,
      },
    });

    const code = String(100000 + Math.floor(Math.random() * 899999));
    const token = crypto.randomUUID();
    const order = await prisma.order.create({
      data: {
        buyerId: buyer.id,
        vendorId: vendor.id,
        status: tpl.status,
        deliveryType: tpl.deliveryType,
        deliveryAddress: tpl.deliveryType === "HOME_DELIVERY" ? "12 Awolowo Way" : null,
        deliveryCity: tpl.deliveryType === "HOME_DELIVERY" ? "Ikeja" : null,
        deliveryState: tpl.deliveryType === "HOME_DELIVERY" ? "Lagos" : null,
        churchBranchId: tpl.deliveryType === "CHURCH_PICKUP" ? branch.id : null,
        pickupCode: tpl.deliveryType === "CHURCH_PICKUP" ? code : null,
        pickupToken: tpl.deliveryType === "CHURCH_PICKUP" ? token : null,
        subtotalKobo,
        platformFeeKobo,
        logisticsFeeKobo,
        totalKobo,
        vendorAmountKobo,
        paymentId: payment.id,
        paidAt: tpl.paid ? new Date() : null,
        deliveredAt: tpl.status === "DELIVERED" ? new Date() : null,
        pickedUpAt: tpl.status === "PICKED_UP" ? new Date() : null,
        items: {
          create: { productId: product.id, title: product.title, priceKobo: product.priceKobo, quantity: 1 },
        },
        statusHistory: {
          create: { fromStatus: null, toStatus: tpl.status, note: "seeded" },
        },
      },
    });

    if (tpl.deliveryType === "CHURCH_PICKUP") {
      await prisma.pickupRecord.create({
        data: {
          orderId: order.id,
          churchBranchId: branch.id,
          arrivedAt:
            tpl.status === "ARRIVED_AT_CHURCH" ||
            tpl.status === "READY_FOR_PICKUP" ||
            tpl.status === "PICKED_UP" ||
            tpl.status === "FAILED_PICKUP"
              ? new Date()
              : null,
          readyAt:
            tpl.status === "READY_FOR_PICKUP" ||
            tpl.status === "PICKED_UP" ||
            tpl.status === "FAILED_PICKUP"
              ? new Date()
              : null,
          pickedUpAt: tpl.status === "PICKED_UP" ? new Date() : null,
          failedAt: tpl.status === "FAILED_PICKUP" ? new Date() : null,
          failureReason: tpl.status === "FAILED_PICKUP" ? "Buyer did not show up after 7 days" : null,
          outcome:
            tpl.status === "PICKED_UP" ? "PICKED_UP" : tpl.status === "FAILED_PICKUP" ? "FAILED" : "PENDING",
        },
      });
    }

    if (tpl.status === "PICKED_UP" || tpl.status === "DELIVERED") {
      const eligibleAt = new Date();
      eligibleAt.setHours(eligibleAt.getHours() + 48);
      await prisma.payout.create({
        data: { orderId: order.id, vendorId: vendor.id, amountKobo: vendorAmountKobo, eligibleAt },
      });
      await prisma.review.create({
        data: {
          productId: product.id,
          authorId: buyer.id,
          rating: 5,
          body: "Came on time and exactly as described. Will buy again.",
        },
      });
    }

    orderIdx++;
  }

  console.log("\n✅ Seed complete!\n");
  console.log("Sign in with these credentials (password: " + PASSWORD + "):\n");
  console.log("  Admin     admin@churchcart.test");
  console.log("  Vendor 1  vendor1@churchcart.test  (Glory Books NG)");
  console.log("  Vendor 2  vendor2@churchcart.test  (Crown Modest Wear)");
  console.log("  Buyer 1   buyer1@churchcart.test");
  console.log("  Church 1  rccg-cod@churchcart.test (RCCG · City of David)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
