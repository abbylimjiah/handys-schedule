/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/handys-schedule',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
