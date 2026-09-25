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
        <section className="authCard">
            <header>
                <h1>Edukatura</h1>
                <p>Courses, modules, quizzes, and assignments in one place.</p>
            </header>

            <form className="authForm" onSubmit={submit} noValidate>
                <ErrorNote error={error} />

                <div className="formField">
                    <label htmlFor="email">Email <span className="requiredMarker" aria-hidden="true">*</span></label>
                    <input id="email" name="email" type="email" placeholder="Enter your email" value={form.email} onChange={change} autoComplete="email" required />
                </div>

                <div className="formField">
                    <label htmlFor="password">Password <span className="requiredMarker" aria-hidden="true">*</span></label>
                    <input id="password" name="password" type="password" value={form.password} placeholder="Enter your password" onChange={change} autoComplete="current-password" required />
                </div>

                <button className="submitButton" type="submit" disabled={busy}>
                    {busy ? 'Signing in…' : 'Sign in'}
                </button>
            </form>

            <p className="switchLink">No account yet? <Link to="/register">Create one</Link></p>
        </section>
    );
}