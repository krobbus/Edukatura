import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../api/client';
import { capitalizeFirstLetter, dueMeta, toInputDateTime } from '../../utils';
import ErrorNote from '../../components/ErrorNote';
import Loading from '../../components/Loading';

export default function AssignmentForm() {
    const navigate = useNavigate();
    const { courseId, assignmentId } = useParams();
    const isEditing = Boolean(assignmentId);

    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        maxPoints: 100,
        module: '',
    });

    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        api.get(`/courses/${courseId}`)
            .then((data) => setCourse(data.course ?? data))
            .catch(() => null);

        api.get(`/modules?course=${courseId}`)
            .then((data) => setModules(data.modules ?? data ?? []))
            .catch((err) => setError(err));
    }, [courseId]);

    useEffect(() => {
        if (!isEditing) {
            setLoadingData(false);
            return;
        }

        api.get(`/assignments/${assignmentId}`)
            .then((data) => {
                const assignment = data.assignment ?? data;
                setForm({
                    title: assignment.title ?? '',
                    description: assignment.description ?? '',
                    dueDate: toInputDateTime(assignment.dueDate),
                    maxPoints: assignment.maxPoints ?? 100,
                    module: assignment.module?._id ?? assignment.module ?? '',
                });
            })
            .catch((err) => setError(err))
            .finally(() => setLoadingData(false));
    }, [assignmentId, isEditing]);

    function change(e) {
        const { name, value } = e.target;
        setForm((current) => ({
            ...current,
            [name]: name === 'title' || name === 'description' ? capitalizeFirstLetter(value) : value,
        }));
    }

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const payload = {
                course: courseId,
                title: form.title,
                description: form.description,
                dueDate: new Date(form.dueDate).toISOString(),
                maxPoints: Number(form.maxPoints),
                module: form.module || null
            };

            if (isEditing) {
                await api.put(`/assignments/${assignmentId}`, payload);
            } else {
                await api.post('/assignments', payload);
            }

            navigate(`/courses/${courseId}`);
        } catch (submitError) {
            setError(submitError);
        } finally {
            setBusy(false);
        }
    }

    const meta = form.dueDate ? dueMeta(form.dueDate) : { label: 'No due date', className: '' };

    if (loadingData) return <Loading label="Loading assignment details..." />;

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-5 py-8">
            <p>
                <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to={`/courses/${courseId}`}>
                    ⟵ {course?.courseCode ? `${course.courseCode} · ${course.title}` : 'Back to course'}
                </Link>
            </p>

            {isEditing &&
                <div className="rounded-xl border border-[var(--line)] border-l-4 border-l-[var(--main)] bg-[var(--panel)] p-5 shadow-sm">
                    <div className="flex flex-col gap-2">
                        <strong className="text-xs font-bold uppercase tracking-widest text-[var(--main)]">Saved details</strong>

                        <div className="flex flex-col gap-1.5">
                            <h2 className="font-[family-name:var(--headings)] text-xl font-semibold text-[var(--secondary)]">{form.title || 'Assignment Title'}</h2>

                            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[var(--muted)]">
                                <span className={meta.className}>{meta.label}</span>
                                <span>Max points: {form.maxPoints}</span>
                            </div>
                        </div>

                        {form.description && <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--shadow)]">{form.description}</p>}
                    </div>
                </div>
            }

            <form className="flex flex-col gap-5 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm" onSubmit={submit}>
                <h2 className="font-[family-name:var(--headings)] text-2xl font-semibold text-[var(--secondary)]">{isEditing ? 'Edit assignment' : 'New assignment'}</h2>
                <ErrorNote error={error} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="a-title">Title <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input
                            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="a-title" name="title" placeholder="Assignment title" maxLength={100} value={form.title} onChange={change} required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="a-module">Module</label>
                        <select
                            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="a-module" name="module" value={form.module} onChange={change}
                        >
                            <option value="">No module</option>
                            {modules.map((module) => <option key={module._id} value={module._id}>{module.title}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="a-desc">Instructions <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <textarea
                            className="w-full resize-y rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="a-desc" name="description" placeholder="Explain what learners need to do" rows={5} value={form.description} onChange={change} required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="a-due">Due date <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input
                            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="a-due" name="dueDate" type="datetime-local" placeholder="Choose a due date" min={toInputDateTime(Date.now())} value={form.dueDate} onChange={change} required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="a-points">Max Points</label>
                        <input
                            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="a-points" name="maxPoints" type="number" placeholder="100" min={1} value={form.maxPoints} onChange={change}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        className="inline-flex items-center justify-center rounded-lg bg-[var(--main)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        disabled={busy}
                    >
                        {busy ? (isEditing ? 'Saving…' : 'Posting…') : (isEditing ? 'Save changes' : 'Post assignment')}
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