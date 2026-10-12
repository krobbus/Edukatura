import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import ErrorNote from '../components/ErrorNote';
import { capitalizeWords } from '../utils';

const BLANK = {
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
    role: 'learner',
};

export default function Register() {
    const { register, user, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState(BLANK);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    if (!loading && user) return <Navigate to="/dashboard" replace />;

    function change(e) {
        const { name, value } = e.target;
        setForm((current) => ({
            ...current,
            [name]: ['firstName', 'middleName', 'lastName'].includes(name) ? capitalizeWords(value) : value,
        }));
    }

    async function submit(e) {
        e.preventDefault();
        setError(null);

        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (form.password !== form.confirm) {
            setError('The two passwords do not match.');
            return;
        }

        setBusy(true);
        try {
            const { confirm, ...payload } = form;
            payload.email = payload.email.trim();
            if (!payload.middleName) delete payload.middleName;
            await register(payload);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
            <section className="authCard grid w-full max-w-5xl overflow-hidden rounded-3xl bg-[var(--panel)] shadow-[0_30px_80px_rgba(0,0,0,0.45)] lg:grid-cols-[5fr_7fr]">
                <aside className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-linear-to-br from-[var(--secondary)] to-[var(--main)] p-10 text-white lg:flex">
                    <span className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10" aria-hidden="true" />
                    <span className="pointer-events-none absolute -bottom-24 -left-12 size-64 rounded-full bg-white/5" aria-hidden="true" />

                    <span className="font-[family-name:var(--headings)] text-2xl font-bold tracking-[-0.03em]">Edukatura</span>

                    <div className="relative flex flex-col gap-3">
                        <p className="font-[family-name:var(--headings)] text-4xl font-bold leading-tight tracking-[-0.02em]">
                            Start learning in a few minutes.
                        </p>
                        <p className="text-sm leading-relaxed text-white/75">
                            Join today to explore courses, track your progress, and jump straight into learning.
                        </p>
                    </div>

                    <ul className="relative flex flex-col gap-3 text-sm text-white/90">
                        <li className="flex items-center gap-3">
                            <span className="grid size-6 place-items-center rounded-full bg-white/15">
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </span>
                            Learners enroll and submit work
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="grid size-6 place-items-center rounded-full bg-white/15">
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </span>
                            Instructors build courses and grade
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="grid size-6 place-items-center rounded-full bg-white/15">
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </span>
                            Free to join, ready right away
                        </li>
                    </ul>
                </aside>

                <div className="flex flex-col justify-center gap-6 p-7 sm:p-10">
                    <header className="flex flex-col gap-1.5">
                        <p className="font-[family-name:var(--headings)] text-lg font-bold text-[var(--main)] lg:hidden">Edukatura</p>
                        <h1 className="font-[family-name:var(--headings)] text-3xl font-bold tracking-[-0.02em] text-[var(--secondary)]">Create your account</h1>
                        <p className="text-sm text-[var(--muted)]">Fill in your details to get started.</p>
                    </header>

                    <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
                        <ErrorNote error={error} />

                        <fieldset className="flex flex-col gap-1.5">
                            <legend className="mb-1.5 text-sm font-semibold text-[var(--secondary)]">I am a</legend>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex cursor-pointer flex-col gap-0.5 rounded-xl border border-[var(--line)] px-4 py-3 transition hover:bg-[var(--main)]/50 has-[:checked]:bg-[var(--main)]/80 has-[:checked]:border-[var(--main)] has-[:checked]:shadow-[0_0_0_3px_rgba(42,107,92,0.15)]">
                                    <input className="peer sr-only" type="radio" name="role" value="learner" checked={form.role === 'learner'} onChange={change} />
                                    <span className="text-sm font-semibold text-[var(--shadow)] peer-checked:text-[var(--panel)]">Learner</span>           
                                    <span className="text-xs text-muted peer-checked:text-[var(--highlight)]">Enroll and take courses</span>
                                </label>

                                <label className="flex cursor-pointer flex-col gap-0.5 rounded-xl border border-[var(--line)] px-4 py-3 transition hover:bg-[var(--main)]/50 has-[:checked]:bg-[var(--main)]/80 has-[:checked]:border-[var(--main)] has-[:checked]:shadow-[0_0_0_3px_rgba(42,107,92,0.15)]">
                                    <input className="peer sr-only" type="radio" name="role" value="instructor" checked={form.role === 'instructor'} onChange={change} />
                                    <span className="text-sm font-semibold text-[var(--shadow)] peer-checked:text-[var(--panel)]">Instructor</span>
                                    <span className="text-xs text-muted peer-checked:text-[var(--highlight)]">Create and grade courses</span>
                                </label>
                            </div>
                        </fieldset>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="firstName">First name <span className="requiredMarker" aria-hidden="true">*</span></label>
                                <input
                                    className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)]/70 transition focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(42,107,92,0.15)]"
                                    id="firstName" name="firstName" placeholder="First name" maxLength={50} value={form.firstName} onChange={change} autoComplete="given-name" required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="middleName">Middle name <span className="font-normal text-[var(--muted)]">(optional)</span></label>
                                <input
                                    className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)]/70 transition focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(42,107,92,0.15)]"
                                    id="middleName" name="middleName" placeholder="Optional" maxLength={50} value={form.middleName} onChange={change} autoComplete="additional-name"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="lastName">Last name <span className="requiredMarker" aria-hidden="true">*</span></label>
                                <input
                                    className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)]/70 transition focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(42,107,92,0.15)]"
                                    id="lastName" name="lastName" placeholder="Last name" maxLength={50} value={form.lastName} onChange={change} autoComplete="family-name" required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="email">Email <span className="requiredMarker" aria-hidden="true">*</span></label>
                            <input
                                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)]/70 transition focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(42,107,92,0.15)]"
                                id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={change} autoComplete="email" required
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="password">Password <span className="requiredMarker" aria-hidden="true">*</span></label>
                                <div className="relative">
                                    <input
                                        className="w-full rounded-xl border border-[var(--line)] bg-white py-3 pl-4 pr-16 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)]/70 transition focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(42,107,92,0.15)]"
                                        id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={form.password} onChange={change} autoComplete="new-password" required
                                    />
                                    <button
                                        className="absolute inset-y-0 right-4 text-xs font-semibold text-[var(--main)] hover:text-[var(--secondary)]"
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-pressed={showPassword}
                                        aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <span className="text-xs text-[var(--muted)]">At least 8 characters.</span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="confirm">Confirm password <span className="requiredMarker" aria-hidden="true">*</span></label>
                                <input
                                    className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)]/70 transition focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(42,107,92,0.15)]"
                                    id="confirm" name="confirm" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" value={form.confirm} onChange={change} autoComplete="new-password" required
                                />
                            </div>
                        </div>

                        <button
                            className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--main)] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(42,107,92,0.3)] transition hover:-translate-y-0.5 hover:bg-[var(--secondary)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                            type="submit"
                            disabled={busy}
                        >
                            {busy ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[var(--muted)]">
                        Already registered? <Link className="font-semibold text-[var(--main)] hover:underline" to="/login">Sign in</Link>
                    </p>
                </div>
            </section>
        </div>
    );
}