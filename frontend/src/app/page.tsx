"use client";

import { useCallback, useEffect, useState } from "react";

import PostCard from "./components/PostCard";
import PostForm from "./components/PostForm";
import SkeletonLoader from "./components/SkeletonLoader";
import type { Post } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "/_/backend"
    : "http://localhost:8000");

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
    window.setTimeout(() => setError(null), 4200);
  }, []);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load posts. Please try again.");
      }

      const fetchedPosts: Post[] = await response.json();
      setPosts(fetchedPosts);
    } catch (fetchError) {
      showError(
        fetchError instanceof Error
          ? fetchError.message
          : "Something went wrong while loading posts.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const createPost = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody) {
      showError("Title and body are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          body: trimmedBody,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(
          errorPayload?.detail?.[0]?.msg ??
            errorPayload?.detail ??
            "Unable to create post.",
        );
      }

      const createdPost: Post = await response.json();
      setPosts((currentPosts) => [createdPost, ...currentPosts]);
      setTitle("");
      setBody("");
    } catch (createError) {
      showError(
        createError instanceof Error
          ? createError.message
          : "Something went wrong while creating the post.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePost = async (postId: number) => {
    setDeletingPostId(postId);

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.detail ?? "Unable to delete post.");
      }

      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId),
      );
    } catch (deleteError) {
      showError(
        deleteError instanceof Error
          ? deleteError.message
          : "Something went wrong while deleting the post.",
      );
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[380px_1fr] md:px-8 lg:py-14">
        <aside className="md:sticky md:top-8 md:self-start">
          <PostForm
            title={title}
            body={body}
            isSubmitting={isSubmitting}
            onTitleChange={setTitle}
            onBodyChange={setBody}
            onSubmit={createPost}
          />
        </aside>

        <section aria-labelledby="posts-heading">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
                MyPustak Feed
              </p>
              <h2
                id="posts-heading"
                className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950"
              >
                All Posts
              </h2>
            </div>
            <span className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          </div>

          {isLoading ? (
            <SkeletonLoader />
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isDeleting={deletingPostId === post.id}
                  onDelete={deletePost}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-950">
                No posts yet
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Create the first post from the form.
              </p>
            </div>
          )}
        </section>
      </section>

      {error ? (
        <div
          role="alert"
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 shadow-lg"
        >
          {error}
        </div>
      ) : null}
    </main>
  );
}
