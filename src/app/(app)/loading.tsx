export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat halaman">
      <div>
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton mt-2 h-4 w-64 rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-28 rounded-2xl" />
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );
}
