import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/(zh|en)(\/.*)?$/);

  let lang = "en";
  let newPath = pathname;

  if (match) {
    lang = match[1];
    newPath = match[2] || "/";
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-language", lang);

  const response = newPath !== pathname
    ? NextResponse.rewrite(new URL(newPath, request.url), { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("x-language", lang);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_next/static|_next/image|favicon.ico).*)"],
};
