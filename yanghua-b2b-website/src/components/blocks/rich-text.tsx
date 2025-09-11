import Markdown from "react-markdown"
import type { RichTextBlock } from "@/lib/types"

export default function RichText({ data }: { data: RichTextBlock }) {
  return (
    <div className="my-8">
      <Markdown>{data.body}</Markdown>
    </div>
  )
}
