import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";
import "./tools.css";
import NavBar from "@/components/NavBar";
import VisitTracker from '@/components/VisitTracker';

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
    title: "Post Office",
    description: "JSON Formatter & API Tester",
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
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
