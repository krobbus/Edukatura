export default function Loading({ label = 'Loading' }) {
    return (
        <div className="flex min-h-32 items-center justify-center gap-[0.6rem] text-[0.85rem] text-[var(--muted)]" role="status">
            <span
                className="size-4 animate-spin rounded-full border-2 border-[var(--main)]/20 border-t-[color:var(--main)] [animation-duration:0.8s]"
                aria-hidden="true"
            />
            <span>{label}…</span>
        </div>
    );
}