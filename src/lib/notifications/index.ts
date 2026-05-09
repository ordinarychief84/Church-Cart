import { Prisma, NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "./events";

export type EmitInput = {
  type: NotificationType;
  recipientId: string;
  payload: Record<string, unknown>;
  channel?: NotificationChannel;
};

/**
 * MVP: writes a NotificationEvent row with status=QUEUED. Channel adapters
 * (email, sms, whatsapp) are no-ops. A future worker reads QUEUED rows and
 * dispatches to the configured provider.
 */
export async function emit(input: EmitInput, tx?: Prisma.TransactionClient): Promise<void> {
  const client = tx ?? prisma;
  await client.notificationEvent.create({
    data: {
      type: input.type,
      recipientId: input.recipientId,
      channel: input.channel ?? NotificationChannel.IN_APP,
      payload: input.payload as Prisma.InputJsonValue,
    },
  });
}

export { NotificationTypes, NOTIFICATION_TITLES } from "./events";
export type { NotificationType } from "./events";
