import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes NEXT_PUBLIC_API_BASE_URL to `{origin}/api` (see IMAGE_URL_GUIDE /
 * PUBLIC_ROUTES_DOCUMENTATION — files are served at /api/uploads/*).
 */
function getApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000/api')
  if (!raw) return ''
  return /\/api$/i.test(raw) ? raw : `${raw}/api`
}

function extractUploadsFilename(input: string): string | null {
  const matchPathname = (pathname: string) => {
    const m = pathname.match(/^\/(?:api\/)?uploads\/(.+)$/i)
    return m?.[1] ?? null
  }
  if (/^https?:\/\//i.test(input)) {
    try {
      return matchPathname(new URL(input).pathname)
    } catch {
      return null
    }
  }
  const p = input.replace(/^\//, '')
  const m = p.match(/^(?:api\/)?uploads\/(.+)$/i)
  return m?.[1] ?? null
}

/** Same-origin path proxied to the API via next.config rewrites (works with next/image). */
function uploadsPublicPath(filename: string): string {
  return `/api/uploads/${filename.replace(/^\//, '')}`
}

/**
 * Resolves image URLs for Media Library images via the public route /api/uploads/*.
 * - Same-origin absolute URLs under /uploads/ are rewritten to /api/uploads/
 * - Other absolute http(s) URLs are returned unchanged (aside from http→https when not local)
 */
export function getImageSrc(path: string | undefined | null | any): string {
  if (!path) return ''

  const pathStr = String(path)

  if (!pathStr) return ''

  if (pathStr.startsWith('data:')) return pathStr

  const apiBase = getApiBaseUrl()
  const isLocalApi = /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\b/i.test(
    apiBase
  )
  const resolvedApiBase = isLocalApi
    ? apiBase
    : apiBase.replace(/^http:\/\//i, 'https://')

  if (/^https?:\/\//i.test(pathStr)) {
    const isLocal = /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\b/i.test(
      pathStr
    )
    let out = isLocal ? pathStr : pathStr.replace(/^http:\/\//i, 'https://')
    if (!resolvedApiBase) return out
    try {
      const u = new URL(out)
      const apiOrigin = new URL(resolvedApiBase).origin
      const filename = extractUploadsFilename(pathStr)
      const isBackendUpload =
        u.pathname.startsWith('/uploads/') || u.pathname.startsWith('/api/uploads/')
      if (u.origin === apiOrigin && filename && isBackendUpload) {
        return uploadsPublicPath(filename)
      }
    } catch {
      /* ignore */
    }
    return out
  }

  if (!resolvedApiBase) {
    const rel = pathStr.replace(/^\//, '')
    const filenameOnly = extractUploadsFilename(rel) ?? rel.replace(/^(?:api\/)?uploads\//i, '')
    return `/api/uploads/${filenameOnly}`
  }

  const filenameFromPath = extractUploadsFilename(pathStr)
  if (filenameFromPath) {
    return uploadsPublicPath(filenameFromPath)
  }

  let cleanPath = pathStr.replace(/^\//, '')
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = cleanPath.slice('uploads/'.length)
  }
  if (cleanPath.startsWith('api/uploads/')) {
    cleanPath = cleanPath.slice('api/uploads/'.length)
  }

  return uploadsPublicPath(cleanPath)
}
