import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import ErrorNote from '../components/ErrorNote';

export default function Login() {
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    if (!loading && user) {
        return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;
    }

    function change(e) {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function submit(e) {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            await login(form.email.trim(), form.password);
            navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
            <section className="authCard grid w-full max-w-4xl overflow-hidden rounded-3xl bg-[var(--panel)] shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:grid-cols-2">
                <aside className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-linear-to-br from-[var(--secondary)] to-[var(--main)] p-10 text-white md:flex">
                    <span className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10" aria-hidden="true" />
                    <span className="pointer-events-none absolute -bottom-24 -left-12 size-64 rounded-full bg-white/5" aria-hidden="true" />

                    <span className="font-[family-name:var(--headings)] text-2xl font-bold tracking-[-0.03em]">Edukatura</span>

                    <div className="relative flex flex-col gap-3">
                        <p className="font-[family-name:var(--headings)] text-4xl font-bold leading-tight tracking-[-0.02em]">
                            Everything for your classes, in one place.
                        </p>
                        <p className="text-sm leading-relaxed text-white/75">
                            Your complete learning hub for courses, modules, and coursework.
                        </p>
                    </div>

                    <ul className="relative flex flex-col gap-3 text-sm text-white/90">
                        <li className="flex items-center gap-3">
                            <span className="grid size-6 place-items-center rounded-full bg-white/15">
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </span>
                            Browse and enroll in courses
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="grid size-6 place-items-center rounded-full bg-white/15">
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </span>
                            Turn in assignments and quizzes
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="grid size-6 place-items-center rounded-full bg-white/15">
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </span>
                            Track grades and feedback
                        </li>
                    </ul>
                </aside>

                <div className="flex flex-col justify-center gap-7 p-7 sm:p-10">
                    <header className="flex flex-col gap-1.5">
                        <p className="font-[family-name:var(--headings)] text-lg font-bold text-[var(--main)] md:hidden">Edukatura</p>
                        <h1 className="font-[family-name:var(--headings)] text-3xl font-bold tracking-[-0.02em] text-[var(--secondary)]">Welcome back</h1>
                        <p className="text-sm text-[var(--muted)]">Sign in to continue to your courses.</p>
                    </header>

                    <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
                        <ErrorNote error={error} />

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="email">Email <span className="requiredMarker" aria-hidden="true">*</span></label>
                            <input
                                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)]/70 transition focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(42,107,92,0.15)]"
                                id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={change} autoComplete="email" required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="password">Password <span className="requiredMarker" aria-hidden="true">*</span></label>
                            <div className="relative">
                                <input
                                    className="w-full rounded-xl border border-[var(--line)] bg-white py-3 pl-4 pr-16 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)]/70 transition focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(42,107,92,0.15)]"
                                    id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} placeholder="Enter your password" onChange={change} autoComplete="current-password" required
                                />
                                <button
                                    className="absolute inset-y-0 right-4 text-xs font-semibold text-[var(--main)] hover:text-[var(--secondary)]"
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-pressed={showPassword}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <button
                            className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--main)] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(42,107,92,0.3)] transition hover:-translate-y-0.5 hover:bg-[var(--secondary)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                            type="submit"
                            disabled={busy}
                        >
                            {busy ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[var(--muted)]">
                        No account yet? <Link className="font-semibold text-[var(--main)] hover:underline" to="/register">Create one</Link>
                    </p>
                </div>
            </section>
        </div>
    );
}