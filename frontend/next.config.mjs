/**
 * NexoAgent frontend — Next.js config.
 *
 * Backend proxy: the FastAPI backend does not (yet) enable CORS, so the browser
 * talks to this Next.js server at `/api/v1/*` and Next rewrites those requests
 * to BACKEND_ORIGIN. This keeps the backend untouched and avoids hard-coding
 * the backend URL in client code. See README → "Environment variables".
 */
const backendOrigin = (process.env.BACKEND_ORIGIN || "http://127.0.0.1:8000").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${backendOrigin}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
