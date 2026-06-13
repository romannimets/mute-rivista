import { NextRequest, NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET!

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    const method = req.method

    // ── Maintenance mode — blocca tutto il sito tranne admin autenticato ──────
    if (process.env.MAINTENANCE_MODE === 'true') {
        const isAllowed =
            pathname === '/admin/login' ||
            pathname.startsWith('/admin') ||
            pathname.startsWith('/api/') ||
            pathname.startsWith('/_next') ||
            pathname.startsWith('/favicon')

        if (!isAllowed) {
            // Se è loggato come admin può navigare liberamente anche in manutenzione
            const cookie = req.cookies.get('admin_session')?.value
            if (cookie === ADMIN_SECRET) return NextResponse.next()

            return NextResponse.redirect(new URL('/admin/login', req.url))
        }
    }

    // ── Rotte sempre pubbliche ─────────────────────────────────────────────────
    if (
        pathname === '/admin/login' ||
        pathname === '/api/admin/login' ||
        pathname === '/api/admin/logout'
    ) {
        return NextResponse.next()
    }

    // Iscrizione newsletter pubblica
    if (pathname === '/api/newsletter' && method === 'POST') {
        return NextResponse.next()
    }

    // GET articoli pubblica
    if (pathname.startsWith('/api/articles') && method === 'GET') {
        return NextResponse.next()
    }

    // GET collaboratori pubblica (la legge la pagina About)
    if (pathname.startsWith('/api/collaborators') && method === 'GET') {
        return NextResponse.next()
    }

    // ── Rotte protette ─────────────────────────────────────────────────────────
    const isAdminPage = pathname.startsWith('/admin')
    const isProtectedApi =
        (pathname.startsWith('/api/articles') && method !== 'GET') ||
        (pathname.startsWith('/api/collaborators') && method !== 'GET') ||
        (pathname.startsWith('/api/newsletter') && method !== 'POST') ||
        pathname.startsWith('/api/upload') ||
        pathname.startsWith('/api/media') ||
        pathname.startsWith('/api/admin') ||
        pathname.startsWith('/api/db-stats')

    if (!isAdminPage && !isProtectedApi) return NextResponse.next()

    // Check sessione
    const cookie = req.cookies.get('admin_session')?.value
    if (cookie === ADMIN_SECRET) return NextResponse.next()

    // Non autenticato: API → 401, pagine → redirect login
    if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    return NextResponse.redirect(new URL('/admin/login', req.url))
}

export const config = {
    matcher: [
        '/((?!_next|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.svg|.*\\.ico|.*\\.otf|.*\\.woff|.*\\.woff2|.*\\.mp4).*)',
    ],
}