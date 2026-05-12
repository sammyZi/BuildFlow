import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Architect Hub',
  description: 'Transform app ideas into developer-ready documentation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
