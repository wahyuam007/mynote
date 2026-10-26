import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const dbUser = db
    .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
    .get(user.id) as { id: string; name: string; email: string; created_at: string } | undefined;

  if (!dbUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: dbUser });
}
