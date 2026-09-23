export function capitalizeWords(value) {
    if (typeof value !== 'string') return value;

    return value
        .toLowerCase()
        .replace(/(^|[\s'-])(\p{L})/gu, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);
}

export function capitalizeFirstLetter(value) {
    if (typeof value !== 'string') return value;

    return value.replace(/^(\s*)(\p{L})/u, (_, whitespace, letter) => `${whitespace}${letter.toUpperCase()}`);
}

export function fullName(user) {
    if (!user) return 'Unknown';
    return [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .map(capitalizeWords)
        .join(' ');
}

export function initials(user) {
    if (!user) return '?';
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

export function formatDate(value, withTime = true) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    });
}

export function dueMeta(dueDate) {
    if (!dueDate) return { label: 'No due date', className: '' };
    const due = new Date(dueDate);
    const ms = due.getTime() - Date.now();
    const days = Math.round(ms / 86_400_000);

    if (ms < 0) return { label: `Closed ${formatDate(due)}`, className: 'overdue' };
    if (days === 0) return { label: `Due today, ${formatDate(due)}`, className: 'dueSoon' };
    if (days === 1) return { label: `Due tomorrow, ${formatDate(due)}`, className: 'dueSoon' };
    if (days <= 7) return { label: `Due in ${days} days, ${formatDate(due, false)}`, className: 'dueSoon' };
    return { label: `Due ${formatDate(due, false)}`, className: '' };
}

const SPINES = ['#2f6f62', '#3d5a80', '#7a4b6b', '#8a6220', '#4a6b2f', '#6b4636'];

export function spineColor(code = '') {
    let hash = 0;
    for (let i = 0; i < code.length; i += 1) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
    return SPINES[hash % SPINES.length];
}

export function toInputDateTime(value) {
    if (!value) return '';
    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return '';

    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}