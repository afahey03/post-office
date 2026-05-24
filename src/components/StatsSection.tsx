'use client';

import { useEffect, useMemo, useState } from 'react';

type StatsPayload = {
    jsonFormats: number;
    apiTests: number;
    siteVisits: number;
};

function useCountUp(target: number, durationMs = 800): number {
    const [value, setValue] = useState(0);

    useEffect(() => {
        let frame = 0;
        const start = performance.now();
        const from = 0;

        const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(from + (target - from) * eased));

            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            }
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, durationMs]);

    return value;
}

export default function StatsSection() {
    const [stats, setStats] = useState<StatsPayload | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadStats = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/stats', { cache: 'no-store' });
                if (!res.ok) {
                    throw new Error(`Stats request failed (${res.status})`);
                }

                const data = (await res.json()) as { ok: boolean; stats: StatsPayload; error?: string };
                if (!data.ok) {
                    throw new Error(data.error || 'Unable to load stats');
                }

                if (!mounted) return;
                setStats(data.stats);
                setError('');
            } catch {
                if (!mounted) return;
                setError('Live stats are temporarily unavailable.');
                setStats({ jsonFormats: 0, apiTests: 0, siteVisits: 0 });
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void loadStats();

        return () => {
            mounted = false;
        };
    }, []);

    const display = useMemo(
        () => ({
            jsonFormats: stats?.jsonFormats ?? 0,
            apiTests: stats?.apiTests ?? 0,
            siteVisits: stats?.siteVisits ?? 0,
        }),
        [stats],
    );

    const countJson = useCountUp(display.jsonFormats);
    const countApi = useCountUp(display.apiTests);
    const countVisits = useCountUp(display.siteVisits);

    const cards = [
        { label: 'JSONs Formatted', value: countJson },
        { label: 'Endpoints Tested', value: countApi },
        { label: 'Site Visits', value: countVisits },
    ];

    return (
        <section className="stats-section" aria-label="Public usage stats">
            <div className="stats-header">
                <div>
                    <h2 className="stats-title">Public Stats</h2>
                </div>
                <span className={`stats-pill ${loading ? 'loading' : ''}`}>
                    {loading ? 'Syncing' : 'Live'}
                </span>
            </div>

            <div className="stats-grid">
                {cards.map((card, index) => (
                    <article
                        key={card.label}
                        className="stats-card"
                        style={{ animation: `fadeUp 420ms ease ${index * 90}ms both` }}
                    >
                        <div className="stats-card-label">{card.label}</div>
                        <div className="stats-card-value">
                            {card.value.toLocaleString()}
                        </div>
                    </article>
                ))}
            </div>

            {error && <p className="stats-fallback">Stats unavailable in this environment.</p>}
        </section>
    );
}
