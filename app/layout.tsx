import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solomon',
  description: 'Created with v0',
  icons: {
    icon: '/images.png'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
