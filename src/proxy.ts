import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

  const isAuthRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');
  const isPrivateRoute = pathname.startsWith('/admin') || pathname.startsWith('/user');

  // Jika tidak login dan mencoba mengakses rute privat, lempar ke login
  if (!user && isPrivateRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Jika sudah login
  if (user) {
    const { data: profileData } = await supabase
      .from('profile')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Jangan izinkan akses halaman auth lagi jika sudah login
    if (isAuthRoute) {
      return NextResponse.redirect(new URL(profileData?.role === 'admin' ? '/admin' : '/', request.url));
    }

    // Hanya admin yang bisa akses /admin dan sub-routenya
    if (pathname.startsWith('/admin') && profileData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
