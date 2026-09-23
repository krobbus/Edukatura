export default function EmptyState({ title, body, action }) {
    return (
        <section className="emptyState">
            <p>{title}</p>
            {body && <div className="body">{body} {action}</div>}
        </section>
    );
}