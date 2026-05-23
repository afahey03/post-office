'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
    const pathname = usePathname();

    return (
        <nav style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            height: '52px',
            gap: '32px',
        }}>
            <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                Post Office
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
                <NavLink href="/" label="JSON Formatter" active={pathname === '/'} />
                <NavLink href="/api-tester" label="API Tester" active={pathname === '/api-tester'} />
            </div>
        </nav>
    );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link href={href} style={{
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: '6px',
            background: active ? 'var(--bg-elevated)' : 'transparent',
            transition: 'all 0.15s',
        }}>
            {label}
        </Link>
    );
}
