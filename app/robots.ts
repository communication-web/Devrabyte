import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://devrabyte.ai';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/tasks', '/workflows', '/team', '/reports', '/bottlenecks', '/settings', '/billing', '/whatsapp', '/admin', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
