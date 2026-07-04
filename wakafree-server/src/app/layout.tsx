import type { Metadata } from 'next'
import { Geist, Fragment_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const fragmentMono = Fragment_Mono({ subsets: ['latin'], weight: '400', variable: '--font-mono' })

export const metadata: Metadata = {
  title: "Farhan's WakaFree",
  description: 'Self-hosted coding time tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${fragmentMono.variable} font-sans bg-surface text-onsurface antialiased`}>
        {children}
      </body>
    </html>
  )
}
