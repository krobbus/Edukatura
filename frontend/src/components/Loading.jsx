export default function Loading({ label = 'Loading' }) {
    return (
        <div className="loadingState" role="status">
            <span className="loadingSpinner" aria-hidden="true" />
            <span>{label}…</span>
        </div>
    );
}