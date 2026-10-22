import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { NextResponse, type NextRequest } from 'next/server'
import { findActiveAdmin } from '@/lib/auth'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new Response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Pages that work without a session (sign in, password reset request, email links)
  const isPublicPath =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/auth')

  if (!user && !isPublicPath) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Signed in is not enough: every protected request (pages, client navigations and
  // server actions) also needs an active admin record.
  if (user && !isPublicPath && !(await findActiveAdmin(user.id))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = '?error=unauthorized'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
