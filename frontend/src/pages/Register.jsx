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
    role: 'student',
};

export default function Register() {
    const { register, user, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState(BLANK);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

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
        <section className="authCard">
            <header>
                <h1>Create your account</h1>
                <p>Students can enroll right away. Faculty accounts need approval.</p>
            </header>

            <form className="authForm" onSubmit={submit} noValidate>
                <ErrorNote error={error} />

                <div className="formGrid">
                    <div className="formField span">
                        <label htmlFor="firstName">First name <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input id="firstName" name="firstName" placeholder="Enter your first name" maxLength={50} value={form.firstName} onChange={change} autoComplete="given-name" required />
                    </div>

                    <div className="formField span">
                        <label htmlFor="middleName">Middle name <span>(optional)</span></label>
                        <input id="middleName" name="middleName" placeholder="Enter your middle name (Optional)" maxLength={50} value={form.middleName} onChange={change} autoComplete="additional-name" />
                    </div>

                    <div className="formField span">
                        <label htmlFor="lastName">Last name <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input id="lastName" name="lastName" placeholder="Enter your last name" maxLength={50} value={form.lastName} onChange={change} autoComplete="family-name" required />
                    </div>

                    <div className="formField">
                        <label htmlFor="role">I am a</label>
                        <select id="role" name="role" value={form.role} onChange={change}>
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                        </select>
                    </div>

                    <div className="formField">
                        <label htmlFor="email">Email <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input id="email" name="email" type="email" placeholder="Enter your email" value={form.email} onChange={change} autoComplete="email" required />
                    </div>

                    <div className="formField">
                        <label htmlFor="password">Password <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input id="password" name="password" type="password" placeholder="Enter your password" value={form.password} onChange={change} autoComplete="new-password" required />
                        <span className="fieldHint">At least 8 characters.</span>
                    </div>

                    <div className="formField">
                        <label htmlFor="confirm">Confirm password <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input id="confirm" name="confirm" type="password" placeholder="Repeat your password" value={form.confirm} onChange={change} autoComplete="new-password" required />
                    </div>
                </div>

                <button className="submitButton" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
            </form>

            <p className="switchLink">Already registered? <Link to="/login">Sign in</Link></p>
        </section>
    );
}
