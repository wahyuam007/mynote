import { NextResponse } from "next/server";
import db from "@/lib/db";
import { comparePassword, createToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(cleanEmail) as {
      id: string;
      name: string;
      email: string;
      password_hash: string;
    } | undefined;

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      message: "Login berhasil",
      user: { id: user.id, name: user.name, email: user.email },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login." },
      { status: 500 }
    );
  }
}
