import type { QuoteBlock } from "@/lib/types"
import { X } from "lucide-react"

/**
 * Quote block with optional close icon
 * - When `onClose` is provided, a close icon appears in the top-right corner.
 * - This component can be embedded inside a modal to display quote content.
 */
export default function Quote({ data, onClose }: { data: QuoteBlock; onClose?: () => void }) {
  return (
    <div className="relative my-10">
      {onClose && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <blockquote className="relative overflow-hidden rounded-[24px] border border-amber-100 bg-[linear-gradient(135deg,#fff7e6_0%,#fffdf7_100%)] px-6 py-6 pr-10 shadow-[0_24px_70px_-45px_rgba(217,119,6,0.35)]">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-amber-500" />
        <p className="text-lg leading-8 text-slate-800 sm:text-xl">“{data.body}”</p>
        {data.title && (
          <footer className="mt-4 text-right text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">— {data.title}</footer>
        )}
      </blockquote>
    </div>
  )
}
