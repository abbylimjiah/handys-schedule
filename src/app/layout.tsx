import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '핸디즈 BQ 스케줄',
  description: '핸디즈 지점 스케줄 관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
