"use client";

import { Trash2 } from "lucide-react";

import type { Post } from "../types";

interface PostCardProps {
  post: Post;
  isDeleting: boolean;
  onDelete: (postId: number) => Promise<void>;
}

export default function PostCard({ post, isDeleting, onDelete }: PostCardProps) {
  const handleDelete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${post.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    void onDelete(post.id);
  };

  return (
    <article className="group rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Post #{post.id}
          </p>
          <h2 className="mt-2 text-lg font-semibold leading-7 text-zinc-950">
            {post.title}
          </h2>
        </div>

        <button
          type="button"
          aria-label={`Delete ${post.title}`}
          onClick={handleDelete}
          disabled={isDeleting}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-red-100 bg-red-50 text-red-600 transition duration-200 hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
          ) : (
            <Trash2 aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-600">{post.body}</p>
    </article>
  );
}
