import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const character = await prisma.character.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json(character);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const allowed = ["skinTone", "hairStyle", "hairColor", "eyeColor", "top", "bottom", "shoes", "hat", "accessory"];
  const update: Record<string, string> = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }

  const character = await prisma.character.update({
    where: { userId: session.user.id },
    data: update,
  });
  return NextResponse.json(character);
}
