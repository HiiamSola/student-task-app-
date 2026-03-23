import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authPages = new Set(["/login", "/signup"]);

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = Boolean(token);
  const { pathname } = request.nextUrl;
  const isAuthPage = authPages.has(pathname);

  if (!isAuthenticated && pathname === "/") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup"],
};
