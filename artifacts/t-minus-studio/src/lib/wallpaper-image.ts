/** Store a durable app path, but resolve it through the current artifact base. */
export function wallpaperImageUrl(source: string) {
  return source.startsWith('/api/artwork/')
    ? `${import.meta.env.BASE_URL.replace(/\/$/, '')}${source}`
    : source;
}
