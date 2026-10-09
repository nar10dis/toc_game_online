import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // next dev only accepts its reload websocket (/_next/hmr) from localhost. Opened from
  // another device (https://<ip>:8443), the socket is refused and after 12 failed tries
  // the page reloads itself, in the middle of a game. Any IPv4 is fine: dev only.
  allowedDevOrigins: ["*.*.*.*"],
  // no floating Next.js "N" button in the corner during next dev
  devIndicators: false,
  // The login page is the first page of the site
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }];
  },
};

export default nextConfig;
