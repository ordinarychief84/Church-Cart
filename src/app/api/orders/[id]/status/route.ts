import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/guards";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const order = await prisma.order.findFirst({
    where: {
      id: params.id,
      OR: [
        { buyerId: user.id },
        { vendor: { userId: user.id } },
        { churchBranch: { adminUserId: user.id } },
      ],
    },
    select: { id: true, status: true, updatedAt: true },
  });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(order);
}
