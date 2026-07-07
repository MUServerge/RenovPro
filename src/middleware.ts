import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = ["/dashboard", "/admin", "/report"];

async function isValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const s = process.env.AUTH_SECRET;
  if (!s) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(s));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get("mp_session")?.value;
  if (await isValid(token)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/report"],
};
