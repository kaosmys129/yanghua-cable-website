import Image from "next/image";

interface CmsImageProps {
  src: string;
  alt: string | null;
  className?: string;
  [key: string]: string | number | boolean | undefined | null;
}

export function CmsImage({
  src,
  alt,
  className,
  ...rest
}: Readonly<CmsImageProps>) {
  const imageUrl = getCmsMedia(src);
  if (!imageUrl) return null;

  return <Image src={imageUrl} alt={alt || "No alt text provided."} className={className} {...rest} />;
}

export function getCmsMedia(url: string | null) {
  if (url == null) return null;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http") || url.startsWith("//")) return url;

  if (url.startsWith("/")) {
    return url;
  }

  return `/${url.replace(/^\/+/, "")}`;
}
