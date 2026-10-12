import { Link } from 'react-router';

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex max-w-[38rem] flex-col items-center gap-4 rounded-2xl border border-[var(--highlight)] bg-white/[0.88] p-8 text-center shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                <h1 className="font-[family-name:var(--headings)] text-[length:clamp(2rem,3vw,2.5rem)] tracking-[-0.03em] text-[var(--secondary)]">
                    That page does not exist
                </h1>
                <p className="leading-[1.6] text-[var(--muted)]">
                    The link may be out of date, or the class or assignment may have been removed.
                </p>

                <Link
                    className="mt-2 min-h-8 cursor-pointer rounded-lg border border-[var(--main)] bg-[var(--main)] px-4 py-[0.8rem] text-[0.8rem] font-bold text-white no-underline transition duration-200 ease-in-out hover:border-[var(--secondary)] hover:bg-[var(--secondary)] active:border-[var(--secondary)] active:bg-[var(--secondary)]"
                    to="/dashboard"
                >
                    Go to your dashboard
                </Link>
            </div>
        </div>
    );
}