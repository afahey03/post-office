export default function InfoRow({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
    return (
        <div className="info-row">
            <span className="info-label">{label}</span>
            <span
                className="info-value"
                style={{ color: color || 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : undefined }}
            >
                {value}
            </span>
        </div>
    );
}
