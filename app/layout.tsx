import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { AuthListener } from '@/components/AuthListener'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'BuildFlow',
  description: 'Experience smarter, generative planning with seamless documentation — empowering you to take control of your app architecture every day.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${outfit.variable} font-sans`}>
        <AuthListener />
        {children}
      </body>
    </html>
  )
}
