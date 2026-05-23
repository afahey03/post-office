import Link from 'next/link';

export default function Home() {
    return (
        <div className="tool-shell home-shell">
            <div className="home-card">
                <h1 className="home-title">Post Office</h1>
                <p className="home-subtitle">
                    Quick tools for formatting JSON and testing HTTP APIs.
                </p>

                <div className="home-grid">
                    <Link href="/json" className="home-link-card">
                        <div className="home-link-title">JSON Formatter</div>
                        <div className="home-link-copy">
                            Format, validate, minify, and copy JSON with syntax highlighting.
                        </div>
                    </Link>

                    <Link href="/api" className="home-link-card">
                        <div className="home-link-title">API Tester</div>
                        <div className="home-link-copy">
                            Send requests with params, headers, auth, and inspect responses.
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
