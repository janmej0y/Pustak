"use client";

import { useEffect, useRef } from "react";
import type { FormEvent } from "react";

interface PostFormProps {
  title: string;
  body: string;
  isSubmitting: boolean;
  editingPostId: number | null;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onCancelEdit: () => void;
}

export default function PostForm({
  title,
  body,
  isSubmitting,
  editingPostId,
  onTitleChange,
  onBodyChange,
  onSubmit,
  onCancelEdit,
}: PostFormProps) {
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const isEditing = editingPostId !== null;
  const titleError =
    title.length > 0 && !trimmedTitle ? "Title cannot be blank." : "";
  const bodyError =
    body.length > 0 && !trimmedBody ? "Body cannot be blank." : "";
  const isFormInvalid =
    !trimmedTitle ||
    !trimmedBody ||
    Boolean(titleError) ||
    Boolean(bodyError) ||
    isSubmitting;

  useEffect(() => {
    const textarea = bodyTextareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 192 ? "auto" : "hidden";
  }, [body]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isFormInvalid) {
      return;
    }

    await onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="font-mono text-xs uppercase text-blue-600">
          {isEditing ? `Editing / ID ${editingPostId}` : "Create Post"}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-950">
          {isEditing ? "Update selected post" : "Add a new update"}
        </h1>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-end justify-between gap-3">
            <label
              htmlFor="post-title"
              className="text-sm font-semibold text-slate-900"
            >
              Title
            </label>
            <span className="font-mono text-[11px] text-slate-500">
              {title.length} / 120
            </span>
          </div>
          <input
            id="post-title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            maxLength={120}
            placeholder="A crisp post title"
            className="mt-1.5 w-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-950 outline-none transition-colors duration-100 placeholder:text-slate-500 focus:border-blue-600 focus:bg-white focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600"
          />
          {titleError ? (
            <span className="mt-1 block text-xs font-semibold text-[#D00]">
              {titleError}
            </span>
          ) : null}
        </div>

        <div>
          <div className="flex items-end justify-between gap-3">
            <label
              htmlFor="post-body"
              className="text-sm font-semibold text-slate-900"
            >
              Body
            </label>
            <span className="font-mono text-[11px] text-slate-500">
              {body.length} / 1000
            </span>
          </div>
          <textarea
            id="post-body"
            ref={bodyTextareaRef}
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Write the details here..."
            className="mt-1.5 max-h-48 min-h-24 w-full resize-none border border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition-colors duration-100 placeholder:text-slate-500 focus:border-blue-600 focus:bg-white focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600"
          />
          {bodyError ? (
            <span className="mt-1 block text-xs font-semibold text-[#D00]">
              {bodyError}
            </span>
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-4">
        <div className={isEditing ? "grid grid-cols-[1fr_auto] gap-2" : ""}>
          <button
            type="submit"
            disabled={isFormInvalid}
            className="inline-flex h-10 w-full items-center justify-center bg-blue-600 px-4 text-sm font-semibold text-white outline-none transition-opacity duration-100 hover:opacity-90 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          >
            {isSubmitting ? (
              <span className="font-mono text-xs uppercase">WAIT...</span>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Publish Post"
            )}
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSubmitting}
              className="h-10 border border-slate-300 bg-white px-3 font-mono text-xs font-semibold uppercase text-slate-800 outline-none transition-colors duration-100 hover:bg-slate-100 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
