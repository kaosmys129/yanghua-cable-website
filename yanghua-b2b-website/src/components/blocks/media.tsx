import type { MediaBlock } from "@/lib/types"
import { CmsImage } from "../custom/CmsImage"

export default function Media({ data }: { data: MediaBlock }) {
  // Check if file exists
  if (!data.file) {
    console.warn('Media block missing file data:', data);
    return null;
  }

  return (
    <figure className="my-10">
      <div className="relative h-64 w-full overflow-hidden rounded-[24px] bg-slate-100 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)] sm:h-80 lg:h-96">
        <CmsImage
          src={data.file.url || "/placeholder.svg?height=600&width=1200&query=media"}
          alt={data.file.alternativeText || "Media"}
          fill
          sizes="(max-width: 768px) 100vw, 100vw"
          className="object-cover"
        />
      </div>
      {data.file.alternativeText && (
        <figcaption className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-slate-500">{data.file.alternativeText}</figcaption>
      )}
    </figure>
  )
}
