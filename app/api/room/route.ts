import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const room = await prisma.room.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json(room);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const update: Record<string, string> = {};
  if (data.wallpaper) update.wallpaper = data.wallpaper;
  if (data.floor) update.floor = data.floor;
  if (data.furniture !== undefined) update.furniture = JSON.stringify(data.furniture);

  const room = await prisma.room.update({
    where: { userId: session.user.id },
    data: update,
  });
  return NextResponse.json(room);
}
