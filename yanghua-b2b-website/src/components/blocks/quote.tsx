import type { QuoteBlock } from "@/lib/types"

export default function Quote({ data }: { data: QuoteBlock }) {
  return (
    <blockquote className="border-l-4 border-blue-500 pl-4 my-8 italic">
      <p className="text-xl mb-2">{data.body}</p>
      {data.title && <footer className="text-right font-medium">— {data.title}</footer>}
    </blockquote>
  )
}
