export default function SkeletonLoader() {
  return (
    <div className="space-y-4" aria-label="Loading posts">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="animate-pulse">
            <div className="flex items-start justify-between gap-4">
              <div className="w-full">
                <div className="h-3 w-20 rounded bg-zinc-200" />
                <div className="mt-4 h-5 w-2/3 rounded bg-zinc-200" />
              </div>
              <div className="h-10 w-10 rounded-md bg-red-100" />
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-3 w-full rounded bg-zinc-200" />
              <div className="h-3 w-11/12 rounded bg-zinc-200" />
              <div className="h-3 w-7/12 rounded bg-zinc-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
