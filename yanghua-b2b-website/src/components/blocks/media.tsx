import Image from "next/image"
import type { MediaBlock } from "@/lib/types"
import { StrapiImage } from "../custom/StrapiImage"

export default function Media({ data }: { data: MediaBlock }) {
  // Check if file exists
  if (!data.file) {
    console.warn('Media block missing file data:', data);
    return null;
  }

  return (
    <div className="my-8">
      <div className="relative w-full h-96 rounded-lg overflow-hidden">
        <StrapiImage
          src={data.file.url || "/placeholder.svg?height=600&width=1200&query=media"}
          alt={data.file.alternativeText || "Media"}
          fill
          className="object-cover"
        />
      </div>
      {data.file.alternativeText && (
        <p className="text-center text-sm text-gray-500 mt-2">{data.file.alternativeText}</p>
      )}
    </div>
  )
}
