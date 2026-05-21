import type { Metadata } from 'next'
import './globals.css'
import { WebBuilderProvider } from '@/app/providers/WebBuilderProvider'
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary'
import { ThemeFontWrapper } from './components/ui/ThemeFontWrapper'
import { LanguageProvider } from '@/app/i18n/LanguageProvider'
import { getFaviconIcons, loadSiteForMetadata } from '@/app/lib/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSiteForMetadata()
  const icons = getFaviconIcons(site)
  return {
    title: site?.seo?.title || site?.business?.name || 'Web Builder Site',
    description:
      site?.seo?.description ||
      site?.business?.description ||
      'Generated site using Web Builder',
    ...(icons ? { icons } : {}),
  }
}

import Preloader from './components/ui/Preloader'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <WebBuilderProvider>
            <LanguageProvider>
              <ThemeFontWrapper>
                <main className="min-h-screen">
                  <Preloader />
                  {children}
                </main>
              </ThemeFontWrapper>
            </LanguageProvider>
          </WebBuilderProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
