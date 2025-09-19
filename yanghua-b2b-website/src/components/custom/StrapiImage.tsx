import Image from "next/image";
import { getStrapiURL } from "@/lib/utils";

interface StrapiImageProps {
  src: string;
  alt: string | null;
  className?: string;
  [key: string]: string | number | boolean | undefined | null;
}

export function StrapiImage({
  src,
  alt,
  className,
  ...rest
}: Readonly<StrapiImageProps>) {
  const imageUrl = getStrapiMedia(src);
  if (!imageUrl) return null;

  return <Image src={imageUrl} alt={alt || "No alt text provided."} className={className} {...rest} />;
}

export function getStrapiMedia(url: string | null) {
  if (url == null) return null;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http") || url.startsWith("//")) return url;
  
  // Handle absolute paths that are not Strapi uploads
  if (url.startsWith("/") && !url.startsWith("/uploads/")) {
    return url;
  }
  
  // Handle Strapi uploads - always prepend base URL
  if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
    const baseUrl = getStrapiURL();
    const cleanUrl = url.startsWith("/") ? url : "/" + url;
    return baseUrl + cleanUrl;
  }
  
  // Handle relative paths - prepend base URL
  const baseUrl = getStrapiURL();
  return baseUrl + (url.startsWith("/") ? url : "/" + url);
}