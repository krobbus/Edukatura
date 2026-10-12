import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { dueMeta, formatDate } from '../../utils';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';

const STATUS_LABEL = {
    pending: 'Not submitted',
    submitted: 'Submitted at',
    graded: 'Graded',
};

export default function AssignmentDetail() {
    const { courseId, assignmentId } = useParams();
    const { canTeach } = useAuth();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [state, setState] = useState({ loading: true, error: null });

    const load = useCallback(() => {
        setState({ loading: true, error: null });
        const calls = [api.get(`/assignments/${assignmentId}`)];
        if (!canTeach) calls.push(api.get(`/submissions/my?assignment=${assignmentId}`).catch(() => null));

        Promise.all(calls)
            .then(([a, s]) => {
                const assignmentData = a.assignment ?? a;
                setAssignment(assignmentData);
                setSubmission(s ? s.submission ?? (Array.isArray(s) ? s[0] : s) : null);

                const cId = courseId || (typeof assignmentData.course === 'object' ? assignmentData.course?._id : assignmentData.course);
                if (typeof assignmentData.course === 'object' && assignmentData.course?.title) {
                    setCourse(assignmentData.course);
                    setState({ loading: false, error: null });
                } else if (cId) {
                    api.get(`/courses/${cId}`)
                        .then((cRes) => setCourse(cRes.course ?? cRes))
                        .catch(() => null)
                        .finally(() => setState({ loading: false, error: null }));
                } else {
                    setState({ loading: false, error: null });
                }
            })
            .catch((err) => setState({ loading: false, error: err }));
    }, [assignmentId, courseId, canTeach]);

    useEffect(load, [load]);

    async function deleteAssignment() {
        if (!window.confirm(`Delete "${assignment.title}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/assignments/${assignmentId}`);
            const activeCourseId = courseId || course?._id;
            navigate(activeCourseId ? `/courses/${activeCourseId}` : '/courses', { replace: true });
        } catch (err) {
            setState((current) => ({ ...current, error: err }));
        }
    }

    if (state.loading) return <Loading label="Loading assignment" />;
    if (state.error) return <ErrorNote error={state.error} onRetry={load} />;
    if (!assignment) return null;

    const meta = dueMeta(assignment.dueDate);
    const activeCourseId = courseId || course?._id || (typeof assignment.course === 'object' ? assignment.course?._id : assignment.course);

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-12">
            {course ? (
                <Link className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--main)] hover:underline" to={`/courses/${course._id}`}>
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                    {course.courseCode} · {course.title}
                </Link>
            ) : (
                <Link className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--main)] hover:underline" to="/courses">
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                    All courses
                </Link>
            )}

            <header className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)] shadow-sm">
                <div className="h-2 bg-linear-to-r from-[var(--secondary)] to-[var(--main)]" aria-hidden="true" />

                <div className="flex flex-col gap-4 p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[var(--main)]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--main)]">Assignment</span>
                            {course?.courseCode && (
                                <span className="rounded-full bg-[var(--highlight)]/50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--secondary)]">{course.courseCode}</span>
                            )}
                        </div>

                        {canTeach && (
                            <div className="flex items-center gap-2">
                                <Link
                                    className="inline-flex items-center rounded-lg border border-[var(--main)] px-3.5 py-2 text-xs font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white"
                                    to={`/courses/${activeCourseId}/assignments/${assignment._id}/edit`}
                                    aria-label={`Edit assignment ${assignment.title}`}
                                    title="Edit assignment"
                                >
                                    <span aria-hidden="true">Edit</span>
                                </Link>

                                <button
                                    className="inline-flex items-center rounded-lg border border-[var(--danger)] px-3.5 py-2 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white"
                                    type="button"
                                    onClick={deleteAssignment}
                                    aria-label={`Delete assignment ${assignment.title}`}
                                    title="Delete assignment"
                                >
                                    <span aria-hidden="true">Delete</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <h1 className="font-[family-name:var(--headings)] text-3xl font-bold tracking-[-0.02em] text-[var(--secondary)] sm:text-4xl">{assignment.title}</h1>

                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[var(--highlight)]/50 px-3 py-1.5 text-[var(--secondary)] ${meta.className ?? ''}`}>
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                            {meta.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--main)]/10 px-3 py-1.5 text-[var(--main)]">
                            {assignment.maxPoints} points
                        </span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[2fr_1fr]">
                <section className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm sm:p-8">
                    <h2 className="font-[family-name:var(--headings)] text-xl font-bold text-[var(--secondary)]">Instructions</h2>
                    <p className="whitespace-pre-line text-sm leading-7 text-[var(--shadow)]">{assignment.description}</p>
                </section>

                {canTeach ? (
                    <section className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm lg:sticky lg:top-6">
                        <div className="flex flex-col gap-1">
                            <h2 className="font-[family-name:var(--headings)] text-xl font-bold text-[var(--secondary)]">Submissions</h2>
                            <p className="text-sm text-[var(--muted)]">Review and grade what learners have turned in.</p>
                        </div>

                        <Link
                            className="inline-flex items-center justify-center rounded-xl bg-[var(--main)] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(42,107,92,0.25)] transition hover:-translate-y-0.5 hover:bg-[var(--secondary)]"
                            to={`/courses/${activeCourseId}/assignments/${assignmentId}/submissions`}
                        >
                            Open grading
                        </Link>
                    </section>
                ) : (
                    <SubmissionPanel assignment={assignment} submission={submission} onSaved={setSubmission} />
                )}
            </div>
        </div>
    );
}

function SubmissionPanel({ assignment, submission, onSaved }) {
    const [text, setText] = useState(submission?.submissionText ?? '');
    const [fileUrl, setFileUrl] = useState(submission?.fileUrl ?? '');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const graded = submission?.status === 'graded';
    const closed = new Date(assignment.dueDate) < new Date();
    const percent = assignment.maxPoints > 0 ? Math.min(100, Math.max(0, (Number(submission?.grade) / assignment.maxPoints) * 100)) : 0;

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const data = await api.post('/submissions', {
                assignment: assignment._id,
                submissionText: text,
                fileUrl: fileUrl || undefined,
            });
            onSaved(data.submission ?? data);
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="font-[family-name:var(--headings)] text-xl font-bold text-[var(--secondary)]">Your work</h2>

            <p
                className={`flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    submission?.status === 'submitted'
                        ? 'bg-[var(--warning)]/15 text-[var(--warning)]'
                        : submission?.status === 'graded'
                            ? 'bg-[var(--main)]/10 text-[var(--main)]'
                            : 'bg-[var(--highlight)]/50 text-[var(--muted)]'
                }`}
            >
                <span className={`inline-block size-2 shrink-0 rounded-full ${submission?.status === 'submitted' ? 'bg-[var(--warning)]' : submission?.status === 'graded' ? 'bg-[var(--main)]' : 'bg-[var(--muted)]'}`} />
                {STATUS_LABEL[submission?.status ?? 'pending']}
                {submission?.submittedAt && (
                    submission?.status === 'graded'
                        ? ` ${formatDate(submission.submittedAt)}`
                        : ` ${formatDate(submission.submittedAt)} | awaiting grade`
                )}
            </p>

            {graded && (
                <div className="flex flex-col gap-3 rounded-xl bg-[var(--main)]/10 p-4">
                    <p className="font-[family-name:var(--headings)] text-4xl font-bold leading-none text-[var(--secondary)]">
                        {submission.grade}
                        <span className="text-base font-medium text-[var(--muted)]"> / {assignment.maxPoints}</span>
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-white/80" role="presentation">
                        <div className="h-full rounded-full bg-[var(--main)]" style={{ width: `${percent}%` }} />
                    </div>
                    {submission.feedback && <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--shadow)]">{submission.feedback}</p>}
                </div>
            )}

            {graded ? (
                <p className="text-sm text-[var(--muted)]">This assignment has been graded and can no longer be changed.</p>
            ) : submission?.status === 'submitted' ? (
                <p className="text-sm text-[var(--muted)]">Your score will be visible once your instructor grades this assignment.</p>
            ) : (
                <form className="flex flex-col gap-4" onSubmit={submit}>
                    <ErrorNote error={error} />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="s-text">Answer <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <textarea
                            className="w-full resize-y rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)]/70 transition focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(42,107,92,0.15)]"
                            placeholder="Write your answer here"
                            id="s-text"
                            rows={7}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="s-file">Link to a file <span className="font-normal text-[var(--muted)]">(optional)</span></label>
                        <input
                            className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)]/70 transition focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(42,107,92,0.15)]"
                            id="s-file"
                            type="url"
                            placeholder="https://"
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                        />
                    </div>

                    {closed && (
                        <p className="rounded-xl bg-[var(--warning)]/15 px-4 py-3 text-sm font-medium text-[var(--warning)]">The due date has passed. Your work will be marked late.</p>
                    )}

                    <button
                        className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--main)] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(42,107,92,0.25)] transition hover:-translate-y-0.5 hover:bg-[var(--secondary)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                        disabled={busy || (!text.trim() && !fileUrl)}
                    >
                        {busy ? 'Turning in…' : 'Turn in'}
                    </button>
                </form>
            )}
        </section>
    );
}