import type { Metadata } from 'next'
import { Page, Site, Service, BlogPost, ServiceAreaPage } from './types'
import { getImageSrc } from './utils'
import api from './fetch-api'
import { unwrapApiPayload } from './api-response'

interface SEOData {
  title?: string
  description?: string
  keywords?: string[]
  ogImageUrl?: string
  noIndex?: boolean
}

export function getFaviconIcons(site?: Site | null): Metadata['icons'] | undefined {
  const raw = site?.seo?.faviconUrl
  if (!raw) return undefined
  const url = getImageSrc(raw)
  if (!url) return undefined
  return { icon: [{ url }] }
}

export async function loadSiteForMetadata(): Promise<Site | null> {
  const siteSlug = process.env.NEXT_PUBLIC_WEBBUILDER_SITE_SLUG
  if (!siteSlug) return null
  try {
    const response = await api.get(`/public/sites/${siteSlug}`)
    if (response && typeof response === 'object' && 'error' in response && response.error) {
      return null
    }
    return unwrapApiPayload<Site>(response)
  } catch {
    return null
  }
}

export function generateMetadata(seoData: SEOData, site?: Site): Metadata {
  const { title, description, keywords, ogImageUrl, noIndex } = seoData
  
  // Use site name as fallback and for title suffix
  const siteName = site?.business?.name || site?.name || 'Web Builder Site'
  const finalTitle = title ? `${title} | ${siteName}` : siteName
  
  const metadata: Metadata = {
    title: finalTitle,
    description: description || site?.business?.description || 'Generated site using Web Builder',
    keywords: keywords?.join(', ') || site?.seo?.keywords?.join(', '),
  }

  // Add Open Graph metadata
  if (ogImageUrl || site?.seo?.ogImageUrl) {
    metadata.openGraph = {
      title: finalTitle,
      description: description || site?.business?.description || 'Generated site using Web Builder',
      images: [
        {
          url: ogImageUrl || site?.seo?.ogImageUrl || '',
          width: 1200,
          height: 630,
          alt: finalTitle,
        },
      ],
    }
  }

  // Add robots meta tag for no-index
  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    }
  }

  const icons = getFaviconIcons(site)
  if (icons) metadata.icons = icons

  return metadata
}

export function getPageSeoData(page: Page | ServiceAreaPage): SEOData {
  return {
    title: page.seo?.title,
    description: page.seo?.description,
    keywords: page.seo?.keywords,
    ogImageUrl: page.seo?.ogImageUrl,
    noIndex: page.seo?.noIndex,
  }
}

export function getServiceSeoData(service: Service): SEOData {
  return {
    title: service.seo?.title || service.name,
    description: service.seo?.description,
    keywords: service.seo?.keywords,
    ogImageUrl: service.seo?.ogImageUrl,
    noIndex: false, // Services don't have noIndex in their schema
  }
}

export function getBlogPostSeoData(blogPost: BlogPost): SEOData {
  return {
    title: blogPost.seo?.title || blogPost.title,
    description: blogPost.seo?.description || blogPost.excerpt,
    keywords: blogPost.seo?.keywords,
    ogImageUrl: blogPost.seo?.ogImageUrl || blogPost.featuredImage?.url,
    noIndex: false, // Blog posts don't have noIndex in their schema
  }
}

export function getSiteSeoData(site: Site): SEOData {
  return {
    title: site.seo?.title,
    description: site.seo?.description,
    keywords: site.seo?.keywords,
    ogImageUrl: site.seo?.ogImageUrl,
    noIndex: false, // Sites don't have noIndex in their schema
  }
}
