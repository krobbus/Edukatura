export default function ErrorNote({ error, onRetry }) {
    if (!error) return null;
    const message = typeof error === 'string' ? error : error.message;

    return (
        <section className="alertNote" role="alert">
            <p>{message}</p>
            {onRetry && (
                <button type="button" onClick={onRetry}>
                    Try again
                </button>
            )}
        </section>
    );
}