import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: 내 친구 목록 + 받은 요청
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [accepted, pending] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: session.user.id, status: "accepted" },
          { receiverId: session.user.id, status: "accepted" },
        ],
      },
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { receiverId: session.user.id, status: "pending" },
      include: { sender: { select: { id: true, username: true } } },
    }),
  ]);

  const friends = accepted.map((f) =>
    f.senderId === session.user!.id ? f.receiver : f.sender
  );

  return NextResponse.json({ friends, pendingRequests: pending });
}

// POST: 친구 요청 보내기 or 수락/거절
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, username, friendshipId } = await req.json();

  if (action === "send") {
    const target = await prisma.user.findUnique({ where: { username } });
    if (!target) return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    if (target.id === session.user.id) return NextResponse.json({ error: "자기 자신에게 요청할 수 없습니다." }, { status: 400 });

    const friendship = await prisma.friendship.upsert({
      where: { senderId_receiverId: { senderId: session.user.id, receiverId: target.id } },
      create: { senderId: session.user.id, receiverId: target.id },
      update: {},
    });
    return NextResponse.json(friendship);
  }

  if (action === "accept") {
    const updated = await prisma.friendship.updateMany({
      where: { id: friendshipId, receiverId: session.user.id },
      data: { status: "accepted" },
    });
    return NextResponse.json(updated);
  }

  if (action === "reject") {
    await prisma.friendship.deleteMany({
      where: { id: friendshipId, receiverId: session.user.id },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
