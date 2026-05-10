/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Defense-in-depth — a stolen cookie can't be exfiltrated via JS.
  { key: "X-Frame-Options", value: "DENY" },
  // Don't sniff content-types — Set-Cookie / images / etc. behave as declared.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Restrict what privileged browser APIs the app can ask for.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Don't send full URL referrer to other origins (PII / order ids in path).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework version in headers.
  poweredByHeader: false,
  // Treat lint warnings as failures during `next build`.
  eslint: { dirs: ["src"], ignoreDuringBuilds: false },
  // Type errors fail the build (this is the default but make it explicit).
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
