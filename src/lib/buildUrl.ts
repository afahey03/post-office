export interface QueryParam {
    key: string;
    value: string;
    enabled: boolean;
}

export function buildUrlWithParams(baseUrl: string, params: QueryParam[]): string {
    const trimmedUrl = baseUrl.trim();
    if (!trimmedUrl) return '';
    const active = params.filter((p) => p.enabled && p.key);
    if (!active.length) return trimmedUrl;

    try {
        const parsed = new URL(trimmedUrl);
        active.forEach((p) => parsed.searchParams.set(p.key, p.value));
        return parsed.toString();
    } catch {
        const [base, existing = ''] = trimmedUrl.split('?');
        const searchParams = new URLSearchParams(existing);
        active.forEach((p) => searchParams.set(p.key, p.value));
        const qs = searchParams.toString();
        return qs ? `${base}?${qs}` : base;
    }
}
