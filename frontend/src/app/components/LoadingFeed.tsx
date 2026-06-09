export default function LoadingFeed() {
  return (
    <div className="space-y-3" aria-label="Loading posts">
      <div className="border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-xs uppercase text-slate-700">
        Loading data...
      </div>

      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="grid border border-slate-200 bg-white md:grid-cols-[8rem_minmax(0,1fr)_13rem]"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 md:border-b-0 md:border-r">
            <div className="h-3 w-16 bg-slate-200" />
          </div>
          <div className="px-4 py-3">
            <div className="h-5 w-2/5 bg-slate-200" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full bg-slate-200" />
              <div className="h-3 w-10/12 bg-slate-200" />
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 md:border-l md:border-t-0">
            <div className="h-3 w-24 bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
