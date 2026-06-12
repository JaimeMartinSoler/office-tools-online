/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export — no server runtime, no API routes. This is the
  // structural guarantee behind "user data never leaves the browser".
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
