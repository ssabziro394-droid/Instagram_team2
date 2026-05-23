/**
 * Resolves API file names to full URLs.
 * Handles fallbacks for missing images or videos.
 */
export function getFileUrl(filename: string | null | undefined, type: "avatar" | "post" | "reel" = "post"): string {
  // Treat empty strings the same as null/undefined
  if (!filename || filename.trim() === "") {
    if (type === "avatar") {
      return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYTkyMzI4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI1Ii8+PHBhdGggZD0iTTIwIDIxYTggOCAwIDEgMC0xNiAwIi8+PC9zdmc+";
    }
    if (type === "reel") {
      return ""; // No fallback for videos
    }
    return ""; // No fallback for post image
  }

  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://instagram-api.softclub.tj";
  const cleanFilename = filename.startsWith("/") ? filename.slice(1) : filename;

  // Route video files to /videos/ folder, images to /images/
  const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
  const isVideo = videoExtensions.some((ext) => cleanFilename.toLowerCase().endsWith(ext));

  if (isVideo) {
    return `${baseUrl}/videos/${cleanFilename}`;
  }

  return `${baseUrl}/images/${cleanFilename}`;
}
