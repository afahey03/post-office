'use client';

import { useEffect } from 'react';

const VISIT_SESSION_KEY = 'po_visit_tracked_v1';

export default function VisitTracker() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (window.sessionStorage.getItem(VISIT_SESSION_KEY) === '1') {
            return;
        }

        window.sessionStorage.setItem(VISIT_SESSION_KEY, '1');

        void fetch('/api/track/visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: 'session' }),
        }).catch(() => {
            // Intentionally ignored: visit tracking should never break UX.
        });
    }, []);

    return null;
}
