export default function EmptyState({ title, body, action }) {
    return (
        <section className="flex flex-col justify-center gap-4 rounded-xl bg-linear-to-br from-[var(--main)]/80 to-[var(--secondary)]/80 p-8 text-white">
            <p className="text-[1.1rem] font-bold text-white">{title}</p>
            {body && (
                <div className="text-base leading-[1.6] text-white/80 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-[0.2rem]">
                    {body} {action}
                </div>
            )}
        </section>
    );
}