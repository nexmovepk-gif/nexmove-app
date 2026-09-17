/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/submit-listing',
        destination: '/dashboard/add-property',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
