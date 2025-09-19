import type { Block } from "@/lib/types"
import RichText from "./blocks/RichText"
import Quote from "./blocks/quote"
import Media from "./blocks/media"
import Slider from "./blocks/slider"

export default function BlockRenderer({ block }: { block: Block }) {
  // Use the __component property to determine which component to render
  switch (block.__component) {
    case "shared.rich-text":
      return <RichText data={block} />
    case "shared.quote":
      return <Quote data={block} />
    case "shared.media":
      return <Media data={block} />
    case "shared.slider":
      return <Slider data={block} />
    default:
      console.warn(`Unknown block type: ${(block as any).__component}`)
      return null
  }
}
