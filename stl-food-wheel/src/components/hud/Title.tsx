export function Title({ className = "" }: { className?: string }) {
  return (
    <h1 className={`font-black leading-tight tracking-tight text-slate-50 ${className}`}>
      <span className="block text-[0.65em] font-bold uppercase tracking-[0.25em] text-amber-300">St. Louis</span>{" "}
      World Food Wheel
    </h1>
  );
}
