import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all request paths except static files, images, favicon, and asset tag render endpoints
    "/((?!_next/static|_next/image|favicon.ico|api/asset-tags/.*/render|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
