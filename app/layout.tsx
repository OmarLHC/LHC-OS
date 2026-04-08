import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LHC OS — Lighthouse Construction',
  description: 'Internal operating system for Lighthouse Construction',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
