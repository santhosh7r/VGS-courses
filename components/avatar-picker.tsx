'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shuffle, Upload, Check } from 'lucide-react'

const STYLES = ['notionists', 'glass', 'thumbs', 'shapes', 'fun-emoji', 'lorelei']
const dice = (style: string, seed: string) =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed || 'avatar')}`

function parse(value: string, fallbackSeed: string) {
  if (value?.startsWith('data:')) return { uploaded: value, style: STYLES[0], seed: fallbackSeed }
  const m = value?.match(/dicebear\.com\/9\.x\/([^/]+)\/svg\?seed=([^&]+)/)
  if (m) return { uploaded: null, style: m[1], seed: decodeURIComponent(m[2]) }
  if (value) return { uploaded: value, style: STYLES[0], seed: fallbackSeed }
  return { uploaded: null, style: STYLES[0], seed: fallbackSeed }
}

/**
 * Premium avatar picker — generated DiceBear styles, an avatar nickname (seed),
 * or an uploaded photo. No raw URLs are ever shown to the user.
 */
export default function AvatarPicker({
  value,
  name,
  onChange,
}: {
  value: string
  name?: string
  onChange: (url: string) => void
}) {
  const fallbackSeed = name?.trim() || 'avatar'
  const init = parse(value || '', fallbackSeed)
  const [style, setStyle] = useState(init.style)
  const [seed, setSeed] = useState(init.seed)
  const [uploaded, setUploaded] = useState<string | null>(init.uploaded)
  const fileRef = useRef<HTMLInputElement>(null)

  const avatar = uploaded ?? dice(style, seed)

  // Push the effective avatar up whenever it changes.
  useEffect(() => {
    onChange(avatar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const SIZE = 256
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const scale = Math.max(SIZE / img.width, SIZE / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
        setUploaded(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-5">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={avatar}
            src={avatar}
            alt="Your avatar"
            className="h-24 w-24 rounded-2xl border border-border bg-muted object-cover animate-[avatarPop_0.35s_ease]"
          />
        </div>
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setUploaded(null)
              setSeed('a' + Math.random().toString(36).slice(2, 9))
            }}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload photo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Style cards */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Avatar style</p>
        <div className="grid grid-cols-6 gap-2">
          {STYLES.map((s) => {
            const active = !uploaded && style === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setUploaded(null)
                  setStyle(s)
                }}
                className={cn(
                  'relative rounded-xl border p-1.5 transition-all hover:border-primary/50',
                  active ? 'border-primary ring-2 ring-primary/20' : 'border-border',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dice(s, seed)}
                  alt={s}
                  className="aspect-square w-full rounded-lg bg-muted"
                />
                {active && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Nickname seed */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Avatar nickname
        </label>
        <Input
          value={uploaded ? '' : seed}
          placeholder="Type a nickname to generate a unique avatar"
          onChange={(e) => {
            setUploaded(null)
            setSeed(e.target.value)
          }}
        />
      </div>

      <style>{`@keyframes avatarPop{0%{opacity:0;transform:scale(.82)}100%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}
