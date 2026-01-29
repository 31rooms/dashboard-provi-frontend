import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SESSION_VALUE = 'authenticated';
const INACTIVITY_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000; // 3 dias en ms

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authSession = request.cookies.get('auth_session');
    const lastActivity = request.cookies.get('last_activity');

    const isAuthenticated = authSession?.value === AUTH_SESSION_VALUE;

    // Verificar timeout por inactividad
    if (isAuthenticated && lastActivity?.value) {
        const lastTime = parseInt(lastActivity.value, 10);
        if (!isNaN(lastTime) && Date.now() - lastTime > INACTIVITY_TIMEOUT_MS) {
            // Sesion expirada por inactividad
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('auth_session');
            response.cookies.delete('last_activity');
            return response;
        }
    }

    // Proteger rutas del dashboard
    if (pathname.startsWith('/dashboard')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Proteger rutas API (excepto publicas)
    const isPublicApi = pathname === '/api/health' ||
                        (pathname === '/api/sync' && request.method === 'GET');

    if (pathname.startsWith('/api/') && !isPublicApi) {
        if (pathname !== '/api/sync' && !isAuthenticated) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }
    }

    // Redirigir raiz
    if (pathname === '/') {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const response = NextResponse.next();

    // Actualizar cookie de ultima actividad en cada request autenticado
    if (isAuthenticated && pathname.startsWith('/dashboard')) {
        response.cookies.set('last_activity', Date.now().toString(), {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3 * 24 * 60 * 60, // 3 dias
        });
    }

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
}

export const config = {
    matcher: ['/', '/dashboard/:path*', '/api/:path*'],
};
