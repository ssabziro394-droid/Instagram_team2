"use client";

import { Grid3X3, ImageOff } from "lucide-react";
import type { ProfilePost } from "@/types/profile";

type ProfileGridProps = {
  posts?: ProfilePost[];
  isLoading?: boolean;
  isError?: boolean;
};

function getPostId(post: ProfilePost, index: number) {
  return String(post.id ?? post.postId ?? index);
}

function getPostMedia(post: ProfilePost) {
  return post.mediaUrl ?? post.imageUrl ?? post.image ?? post.url ?? "";
}

export default function ProfileGrid({
  posts = [],
  isLoading = false,
  isError = false,
}: ProfileGridProps) {
  if (isLoading) {
    return (
      <section className="mx-auto grid max-w-4xl grid-cols-3 gap-1 px-4 py-1 sm:gap-2 sm:px-8">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-sm bg-ig-card-bg"
          />
        ))}
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 px-4 py-16 text-center text-ig-secondary sm:px-8">
        <ImageOff className="h-10 w-10 text-zinc-600" />
        <p className="text-sm">Could not load profile posts.</p>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 px-4 py-16 text-center sm:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-ig-border">
          <Grid3X3 className="h-7 w-7 text-ig-secondary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ig-fg">
            Публикаций пока нет
          </h2>
          <p className="mt-1 text-sm text-ig-secondary">
            Когда появятся публикации, они будут отображаться здесь.
          </p>
        </div>
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
            className="aspect-square overflow-hidden rounded-sm bg-ig-card-bg"
            title={post.caption}
          >
            {mediaUrl ? (
              <div
                className="h-full w-full bg-cover bg-center transition duration-200 hover:scale-105"
                style={{ backgroundImage: `url(${mediaUrl})` }}
              />
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
