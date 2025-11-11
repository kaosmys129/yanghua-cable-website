import type { QuoteBlock } from "@/lib/types"
import { X } from "lucide-react"

/**
 * Quote block with optional close icon
 * - When `onClose` is provided, a close icon appears in the top-right corner.
 * - This component can be embedded inside a modal to display quote content.
 */
export default function Quote({ data, onClose }: { data: QuoteBlock; onClose?: () => void }) {
  return (
    <div className="relative">
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
      <blockquote className="border-l-4 border-blue-500 pl-4 pr-10 my-8 italic bg-white rounded-lg">
        <p className="text-xl mb-2">{data.body}</p>
        {data.title && (
          <footer className="text-right font-medium">— {data.title}</footer>
        )}
      </blockquote>
    </div>
  )
}
