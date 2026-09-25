import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatDate, fullName } from '../utils';
import Loading from '../components/Loading';
import ErrorNote from '../components/ErrorNote';
import EmptyState from '../components/EmptyState';

const ROLES = ['student', 'faculty', 'admin'];

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
        <div className="usersPage">
            <header>
                <h1>Users</h1>
                <p>Everyone with an account, and what they can do.</p>
            </header>

            <div className="userSearch">
                <input
                    placeholder="Search by name or email"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search people"
                />

                <select
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
                <div className="userTableContainer">
                    <table className="userTable">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Joined</th>
                                <th>Role</th>
                            </tr>
                        </thead>

                        <tbody>
                            {existingUsers.map((u) => (
                                <tr key={u._id}>
                                    <td>
                                        {editingId === u._id ? (
                                            <div className="userNameFields">
                                                <input value={editForm.firstName} onChange={(e) => setEditForm((form) => ({ ...form, firstName: e.target.value }))} aria-label="First name" />
                                                <input value={editForm.middleName} onChange={(e) => setEditForm((form) => ({ ...form, middleName: e.target.value }))} aria-label="Middle name" />
                                                <input value={editForm.lastName} onChange={(e) => setEditForm((form) => ({ ...form, lastName: e.target.value }))} aria-label="Last name" />
                                            </div>
                                        ) : fullName(u)}
                                    </td>

                                    <td>
                                        {editingId === u._id ? (
                                            <input className="userCellInput" type="email" value={editForm.email} onChange={(e) => setEditForm((form) => ({ ...form, email: e.target.value }))} aria-label="Email" />
                                        ) : u.email}
                                    </td>

                                    <td>
                                        {editingId === u._id ? (
                                            <input className="userCellInput" type="date" value={editForm.createdAt} onChange={(e) => setEditForm((form) => ({ ...form, createdAt: e.target.value }))} aria-label="Joined date" />
                                        ) : formatDate(u.createdAt, false)}
                                    </td>

                                    <td>
                                        <div className="userRoleActions">
                                            <select
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
                                                    <button className="saveButton" type="button" onClick={() => saveUser(u._id)} disabled={saving} aria-label="Save user" title="Save user">Save</button>
                                                    <button className="cancelButton" type="button" onClick={cancelEditing} disabled={saving} aria-label="Cancel editing" title="Cancel editing">Cancel</button>
                                                </>
                                            ) : (
                                                <button className="editButton" type="button" onClick={() => startEditing(u)} aria-label={`Edit ${fullName(u)}`} title="Edit user">Edit</button>
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