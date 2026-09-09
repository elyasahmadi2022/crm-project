import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/admin/dashboard",
        permanent: true,
      },
    ]
  },

  // Turbopack — mark the Node.js build of face-api as server-only
  // so it never gets pulled into the client bundle
  turbopack: {},

  // Also handle webpack fallback (in case --webpack flag is used)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {}
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        // Force the browser ESM build on the client
        "@vladmandic/face-api": require.resolve(
          "@vladmandic/face-api/dist/face-api.esm.js"
        ),
      }
    }
    return config
  },
}

export default nextConfig
