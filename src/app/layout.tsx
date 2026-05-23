import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./tools.css";
import NavBar from "@/components/NavBar";

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
            <body>
                <NavBar />
                <main>{children}</main>
            </body>
        </html>
    );
}
