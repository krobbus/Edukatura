export default function ErrorNote({ error, onRetry }) {
    if (!error) return null;
    const message = typeof error === 'string' ? error : error.message;

    return (
        <section
            className="mb-4 flex min-h-12 w-full flex-wrap items-center justify-center gap-2 rounded-[10px] bg-[var(--danger)]/20 px-4 py-[0.8rem] text-[var(--danger)]"
            role="alert"
        >
            <p className="text-center text-[0.8rem] text-[var(--danger)]">{message}</p>
            {onRetry && (
                <button
                    className="rounded-md border border-transparent bg-[var(--danger)] px-[0.8rem] py-[0.35rem] text-[0.8rem] text-white hover:bg-[var(--highlight)] hover:border-[var(--danger)] hover:text-[var(--danger)]"
                    type="button"
                    onClick={onRetry}
                >
                    Try again
                </button>
            )}
        </section>
    );
}