// The GitHub Pages build is a fully static export served from a sub-path.
const isStaticDemo = process.env.NEXT_PUBLIC_STATIC_DEMO === 'true';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isStaticDemo
    ? {
        output: 'export',
        basePath,
        assetPrefix: basePath || undefined,
        // GitHub Pages serves /path/ as /path/index.html.
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  images: {
    unoptimized: isStaticDemo,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // Custom headers require a server; the export ignores them.
  async headers() {
    if (isStaticDemo) return [];

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
