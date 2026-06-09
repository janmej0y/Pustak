"use client";

import type { FormEvent } from "react";

interface PostFormProps {
  title: string;
  body: string;
  isSubmitting: boolean;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}

export default function PostForm({
  title,
  body,
  isSubmitting,
  onTitleChange,
  onBodyChange,
  onSubmit,
}: PostFormProps) {
  const isFormInvalid = !title.trim() || !body.trim() || isSubmitting;

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
      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition duration-300 hover:shadow-md"
    >
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          Create Post
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
          Add a new update
        </h1>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Title</span>
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            maxLength={120}
            placeholder="A crisp post title"
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition duration-200 placeholder:text-zinc-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Body</span>
          <textarea
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            maxLength={1000}
            rows={7}
            placeholder="Write the details here..."
            className="mt-2 w-full resize-none rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition duration-200 placeholder:text-zinc-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isFormInvalid}
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-teal-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Publishing
          </span>
        ) : (
          "Publish Post"
        )}
      </button>
    </form>
  );
}
