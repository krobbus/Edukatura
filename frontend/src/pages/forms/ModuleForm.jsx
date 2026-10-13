import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../api/client';
import { capitalizeFirstLetter } from '../../utils';
import ErrorNote from '../../components/ErrorNote';
import Loading from '../../components/Loading';

export default function ModuleForm({ onCreated, onToggle }) {
    const navigate = useNavigate();
    const { courseId, moduleId } = useParams();
    const isEditing = Boolean(moduleId);

    const [course, setCourse] = useState(null);
    const [form, setForm] = useState({ title: '', description: '' });
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [loadingData, setLoadingData] = useState(isEditing);

    useEffect(() => {
        api.get(`/courses/${courseId}`)
            .then((data) => setCourse(data.course ?? data))
            .catch(() => null);
    }, [courseId]);

    useEffect(() => {
        if (!isEditing) return;

        const fetchModule = api.get(`/modules/${moduleId}`).catch(() =>
            api.get(`/modules?course=${courseId}`).then((res) => {
                const list = res.modules ?? res ?? [];
                const found = list.find((m) => m._id === moduleId);
                if (!found) throw new Error('Module not found');
                return found;
            })
        );
        const fetchAssignments = api.get(`/assignments?course=${courseId}`).catch(() => []);
        const fetchQuizzes = api.get(`/quizzes?course=${courseId}`).catch(() => []);

        Promise.all([fetchModule, fetchAssignments, fetchQuizzes])
            .then(([moduleData, assignmentData, quizData]) => {
                const module = moduleData.module ?? moduleData;
                setForm({
                    title: module.title ?? '',
                    description: module.description ?? '',
                });

                const allAssignments = assignmentData.assignments ?? assignmentData ?? [];
                const allQuizzes = quizData.quizzes ?? quizData ?? [];

                setAssignments(allAssignments.filter((a) => (a.module?._id ?? a.module) === moduleId));
                setQuizzes(allQuizzes.filter((q) => (q.module?._id ?? q.module) === moduleId));
            })
            .catch((err) => setError(err))
            .finally(() => setLoadingData(false));
    }, [courseId, moduleId, isEditing]);

    function change(e) {
        const { name, value } = e.target;
        setForm((f) => ({
            ...f,
            [name]: name === 'title' || name === 'description' ? capitalizeFirstLetter(value) : value,
        }));
    }

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const data = await api.post('/modules', { ...form, course: courseId });
            if (onCreated) onCreated(data.module ?? data);
            if (!isEditing) setForm({ title: '', description: '' });
            if (onToggle) onToggle();
        } catch (submitError) {
            setError(submitError);
        } finally {
            setBusy(false);
        }
    }

    if (loadingData) return <Loading label="Loading module details..." />;

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-5 py-8">
            {course ? (
                <div className="inline-flex w-fit items-center gap-1.5">
                    <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to="/dashboard">
                        Dashboard
                    </Link>
                    <span className="text-sm font-bold text-[var(--main)] select-none">/</span>
                    <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to="/courses">
                        My courses
                    </Link>
                    <span className="text-sm font-bold text-[var(--main)] select-none">/</span>
                    <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to={`/courses/${course._id}`}>
                        {course?.courseCode ? `${course.courseCode} · ${course.title}` : 'Back to course'}
                    </Link>
                </div>
            ) : (
                <div className="inline-flex w-fit items-center gap-1.5">
                    <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to="/dashboard">
                        Dashboard
                    </Link>
                    <span className="text-sm font-bold text-[var(--main)] select-none">/</span>
                    <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to="/courses">
                        My courses
                    </Link>
                </div>
            )}

            {isEditing &&
                <div className="rounded-xl border border-[var(--line)] border-l-4 border-l-[var(--secondary)] bg-[var(--panel)] p-5 shadow-sm">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                            <h2 className="font-[family-name:var(--headings)] text-xl font-semibold text-[var(--secondary)]">{form.title || 'Module Title'}</h2>
                            <span className="text-xs font-medium text-[var(--muted)]">Assignments ({assignments.length}) · Quizzes ({quizzes.length})</span>
                        </div>
                        {form.description && <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">{form.description}</p>}
                    </div>
                </div>
            }

            <form className="flex flex-col gap-5 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm" onSubmit={submit}>
                <h2 className="font-[family-name:var(--headings)] text-2xl font-semibold text-[var(--secondary)]">{isEditing ? 'Edit module' : 'New module'}</h2>
                <ErrorNote error={error} />

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="m-title">Title <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input
                            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="m-title"
                            name="title"
                            placeholder="Module title"
                            maxLength={100}
                            value={form.title}
                            onChange={change}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="m-desc">Description</label>
                        <textarea
                            className="w-full resize-y rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="m-desc"
                            name="description"
                            placeholder="Describe this module"
                            rows={3}
                            value={form.description}
                            onChange={change}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        className="inline-flex items-center justify-center rounded-lg bg-[var(--main)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        disabled={busy}
                    >
                        {busy ? (isEditing ? 'Saving…' : 'Adding…') : (isEditing ? 'Save changes' : 'Add module')}
                    </button>

                    <button
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--secondary)] transition hover:bg-[var(--highlight)] cursor-pointer"
                        type="button"
                        onClick={() => navigate(`/courses/${courseId}`)}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </section>
    );
}