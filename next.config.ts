
import type {NextConfig} from 'next';

// IMPORTANT: Replace 'your-repo-name' with the actual name of your GitHub repository.
const repoName = 'Tennis-Charting.git';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // Enables static HTML export
  basePath: isProd ? `/${repoName}` : '', // Prefixes paths with the repo name for GitHub Pages
  assetPrefix: isProd ? `/${repoName}/` : '', // Prefixes asset paths for GitHub Pages
  trailingSlash: false, // Recommended for cleaner URLs with static exports

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for static export if using next/image with local images. External images are fine.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
