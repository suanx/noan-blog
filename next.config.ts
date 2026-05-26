import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.yourdomain.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  // EdgeOne Pages 使用 Node.js 运行时（兼容 @libsql/client/web）
  // 如需 Edge Runtime，请在单个 route.js 中添加 export const runtime = 'edge';
};

export default nextConfig;
