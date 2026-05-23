"use client";

/* eslint-disable @next/next/no-img-element */

import {
  Grid3X3,
  Heart,
  ImageOff,
  MessageCircle,
  PlusSquare,
} from "lucide-react";
import type { ProfilePost, ProfilePostImage } from "@/types/profile";

type ProfileGridProps = {
  posts?: ProfilePost[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onCreatePost?: () => void;
  onPostClick?: (post: ProfilePost) => void;
};

const API_BASE_URL = "https://instagram-api.softclub.tj";
const IMAGE_BASE_URL = `${API_BASE_URL}/images`;

function getPostId(post: ProfilePost, index: number) {
  return String(post.id ?? post.postId ?? index);
}

function normalizeImageUrl(value: string) {
  if (!value) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(value)) {
    return value;
  }

  const cleanValue = value.replace(/^\/+/, "");
  if (cleanValue.startsWith("images/")) {
    return `${API_BASE_URL}/${cleanValue}`;
  }

  return `${IMAGE_BASE_URL}/${cleanValue}`;
}

function isVideoUrl(url?: string) {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".avi") ||
    cleanUrl.endsWith(".mkv") ||
    cleanUrl.includes("/video") ||
    url.startsWith("blob:video/")
  );
}

function getImageFromObject(image: ProfilePostImage) {
  return (
    image.imageUrl ??
    image.url ??
    image.image ??
    image.imageName ??
    image.ImageName ??
    image.name ??
    image.fileName ??
    image.path ??
    ""
  );
}

function getFirstImageFromArray(images?: Array<string | ProfilePostImage>) {
  if (!images?.length) {
    return "";
  }

  const firstImage = images[0];
  return typeof firstImage === "string"
    ? firstImage
    : getImageFromObject(firstImage);
}

function getPostMedia(post: ProfilePost) {
  const media =
    post.mediaUrl ??
    post.imageUrl ??
    post.image ??
    post.url ??
    post.imageName ??
    getFirstImageFromArray(post.images) ??
    getFirstImageFromArray(post.Images) ??
    getFirstImageFromArray(post.postImages) ??
    getFirstImageFromArray(post.photos) ??
    "";

  return normalizeImageUrl(media);
}

function getPostCaption(post: ProfilePost) {
  return post.caption ?? post.content ?? post.title ?? "";
}

function getLikeCount(post: ProfilePost) {
  const baseLikes = post.likesCount ?? post.likeCount ?? 0;
  if (post.postLike && baseLikes === 0) {
    return 1;
  }
  return baseLikes;
}

function getCommentCount(post: ProfilePost) {
  if (Array.isArray(post.comments)) {
    return post.comments.length;
  }
  return post.commentsCount ?? post.commentCount ?? 0;
}

export default function ProfileGrid({
  posts = [],
  isLoading = false,
  isError = false,
  errorMessage = "Не удалось загрузить публикации.",
  onCreatePost,
  onPostClick,
}: ProfileGridProps) {
  if (isLoading) {
    return (
      <section className="mx-auto grid max-w-4xl grid-cols-3 gap-1 px-4 py-1 sm:gap-2 sm:px-8">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-sm bg-zinc-900"
          />
        ))}
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 px-4 py-16 text-center text-zinc-400 sm:px-8">
        <ImageOff className="h-10 w-10 text-zinc-600" />
        <p className="text-sm">{errorMessage}</p>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 px-4 py-16 text-center sm:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700">
          <Grid3X3 className="h-7 w-7 text-zinc-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">
            Публикаций пока нет
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Когда появятся публикации, они будут отображаться здесь.
          </p>
        </div>
        {onCreatePost ? (
          <button
            type="button"
            onClick={onCreatePost}
            className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            <PlusSquare className="h-4 w-4" />
            Создать публикацию
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-4xl grid-cols-3 gap-1 px-4 py-1 sm:gap-2 sm:px-8">
      {posts.map((post, index) => {
        const mediaUrl = getPostMedia(post);

        return (
          <div
            key={getPostId(post, index)}
            onClick={() => onPostClick?.(post)}
            className="group relative aspect-square overflow-hidden rounded-sm bg-zinc-900 cursor-pointer"
            title={getPostCaption(post)}
          >
            {mediaUrl ? (
              <>
                {isVideoUrl(mediaUrl) ? (
                  <video
                    src={mediaUrl}
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={getPostCaption(post) || "Profile post"}
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-7 bg-black/0 opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                    <Heart className="h-5 w-5 fill-white" />
                    {getLikeCount(post)}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                    <MessageCircle className="h-5 w-5 fill-white" />
                    {getCommentCount(post)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageOff className="h-8 w-8 text-zinc-700" />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
