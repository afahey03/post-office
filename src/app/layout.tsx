import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";
import "./tools.css";
import NavBar from "@/components/NavBar";
import VisitTracker from '@/components/VisitTracker';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://post-office.dev';

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-sans",
});

const jetBrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'Post Office',
        template: '%s | Post Office',
    },
    description: 'Format JSON and test HTTP APIs in your browser — fast, account-free, and local-first.',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: siteUrl,
        siteName: 'Post Office',
        title: 'Post Office — JSON Formatter & API Tester',
        description: 'Format JSON and test HTTP APIs in your browser — fast, account-free, and local-first.',
    },
    twitter: {
        card: 'summary',
        title: 'Post Office — JSON Formatter & API Tester',
        description: 'Format JSON and test HTTP APIs in your browser — fast, account-free, and local-first.',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
            <body>
                <NavBar />
                <VisitTracker />
                <main>{children}</main>
                <Analytics />
            </body>
        </html>
    );
}
