import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://post-office.dev';

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    return [
        { url: siteUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
        { url: `${siteUrl}/json`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${siteUrl}/api`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    ];
}
