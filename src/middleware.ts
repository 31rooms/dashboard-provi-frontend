import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Valor esperado de la cookie de autenticación
const AUTH_SESSION_VALUE = 'authenticated';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authSession = request.cookies.get('auth_session');

    // Validar que la cookie tenga el valor correcto (no solo que exista)
    const isAuthenticated = authSession?.value === AUTH_SESSION_VALUE;

    // Protection for dashboard routes
    if (pathname.startsWith('/dashboard')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Protection for API routes (except public ones)
    // /api/sync GET es público (health check), pero POST requiere auth (manejado en el endpoint)
    const isPublicApi = pathname === '/api/health' ||
                        (pathname === '/api/sync' && request.method === 'GET');

    if (pathname.startsWith('/api/') && !isPublicApi) {
        // El endpoint /api/sync POST maneja su propia auth (cookie o API key)
        // Los demás endpoints requieren cookie de sesión
        if (pathname !== '/api/sync' && !isAuthenticated) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }
    }

    // Redirect root to login if not authenticated, or to dashboard if authenticated
    if (pathname === '/') {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add security headers to response
    const response = NextResponse.next();

    // Prevenir clickjacking
    response.headers.set('X-Frame-Options', 'DENY');
    // Prevenir MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Prevenir XSS reflection attacks
    response.headers.set('X-XSS-Protection', '1; mode=block');
    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: ['/', '/dashboard/:path*', '/api/:path*'],
};
