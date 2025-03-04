/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://auth-api:1234/auth/:path*',
      },
      {
        source: '/api/database/:path*',
        destination: 'http://database-api:1236/:path*',
      },
      {
        source: '/api/documents/:path*',
        destination: 'http://files-handler-api:1238/:path*',
      },
    ];
  },
};

module.exports = nextConfig;