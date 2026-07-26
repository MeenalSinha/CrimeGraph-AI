export default function Loading() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-accent to-accent2 flex items-center justify-center display-font font-bold text-black animate-pulse">
          CG
        </div>
        <span className="text-[10px] tracking-widest text-muted">LOADING</span>
      </div>
    </div>
  );
}
