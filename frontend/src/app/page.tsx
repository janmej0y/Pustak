"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter, RefreshCcw, Search } from "lucide-react";

import LoadingFeed from "./components/LoadingFeed";
import PostCard from "./components/PostCard";
import PostForm from "./components/PostForm";
import type { Post } from "./types";

type ApiStatus = "checking" | "online" | "offline";
type NoticeKind = "success" | "error" | "warning";
type StatusFilter = "all" | "recent" | "long" | "short";
type UnsavedAction =
  | { type: "cancel" }
  | { type: "edit"; post: Post }
  | { type: "delete"; post: Post };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "/_/backend"
    : "http://localhost:8000");

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [notice, setNotice] = useState<{
    kind: NoticeKind;
    message: string;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingSnapshot, setEditingSnapshot] = useState<Post | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [pendingDeletePost, setPendingDeletePost] = useState<Post | null>(null);
  const [pendingUnsavedAction, setPendingUnsavedAction] =
    useState<UnsavedAction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const deleteCancelButtonRef = useRef<HTMLButtonElement>(null);
  const unsavedCancelButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const showNotice = useCallback((kind: NoticeKind, message: string) => {
    setNotice({ kind, message });
    window.setTimeout(() => setNotice(null), 4200);
  }, []);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);
    setApiStatus("checking");

    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load posts. Please try again.");
      }

      const fetchedPosts: Post[] = await response.json();
      setPosts(fetchedPosts);
      setApiStatus("online");
      setLastSyncedAt(new Date());
    } catch (fetchError) {
      setApiStatus("offline");
      showNotice(
        "error",
        fetchError instanceof Error
          ? fetchError.message
          : "Something went wrong while loading posts.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const clearForm = () => {
    setTitle("");
    setBody("");
    setEditingPostId(null);
    setEditingSnapshot(null);
  };

  const hasUnsavedChanges =
    editingSnapshot !== null &&
    (title !== editingSnapshot.title || body !== editingSnapshot.body);

  const isDuplicatePost = (postId: number | null) => {
    const normalizedTitle = title.trim().toLowerCase();
    const normalizedBody = body.trim().toLowerCase();

    return posts.some(
      (post) =>
        post.id !== postId &&
        post.title.trim().toLowerCase() === normalizedTitle &&
        post.body.trim().toLowerCase() === normalizedBody,
    );
  };

  const savePost = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    const isEditing = editingPostId !== null;

    if (!trimmedTitle || !trimmedBody) {
      showNotice("error", "Title and body are required.");
      return;
    }

    if (isDuplicatePost(editingPostId)) {
      showNotice(
        "warning",
        "A post with the same title and body already exists.",
      );
      return;
    }

    setIsSubmitting(true);
    const previousPosts = posts;
    const previousForm = {
      title,
      body,
      editingPostId,
      editingSnapshot,
    };
    const now = new Date().toISOString();
    const optimisticPost: Post = {
      id: editingPostId ?? -Date.now(),
      title: trimmedTitle,
      body: trimmedBody,
      created_at: editingSnapshot?.created_at ?? now,
      updated_at: now,
    };

    setPosts((currentPosts) =>
      isEditing
        ? currentPosts.map((post) =>
            post.id === optimisticPost.id ? optimisticPost : post,
          )
        : [optimisticPost, ...currentPosts],
    );
    clearForm();

    try {
      const response = await fetch(
        isEditing
          ? `${API_BASE_URL}/posts/${optimisticPost.id}`
          : `${API_BASE_URL}/posts`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: trimmedTitle,
            body: trimmedBody,
          }),
        },
      );

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(
          errorPayload?.detail?.[0]?.msg ??
            errorPayload?.detail ??
            (isEditing ? "Unable to update post." : "Unable to create post."),
        );
      }

      const savedPost: Post = await response.json();
      setPosts((currentPosts) =>
        isEditing
          ? currentPosts.map((post) =>
              post.id === savedPost.id ? savedPost : post,
            )
          : currentPosts.map((post) =>
              post.id === optimisticPost.id ? savedPost : post,
            ),
      );
      setApiStatus("online");
      setLastSyncedAt(new Date());
      showNotice(
        "success",
        isEditing ? "Post updated successfully" : "Post created successfully",
      );
    } catch (saveError) {
      setPosts(previousPosts);
      setTitle(previousForm.title);
      setBody(previousForm.body);
      setEditingPostId(previousForm.editingPostId);
      setEditingSnapshot(previousForm.editingSnapshot);
      showNotice(
        "error",
        saveError instanceof Error
          ? saveError.message
          : "Something went wrong while saving the post.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditingSnapshot(post);
    setTitle(post.title);
    setBody(post.body);
  };

  const requestCancelEdit = () => {
    if (hasUnsavedChanges) {
      lastFocusedElementRef.current = document.activeElement as HTMLElement;
      setPendingUnsavedAction({ type: "cancel" });
      return;
    }

    clearForm();
  };

  const requestEditPost = (post: Post) => {
    if (editingPostId === post.id) {
      return;
    }

    if (hasUnsavedChanges && editingPostId !== post.id) {
      lastFocusedElementRef.current = document.activeElement as HTMLElement;
      setPendingUnsavedAction({ type: "edit", post });
      return;
    }

    startEditingPost(post);
  };

  const requestDeletePost = (post: Post) => {
    if (hasUnsavedChanges && editingPostId === post.id) {
      lastFocusedElementRef.current = document.activeElement as HTMLElement;
      setPendingUnsavedAction({ type: "delete", post });
      return;
    }

    lastFocusedElementRef.current = document.activeElement as HTMLElement;
    setPendingDeletePost(post);
  };

  const runUnsavedAction = () => {
    const action = pendingUnsavedAction;
    setPendingUnsavedAction(null);

    if (!action) {
      return;
    }

    if (action.type === "cancel") {
      clearForm();
      return;
    }

    if (action.type === "edit") {
      startEditingPost(action.post);
      return;
    }

    clearForm();
    lastFocusedElementRef.current = document.activeElement as HTMLElement;
    setPendingDeletePost(action.post);
  };

  const deletePost = async (postId: number) => {
    setDeletingPostId(postId);
    const previousPosts = posts;
    const deletedPost = posts.find((post) => post.id === postId);
    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId),
    );
    setPendingDeletePost(null);

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.detail ?? "Unable to delete post.");
      }

      if (editingPostId === postId) {
        clearForm();
      }
      setApiStatus("online");
      setLastSyncedAt(new Date());
      showNotice("success", "Post deleted");
    } catch (deleteError) {
      setPosts(previousPosts);
      showNotice(
        "error",
        deleteError instanceof Error
          ? deleteError.message
          : "Something went wrong while deleting the post.",
      );
      if (deletedPost) {
        setPendingDeletePost(deletedPost);
      }
    } finally {
      setDeletingPostId(null);
    }
  };

  const visiblePosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const searchedPosts = normalizedQuery
      ? posts.filter((post) => {
          const searchablePost = `${post.id} ${post.title} ${post.body}`.toLowerCase();
          return searchablePost.includes(normalizedQuery);
        })
      : posts;
    const recentCutoff =
      (lastSyncedAt?.getTime() ?? 0) - 24 * 60 * 60 * 1000;
    const filteredPosts = searchedPosts.filter((post) => {
      if (statusFilter === "recent") {
        return new Date(post.updated_at).getTime() >= recentCutoff;
      }

      if (statusFilter === "long") {
        return post.body.length >= 160;
      }

      if (statusFilter === "short") {
        return post.body.length <= 80;
      }

      return true;
    });

    return [...filteredPosts].sort((firstPost, secondPost) =>
      sortOrder === "newest"
        ? secondPost.id - firstPost.id
        : firstPost.id - secondPost.id,
    );
  }, [posts, searchQuery, sortOrder, statusFilter, lastSyncedAt]);

  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / showCount));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedPosts = visiblePosts.slice(
    (activePage - 1) * showCount,
    activePage * showCount,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, showCount, sortOrder]);

  useEffect(() => {
    if (pendingDeletePost) {
      deleteCancelButtonRef.current?.focus();
      return;
    }

    if (pendingUnsavedAction) {
      unsavedCancelButtonRef.current?.focus();
      return;
    }

    lastFocusedElementRef.current?.focus();
    lastFocusedElementRef.current = null;
  }, [pendingDeletePost, pendingUnsavedAction]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTypingTarget =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (event.key === "Escape") {
        if (pendingDeletePost) {
          setPendingDeletePost(null);
          return;
        }

        if (pendingUnsavedAction) {
          setPendingUnsavedAction(null);
          return;
        }

        if (editingPostId !== null) {
          requestCancelEdit();
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void savePost();
      }

      if (event.key === "/" && !isTypingTarget) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const lastSyncedLabel = lastSyncedAt
    ? lastSyncedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const apiStatusLabel =
    apiStatus === "checking"
      ? "Checking"
      : apiStatus === "online"
        ? "Online"
        : "Offline";

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-7 w-7 place-items-center border border-slate-950 bg-slate-950 font-mono text-xs font-bold text-white">
              MP
            </div>
            <div>
              <p className="text-sm font-semibold leading-4 text-slate-950">
                MyPustak
              </p>
              <p className="font-mono text-[11px] uppercase leading-4 text-slate-500">
                Post Manager
              </p>
            </div>
          </div>
          <span className="border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700">
            {posts.length} {posts.length === 1 ? "record" : "records"}
          </span>
        </div>
        <div className="border-t border-slate-200 bg-slate-50">
          <dl className="mx-auto grid max-w-7xl grid-cols-3 px-4 text-xs sm:px-6">
            <div className="border-r border-slate-200 py-2 pr-3">
              <dt className="font-mono uppercase text-slate-500">Total Posts</dt>
              <dd className="mt-0.5 font-mono font-semibold text-slate-950">
                {posts.length.toString().padStart(2, "0")}
              </dd>
            </div>
            <div className="border-r border-slate-200 px-3 py-2">
              <dt className="font-mono uppercase text-slate-500">API Status</dt>
              <dd
                className={`mt-0.5 font-mono font-semibold ${
                  apiStatus === "offline" ? "text-[#D00]" : "text-slate-950"
                }`}
              >
                {apiStatusLabel}
              </dd>
            </div>
            <div className="py-2 pl-3">
              <dt className="font-mono uppercase text-slate-500">Last Synced</dt>
              <dd className="mt-0.5 font-mono font-semibold text-slate-950">
                {lastSyncedLabel}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-0 px-4 pt-32 sm:px-6 lg:grid-cols-[30%_70%]">
        <aside className="border-b border-slate-200 pb-5 lg:sticky lg:top-32 lg:h-[calc(100vh-8rem)] lg:border-b-0 lg:border-r lg:pr-5">
          <PostForm
            title={title}
            body={body}
            isSubmitting={isSubmitting}
            editingPostId={editingPostId}
            onTitleChange={setTitle}
            onBodyChange={setBody}
            onSubmit={savePost}
            onCancelEdit={requestCancelEdit}
          />
        </aside>

        <section
          aria-labelledby="posts-heading"
          className="min-w-0 py-5 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto lg:py-0 lg:pl-5"
        >
          <div className="mb-4 border-b border-slate-200 pb-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="font-mono text-xs uppercase text-blue-600">
                  Feed / Posts
                </p>
                <h2
                  id="posts-heading"
                  className="mt-1 text-2xl font-semibold tracking-normal text-slate-950"
                >
                  All Posts
                </h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(13rem,1fr)_auto] xl:grid-cols-[minmax(13rem,1fr)_auto_auto_auto_auto]">
                <label className="relative block">
                  <span className="sr-only">Search posts</span>
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search id, title, body"
                    className="h-9 w-full border border-slate-300 bg-slate-50 pl-8 pr-3 text-sm text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-600 focus:bg-white focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setIsMobileFiltersOpen((isOpen) => !isOpen)
                  }
                  aria-expanded={isMobileFiltersOpen}
                  className="inline-flex h-9 items-center justify-center gap-1.5 border border-slate-300 bg-white px-3 font-mono text-xs font-semibold uppercase text-slate-800 outline-none transition-colors duration-100 hover:border-blue-600 hover:text-blue-600 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 xl:hidden"
                >
                  <Filter aria-hidden="true" className="h-4 w-4" />
                  Filters
                </button>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className="hidden h-9 border border-slate-300 bg-white px-2 font-mono text-xs font-semibold uppercase text-slate-800 outline-none focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 xl:block"
                >
                  <option value="all">All</option>
                  <option value="recent">Recent</option>
                  <option value="long">Long Body</option>
                  <option value="short">Short Notes</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as "newest" | "oldest")
                  }
                  className="hidden h-9 border border-slate-300 bg-white px-2 font-mono text-xs font-semibold uppercase text-slate-800 outline-none focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 xl:block"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <select
                  value={showCount}
                  onChange={(event) => setShowCount(Number(event.target.value))}
                  className="hidden h-9 border border-slate-300 bg-white px-2 font-mono text-xs font-semibold uppercase text-slate-800 outline-none focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 xl:block"
                >
                  <option value={10}>Show 10</option>
                  <option value={25}>Show 25</option>
                  <option value={50}>Show 50</option>
                </select>
                <button
                  type="button"
                  onClick={() => void fetchPosts()}
                  disabled={isLoading}
                  className="hidden h-9 items-center justify-center gap-1.5 border border-slate-300 bg-white px-3 font-mono text-xs font-semibold uppercase text-slate-800 outline-none transition-colors duration-100 hover:border-blue-600 hover:text-blue-600 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 xl:inline-flex"
                >
                  <RefreshCcw aria-hidden="true" className="h-4 w-4" />
                  Refresh
                </button>
              </div>
              {isMobileFiltersOpen ? (
                <div className="grid gap-2 border border-slate-200 bg-slate-50 p-3 xl:hidden">
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="h-9 border border-slate-300 bg-white px-2 font-mono text-xs font-semibold uppercase text-slate-800 outline-none focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600"
                  >
                    <option value="all">All</option>
                    <option value="recent">Recent</option>
                    <option value="long">Long Body</option>
                    <option value="short">Short Notes</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(event) =>
                      setSortOrder(event.target.value as "newest" | "oldest")
                    }
                    className="h-9 border border-slate-300 bg-white px-2 font-mono text-xs font-semibold uppercase text-slate-800 outline-none focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                  <select
                    value={showCount}
                    onChange={(event) =>
                      setShowCount(Number(event.target.value))
                    }
                    className="h-9 border border-slate-300 bg-white px-2 font-mono text-xs font-semibold uppercase text-slate-800 outline-none focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600"
                  >
                    <option value={10}>Show 10</option>
                    <option value={25}>Show 25</option>
                    <option value={50}>Show 50</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void fetchPosts()}
                    disabled={isLoading}
                    className="inline-flex h-9 items-center justify-center gap-1.5 border border-slate-300 bg-white px-3 font-mono text-xs font-semibold uppercase text-slate-800 outline-none transition-colors duration-100 hover:border-blue-600 hover:text-blue-600 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCcw aria-hidden="true" className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {isLoading ? (
            <LoadingFeed />
          ) : visiblePosts.length > 0 ? (
            <div>
              <div className="space-y-3">
                {paginatedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isDeleting={deletingPostId === post.id}
                    isEditing={editingPostId === post.id}
                    onEdit={requestEditPost}
                    onRequestDelete={requestDeletePost}
                  />
                ))}
              </div>
              <div className="mt-4 flex flex-col justify-between gap-2 border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center">
                <p className="font-mono text-xs uppercase text-slate-600">
                  Showing {(activePage - 1) * showCount + 1}-
                  {Math.min(activePage * showCount, visiblePosts.length)} of{" "}
                  {visiblePosts.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={activePage === 1}
                    className="h-8 border border-slate-300 bg-white px-3 font-mono text-xs font-semibold uppercase text-slate-800 outline-none transition-colors duration-100 hover:border-blue-600 hover:text-blue-600 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="font-mono text-xs text-slate-700">
                    Page {activePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={activePage === totalPages}
                    className="h-8 border border-slate-300 bg-white px-3 font-mono text-xs font-semibold uppercase text-slate-800 outline-none transition-colors duration-100 hover:border-blue-600 hover:text-blue-600 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <h3 className="text-base font-semibold text-slate-950">
                {posts.length === 0 ? "No posts yet" : "No matching posts"}
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                {posts.length === 0
                  ? "No records found. Create a post to initialize the feed."
                  : "Try a different search term or clear the search field."}
              </p>
            </div>
          )}
        </section>
      </section>

      {pendingDeletePost ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4"
        >
          <div className="w-full max-w-md border border-slate-950 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-mono text-xs uppercase text-red-600">
                Destructive Action
              </p>
              <h2
                id="delete-dialog-title"
                className="mt-1 text-lg font-semibold text-slate-950"
              >
                Confirm post deletion
              </h2>
            </div>
            <div className="px-4 py-4">
              <p className="text-sm leading-6 text-slate-900">
                You are about to delete{" "}
                <span className="font-semibold">
                  &quot;{pendingDeletePost.title}&quot;
                </span>
                . This action cannot be undone.
              </p>
              <p className="mt-2 font-mono text-xs text-slate-500">
                [ID: {pendingDeletePost.id.toString().padStart(2, "0")}]
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                ref={deleteCancelButtonRef}
                onClick={() => setPendingDeletePost(null)}
                disabled={deletingPostId === pendingDeletePost.id}
                className="h-10 border border-slate-300 bg-white px-3 font-mono text-xs font-semibold uppercase text-slate-800 outline-none transition-colors duration-100 hover:bg-slate-100 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deletePost(pendingDeletePost.id)}
                disabled={deletingPostId === pendingDeletePost.id}
                className="h-10 border border-red-600 bg-red-600 px-3 font-mono text-xs font-semibold uppercase text-white outline-none transition-opacity duration-100 hover:opacity-90 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingPostId === pendingDeletePost.id ? "WAIT..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingUnsavedAction ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4"
        >
          <div className="w-full max-w-md border border-slate-950 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-mono text-xs uppercase text-blue-600">
                Unsaved Edit
              </p>
              <h2
                id="unsaved-dialog-title"
                className="mt-1 text-lg font-semibold text-slate-950"
              >
                Discard unsaved changes?
              </h2>
            </div>
            <div className="px-4 py-4">
              <p className="text-sm leading-6 text-slate-900">
                The current post has edits that have not been saved. Continue
                and discard those changes?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                ref={unsavedCancelButtonRef}
                onClick={() => setPendingUnsavedAction(null)}
                className="h-10 border border-slate-300 bg-white px-3 font-mono text-xs font-semibold uppercase text-slate-800 outline-none transition-colors duration-100 hover:bg-slate-100 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={runUnsavedAction}
                className="h-10 border border-blue-600 bg-blue-600 px-3 font-mono text-xs font-semibold uppercase text-white outline-none transition-opacity duration-100 hover:opacity-90 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-600"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border bg-white px-4 py-3 text-center text-sm font-semibold ${
            notice.kind === "success"
              ? "border-blue-600 text-blue-700"
              : notice.kind === "warning"
                ? "border-slate-800 text-slate-950"
                : "border-red-600 text-[#D00]"
          }`}
        >
          {notice.message}
        </div>
      ) : null}
    </main>
  );
}
