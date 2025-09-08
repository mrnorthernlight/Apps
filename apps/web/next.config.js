/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ['@fambase/shared', '@fambase/crypto', '@fambase/database', '@fambase/ui']
  },
  images: {
    domains: ['localhost', 'your-supabase-project.supabase.co']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
}

module.exports = nextConfig

