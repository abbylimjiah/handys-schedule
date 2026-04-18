import type { Metadata, Viewport } from 'next'
import './globals.css'
import PWARegister from '@/components/PWARegister'

export const metadata: Metadata = {
  title: 'opssp-schedule',
  description: '핸디즈 BQ 스케줄 관리',
  manifest: '/handys-schedule/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'opssp-schedule',
  },
  icons: {
    icon: [
      { url: '/handys-schedule/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/handys-schedule/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/handys-schedule/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#5b3a2a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <PWARegister />
        {children}
      </body>
    </html>
  )
}
