/**
 * Resolves API file names to full URLs.
 * Handles fallbacks for missing images or videos.
 */
export function getFileUrl(filename: string | null | undefined, type: "avatar" | "post" | "reel" = "post"): string {
  if (!filename) {
    if (type === "avatar") {
      return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"; // Premium fallback avatar
    }
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"; // Premium abstract fallback gradient
  }

  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://instagram-api.softclub.tj";
  // The server stores files in static folder, usually accessible at /images/{filename} or directly at /{filename}
  // Let's normalize by removing leading slashes if present
  const cleanFilename = filename.startsWith("/") ? filename.slice(1) : filename;
  
  return `${baseUrl}/images/${cleanFilename}`;
}
