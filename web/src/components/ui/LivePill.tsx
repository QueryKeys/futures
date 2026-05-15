export function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-danger/10 text-danger border border-danger/20">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-danger" />
      </span>
      לייב
    </span>
  );
}
