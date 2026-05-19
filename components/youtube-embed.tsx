/**
 * Embedded YouTube player.
 *
 * Accepts any common YouTube URL form — `watch?v=…`, `youtu.be/…`, `/embed/…`,
 * `/shorts/…`, `/live/…` — and renders a responsive 16:9 player. If the URL is
 * not a recognisable YouTube video it falls back to a plain link, so a
 * non-YouTube video URL still works.
 *
 * No hooks / no client state — safe to use in Server Components.
 */

/** Extracts the 11-char video id from any common YouTube URL, else null. */
export function getYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
  ]
  for (const re of patterns) {
    const match = url.match(re)
    if (match) return match[1]
  }
  return null
}

export default function YouTubeEmbed({
  url,
  title = 'Lesson video',
}: {
  url: string
  title?: string
}) {
  const id = getYouTubeId(url)

  // Not a YouTube link — keep the URL usable as a plain link.
  if (!id) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline break-all"
      >
        {url}
      </a>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  )
}
