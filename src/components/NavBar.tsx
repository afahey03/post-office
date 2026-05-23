'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
    const pathname = usePathname();

    return (
        <nav className="nav-bar">
            <Link href="/" className="nav-brand">
                Post Office
            </Link>
            <div className="nav-links">
                <NavLink href="/json" label="JSON Formatter" active={pathname === '/json'} />
                <NavLink href="/api" label="API Tester" active={pathname === '/api'} />
            </div>
        </nav>
    );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link href={href} className={`nav-link ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
            {label}
        </Link>
    );
}
