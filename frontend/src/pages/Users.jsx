import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatDate, fullName } from '../utils';
import Loading from '../components/Loading';
import ErrorNote from '../components/ErrorNote';
import EmptyState from '../components/EmptyState';

const ROLES = ['learner', 'instructor', 'admin'];

export default function Users() {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('all');
    const [query, setQuery] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [state, setState] = useState({ loading: true, error: null });

    function load() {
        setState({ loading: true, error: null });
        api.get('/users')
            .then((data) => {
                setUsers(data.users ?? data ?? []);
                setState({ loading: false, error: null });
            })
            .catch((err) => setState({ loading: false, error: err }));
    }

    useEffect(load, []);

    async function changeRole(id, role) {
        const previous = users;
        setUsers((list) => list.map((u) => (u._id === id ? { ...u, role } : u)));

        try {
            await api.patch(`/users/${id}/role`, { role });
        } catch {
            setUsers(previous);
            setState((s) => ({ ...s, error: 'Could not change that role. Nothing was saved.' }));
        }
    }

    function startEditing(user) {
        setEditingId(user._id);
        setEditForm({
            firstName: user.firstName ?? '',
            middleName: user.middleName ?? '',
            lastName: user.lastName ?? '',
            email: user.email ?? '',
            createdAt: user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : '',
            role: user.role,
        });
    }

    function cancelEditing() {
        setEditingId(null);
        setEditForm(null);
    }

    async function saveUser(id) {
        setSaving(true);
        try {
            const data = await api.patch(`/users/${id}`, editForm);
            setUsers((list) => list.map((user) => (user._id === id ? data.user ?? data : user)));
            cancelEditing();
        } catch (err) {
            setState((current) => ({ ...current, error: err }));
        } finally {
            setSaving(false);
        }
    }

    const needle = query.trim().toLowerCase();
    const existingUsers = users.filter((u) => {
        if (filter !== 'all' && u.role !== filter) return false;
        if (!needle) return true;
        return `${fullName(u)} ${u.email}`.toLowerCase().includes(needle);
    });

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8">
            <header>
                <h1 className="font-[family-name:var(--headings)] text-3xl font-bold text-[var(--secondary)]">Users</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">Manage accounts, roles, and access in one place.</p>
            </header>

            <div className="flex flex-wrap gap-3">
                <input
                    className="min-w-[240px] flex-1 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                    placeholder="Search by name or email"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search people"
                />

                <select
                    className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm capitalize text-[var(--shadow)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    aria-label="Filter by role"
                >
                    <option value="all">All roles</option>
                    {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
            </div>

            <ErrorNote error={state.error} onRetry={load} />

            {state.loading ? (
                <Loading label="Loading people" />
            ) : existingUsers.length === 0 ? (
                <EmptyState title="Nobody matches that" body="Try a different name, email, or role." />
            ) : (
                <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] shadow-sm">
                    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                        <thead className="bg-[var(--secondary)] text-white">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Joined</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Role</th>
                            </tr>
                        </thead>

                        <tbody>
                            {existingUsers.map((u) => (
                                <tr className="border-t border-[var(--line)] transition hover:bg-[var(--main)]/5" key={u._id}>
                                    <td className="px-4 py-3 align-middle font-medium text-[var(--shadow)]">
                                        {editingId === u._id ? (
                                            <div className="flex flex-col gap-1.5">
                                                <input className="w-full rounded-md border border-[var(--line)] bg-white px-2 py-1.5 text-sm focus:border-[var(--main)] focus:outline-none" value={editForm.firstName} onChange={(e) => setEditForm((form) => ({ ...form, firstName: e.target.value }))} aria-label="First name" />
                                                <input className="w-full rounded-md border border-[var(--line)] bg-white px-2 py-1.5 text-sm focus:border-[var(--main)] focus:outline-none" value={editForm.middleName} onChange={(e) => setEditForm((form) => ({ ...form, middleName: e.target.value }))} aria-label="Middle name" />
                                                <input className="w-full rounded-md border border-[var(--line)] bg-white px-2 py-1.5 text-sm focus:border-[var(--main)] focus:outline-none" value={editForm.lastName} onChange={(e) => setEditForm((form) => ({ ...form, lastName: e.target.value }))} aria-label="Last name" />
                                            </div>
                                        ) : fullName(u)}
                                    </td>

                                    <td className="px-4 py-3 align-middle text-[var(--muted)]">
                                        {editingId === u._id ? (
                                            <input className="w-full rounded-md border border-[var(--line)] bg-white px-2 py-1.5 text-sm text-[var(--shadow)] focus:border-[var(--main)] focus:outline-none" type="email" value={editForm.email} onChange={(e) => setEditForm((form) => ({ ...form, email: e.target.value }))} aria-label="Email" />
                                        ) : u.email}
                                    </td>

                                    <td className="px-4 py-3 align-middle text-[var(--muted)]">
                                        {editingId === u._id ? (
                                            <input className="w-full rounded-md border border-[var(--line)] bg-white px-2 py-1.5 text-sm text-[var(--shadow)] focus:border-[var(--main)] focus:outline-none" type="date" value={editForm.createdAt} onChange={(e) => setEditForm((form) => ({ ...form, createdAt: e.target.value }))} aria-label="Joined date" />
                                        ) : formatDate(u.createdAt, false)}
                                    </td>

                                    <td className="px-4 py-3 align-middle">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <select
                                                className="rounded-md border border-[var(--line)] bg-white px-2 py-1.5 text-sm capitalize text-[var(--shadow)] focus:border-[var(--main)] focus:outline-none"
                                                value={editingId === u._id ? editForm.role : u.role}
                                                onChange={(e) => {
                                                    if (editingId === u._id) setEditForm((form) => ({ ...form, role: e.target.value }));
                                                    else changeRole(u._id, e.target.value);
                                                }}
                                                aria-label={`Role for ${fullName(u)}`}
                                            >
                                                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                            </select>

                                            {editingId === u._id ? (
                                                <>
                                                    <button className="inline-flex items-center rounded-lg bg-[var(--main)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={() => saveUser(u._id)} disabled={saving} aria-label="Save user" title="Save user">Save</button>
                                                    <button className="inline-flex items-center rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--secondary)] transition hover:bg-[var(--highlight)] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={cancelEditing} disabled={saving} aria-label="Cancel editing" title="Cancel editing">Cancel</button>
                                                </>
                                            ) : (
                                                <button className="inline-flex items-center rounded-lg border border-[var(--main)] px-3 py-1.5 text-xs font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white" type="button" onClick={() => startEditing(u)} aria-label={`Edit ${fullName(u)}`} title="Edit user">Edit</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}