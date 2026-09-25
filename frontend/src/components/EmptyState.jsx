export default function EmptyState({ title, body, action }) {
    return (
        <section className="emptyState">
            <p className="title">{title}</p>
            {body && <div className="body">{body} {action}</div>}
        </section>
    );
}