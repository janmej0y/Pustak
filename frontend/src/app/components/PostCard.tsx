"use client";

import { Pencil, Trash2 } from "lucide-react";

import type { Post } from "../types";

interface PostCardProps {
  post: Post;
  isDeleting: boolean;
  isEditing: boolean;
  onEdit: (post: Post) => void;
  onRequestDelete: (post: Post) => void;
}

export default function PostCard({
  post,
  isDeleting,
  isEditing,
  onEdit,
  onRequestDelete,
}: PostCardProps) {
  const formattedPostId =
    post.id < 0 ? "TMP" : post.id.toString().padStart(2, "0");
  const createdLabel = formatPostDate(post.created_at);
  const updatedLabel = formatPostDate(post.updated_at);

  return (
    <article
      className={`grid border bg-white transition-colors duration-100 hover:border-slate-300 hover:bg-slate-50 md:grid-cols-[8rem_minmax(0,1fr)_13rem] ${
        isEditing ? "border-blue-600" : "border-slate-200"
      }`}
    >
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 md:border-b-0 md:border-r">
        <p className="font-mono text-xs font-semibold text-slate-700">
          [ID: {formattedPostId}]
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase text-slate-500">
          Record
        </p>
      </div>

      <div className="min-w-0 px-4 py-3">
        <h2 className="text-lg font-semibold leading-6 text-slate-950">
          {post.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-900">{post.body}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase text-slate-500">
          <span>Created {createdLabel}</span>
          <span>Updated {updatedLabel}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 md:flex-col md:items-stretch md:justify-center md:border-l md:border-t-0">
        <button
          type="button"
          aria-label={`Edit ${post.title}`}
          onClick={() => onEdit(post)}
          disabled={isDeleting}
          className="inline-flex h-8 items-center justify-center gap-1.5 border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-800 outline-none transition-colors duration-100 hover:border-blue-600 hover:text-blue-600 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
          <span className="font-mono text-xs uppercase">
            {isEditing ? "Editing" : "Edit"}
          </span>
        </button>
        <button
          type="button"
          aria-label={`Delete ${post.title}`}
          onClick={() => onRequestDelete(post)}
          disabled={isDeleting}
          className="inline-flex h-8 items-center justify-center gap-1.5 border border-transparent px-2.5 text-sm font-semibold text-red-600 outline-none transition-colors duration-100 hover:border-red-600 hover:bg-red-600 hover:text-white focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          <span className="font-mono text-xs uppercase">
            {isDeleting ? "WAIT..." : "Delete"}
          </span>
        </button>
      </div>
    </article>
  );
}

function formatPostDate(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsedDate);
}
