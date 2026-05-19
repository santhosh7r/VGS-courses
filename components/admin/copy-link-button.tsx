'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

/**
 * Copies a student's signup link to the clipboard. Reusable any number of
 * times — e.g. to re-share with a pending student whose invite email failed
 * or was rate-limited. The link is built from the current origin so it works
 * on both localhost and the deployed site.
 */
export default function CopyLinkButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const link = `${window.location.origin}/auth/sign-up?email=${encodeURIComponent(email)}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked — show the link so it can still be copied manually.
      window.prompt('Copy this signup link:', link)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy signup link
        </>
      )}
    </Button>
  )
}
