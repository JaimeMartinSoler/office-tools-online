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
  webpack: (config) => {
    // Force a Node-crypto hash instead of webpack's bundled WASM xxhash, which
    // crashes during build (`WasmHash._updateWithBuffer` → reading 'length' of
    // undefined) in this Next/webpack version.
    config.output.hashFunction = "sha256";
    return config;
  },
};

export default nextConfig;
