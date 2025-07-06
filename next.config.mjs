/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
    domains: [
      'm.media-amazon.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos',
      'source.unsplash.com',
      'cdn.shopify.com',
      'static.nike.com',
      'assets.adidas.com',
      'images-na.ssl-images-amazon.com',
      'i.imgur.com',
      'upload.wikimedia.org'
    ]
  }
}

export default nextConfig
