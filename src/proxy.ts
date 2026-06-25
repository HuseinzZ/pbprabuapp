import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Mapping halaman publik → halaman user (khusus member biasa)
const PUBLIC_TO_USER: Record<string, string> = {
  '/': '/user',
  '/tournaments': '/user/tournaments',
  '/rankings': '/user/rankings',
  '/matches': '/user/matches',
  '/gallery': '/user/gallery',
  '/calendar': '/user/calendar',
  '/about': '/user/about'
};

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Helper untuk melakukan redirect dan membawa cookie
  const redirectWithCookies = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };
  // ── /profile → redirect to /user/profile ─────────────────────────
  if (pathname === '/profile') {
    return redirectWithCookies(new URL('/user/profile', request.url));
  }
  const isAuthRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');
  const isPrivateRoute = pathname.startsWith('/admin') || pathname.startsWith('/user');
  // Jika tidak login dan mencoba mengakses rute privat, lempar ke login
  if (!user && isPrivateRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return redirectWithCookies(loginUrl);
  }
  // Jika sudah login
  if (user) {
    const { data: profileData } = await supabase
      .from('profile')
      .select('role')
      .eq('user_id', user.id)
      .single();
    const isAdmin = profileData?.role === 'admin';
    // Jangan izinkan akses halaman auth lagi jika sudah login
    if (isAuthRoute) {
      return redirectWithCookies(new URL(isAdmin ? '/admin' : '/user/dashboard', request.url));
    }
    // Hanya admin yang bisa akses /admin dan sub-routenya
    if (pathname.startsWith('/admin') && !isAdmin) {
      return redirectWithCookies(new URL('/', request.url));
    }
    // Redirect member (non-admin) dari halaman publik ke halaman user
    if (!isAdmin && PUBLIC_TO_USER[pathname]) {
      return redirectWithCookies(new URL(PUBLIC_TO_USER[pathname], request.url));
    }
  }
  return supabaseResponse;
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
