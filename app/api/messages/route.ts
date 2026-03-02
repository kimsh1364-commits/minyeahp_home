import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  const messages = await prisma.message.findMany({
    where: { roomId },
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId, content } = await req.json();
  if (!roomId || !content?.trim()) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      userId: session.user.id,
      roomId,
    },
    include: { user: { select: { username: true } } },
  });

  return NextResponse.json(message);
}
