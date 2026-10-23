import { type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

// Next 16 "proxy" (formerly middleware): runs on every matched request, on the Node.js runtime
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (crawlers must read it without a session)
     * - image files
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
