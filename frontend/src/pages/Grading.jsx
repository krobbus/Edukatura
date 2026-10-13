import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { dueMeta, formatDate, fullName, capitalizeFirstLetter } from '../utils';
import Loading from '../components/Loading';
import ErrorNote from '../components/ErrorNote';
import EmptyState from '../components/EmptyState';

function getId(val) {
    if (!val) return null;
    return typeof val === 'object' ? String(val._id ?? val.id ?? '') : String(val);
}

export default function Grading() {
    const { courseId, assignmentId, quizId } = useParams();
    const { canTeach } = useAuth();
    const navigate = useNavigate();

    const itemId = quizId || assignmentId;
    const isQuiz = Boolean(quizId);
    const courseworkType = isQuiz ? 'quizzes' : 'assignments';

    const [course, setCourse] = useState(null);
    const [item, setItem] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [state, setState] = useState({ loading: true, error: null });

    const load = useCallback(async () => {
        setState({ loading: true, error: null });
        const itemEndpoint = isQuiz ? `/quizzes/${itemId}` : `/assignments/${itemId}`;

        try {
            const itemRes = await api.get(itemEndpoint);
            const itemData = itemRes.quiz ?? itemRes.assignment ?? itemRes;
            setItem(itemData);

            const targetAssId = getId(itemData.assignment) || getId(itemData._id) || itemId;

            let subRes = null;
            try {
                subRes = await api.get(`/submissions?assignment=${targetAssId}${isQuiz ? `&quiz=${itemId}` : ''}`);
            } catch {
                try {
                    subRes = await api.get(`/submissions?assignment=${targetAssId}`);
                } catch {
                    subRes = await api.get(`/submissions?quiz=${itemId}`);
                }
            }

            const list = subRes?.submissions ?? (Array.isArray(subRes) ? subRes : subRes?.data ?? []);
            setSubmissions(list);

            setSelectedId((id) => id ?? list.find((x) => x.status !== 'graded')?._id ?? list[0]?._id ?? null);

            const cId = courseId || getId(itemData.course);
            if (typeof itemData.course === 'object' && itemData.course?.title) {
                setCourse(itemData.course);
                setState({ loading: false, error: null });
            } else if (cId) {
                try {
                    const cRes = await api.get(`/courses/${cId}`);
                    setCourse(cRes.course ?? cRes);
                } catch {

                } finally {
                    setState({ loading: false, error: null });
                }
            } else {
                setState({ loading: false, error: null });
            }
        } catch (err) {
            setState({ loading: false, error: err });
        }
    }, [itemId, isQuiz, courseId]);

    useEffect(() => {
        load();
    }, [load]);

    async function deleteItem() {
        const itemLabel = isQuiz ? 'quiz' : 'assignment';
        if (!window.confirm(`Delete ${itemLabel} "${item?.title}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/${courseworkType}/${itemId}`);
            const activeCourseId = courseId || course?._id;
            navigate(activeCourseId ? `/courses/${activeCourseId}` : '/courses', { replace: true });
        } catch (err) {
            setState((current) => ({ ...current, error: err }));
        }
    }

    if (state.loading) return <Loading label="Loading submissions" />;
    if (state.error) return <ErrorNote error={state.error} onRetry={load} />;
    if (!item) return null;

    const activeCourseId = courseId || course?._id || getId(item.course);
    const turnedIn = submissions.filter((s) => s.status !== 'pending');
    const selected = submissions.find((s) => s._id === selectedId) ?? null;
    const meta = dueMeta(item.dueDate);

    function applyGrade(updated) {
        setSubmissions((list) =>
            list.map((s) => {
                if (s._id !== updated._id) return s;

                const learner = typeof updated.learner === 'object' && updated.learner ? updated.learner : s.learner;
                return { ...s, ...updated, learner };
            })
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-8">
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
                    <span className="text-sm font-bold text-[var(--main)] select-none">/</span>
                    <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to={`/courses/${activeCourseId}/${courseworkType}/${itemId}`}>
                        {item?.title ? item.title : `Back to ${courseworkType === 'quizzes' ? "Quiz" : "Assignment"}`}
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

            <header className="relative flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm">
                {canTeach && (
                    <div className="flex items-center gap-2 sm:absolute sm:right-5 sm:top-5">
                        <Link
                            className="inline-flex items-center rounded-lg border border-[var(--main)] px-3 py-1.5 text-xs font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white"
                            to={`/courses/${activeCourseId}/${courseworkType}/${itemId}/edit`}
                            aria-label={`Edit ${isQuiz ? 'quiz' : 'assignment'} ${item.title}`}
                            title={`Edit ${isQuiz ? 'quiz' : 'assignment'}`}
                        >
                            <span aria-hidden="true">Edit</span>
                        </Link>

                        <button
                            className="inline-flex items-center rounded-lg border border-[var(--danger)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white cursor-pointer"
                            type="button"
                            onClick={deleteItem}
                            aria-label={`Delete ${isQuiz ? 'quiz' : 'assignment'} ${item.title}`}
                            title={`Delete ${isQuiz ? 'quiz' : 'assignment'}`}
                        >
                            <span aria-hidden="true">Delete</span>
                        </button>
                    </div>
                )}

                {course?.courseCode && <span className="text-xs font-bold uppercase tracking-widest text-[var(--main)]">{course.courseCode}</span>}
                <h1 className="font-[family-name:var(--headings)] text-3xl font-bold text-[var(--secondary)]">{item.title}</h1>
                <p className={`self-start rounded-full bg-[var(--main)]/10 px-3 py-1 text-xs font-semibold text-[var(--secondary)] ${meta.className}`}>
                    {meta.label} · {item.maxPoints} points
                </p>
            </header>

            {turnedIn.length === 0 ? (
                <EmptyState title="Nothing turned in yet" body="Submissions appear here as learners turn work in." />
            ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
                    <ul className="flex flex-col gap-2 self-start">
                        {turnedIn.map((s) => (
                            <li key={s._id}>
                                <button
                                    type="button"
                                    className={`flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left cursor-pointer transition ${
                                        s._id === selectedId
                                            ? 'border-[var(--main)] bg-[var(--main)]/20'
                                            : 'border-[var(--line)] bg-[var(--panel)] hover:border-[var(--main)]'
                                    }`}
                                    onClick={() => setSelectedId(s._id)}
                                    aria-current={s._id === selectedId}
                                >
                                    <span className="text-sm font-semibold text-[var(--shadow)]">{fullName(s.learner)}</span>
                                    <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
                                        <span className={`inline-block h-2 w-2 rounded-full ${s.status === 'submitted' ? 'bg-[var(--warning)]' : 'bg-[var(--main)]'}`} />
                                        {s.status === 'graded'
                                            ? `${s.grade} / ${item?.maxPoints}`
                                            : formatDate(s.submittedAt, false)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {selected ? (
                        <GradePanel
                            key={selected._id}
                            item={item}
                            submission={selected}
                            maxPoints={item?.maxPoints ?? 100}
                            isQuiz={isQuiz}
                            onGraded={applyGrade}
                        />
                    ) : (
                        <EmptyState title="Pick a learner" body="Choose a submission from the list to review it." />
                    )}
                </div>
            )}
        </div>
    );
}

function GradePanel({ item, submission, maxPoints, isQuiz, onGraded }) {
    const [grade, setGrade] = useState(submission.grade ?? '');
    const [feedback, setFeedback] = useState(submission.feedback ?? '');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(false);

    let parsedAnswers = submission?.answers;
    if (typeof parsedAnswers === 'string') {
        try {
            parsedAnswers = JSON.parse(parsedAnswers);
        } catch (e) {
            parsedAnswers = {};
        }
    }
    if (!parsedAnswers) {
        parsedAnswers = {};
    }

    function handleAutoGradeQuiz() {
        const questions = item?.questions ?? [];
        if (questions.length === 0) return;

        let correctCount = 0;
        questions.forEach((q, idx) => {
            const learnerAnswer = Array.isArray(parsedAnswers)
                ? parsedAnswers[idx]
                : parsedAnswers[idx] ?? parsedAnswers[q._id];

            const correctText = q.choices?.[Number(q.correctAnswer)];
            if (
                learnerAnswer != null &&
                (String(learnerAnswer) === String(q.correctAnswer) ||
                    String(learnerAnswer) === String(correctText))
            ) {
                correctCount += 1;
            }
        });

        const calculated = Math.round((correctCount / questions.length) * Number(maxPoints) * 10) / 10;
        setGrade(Number.isNaN(calculated) ? '' : calculated);
        setSaved(false);
    }

    async function submit(e) {
        e.preventDefault();
        const value = Number(grade);
        if (grade === '' || Number.isNaN(value) || value < 0 || value > maxPoints) {
            setError(`Enter a grade between 0 and ${maxPoints}.`);
            return;
        }
        setBusy(true);
        setError(null);

        try {
            const data = await api.put(`/submissions/${submission._id}/grade`, { grade: value, feedback });
            onGraded(data.submission ?? data);
            setSaved(true);
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    }

    const isReadOnlyGrade = isQuiz;

    return (
        <section className="flex flex-col gap-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm">
            <div>
                <h2 className="font-[family-name:var(--headings)] text-2xl font-semibold text-[var(--secondary)]">{fullName(submission.learner)}</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Turned in {formatDate(submission.submittedAt)}</p>
            </div>

            {item?.description && (
                <div className="rounded-lg bg-[var(--page-bg)]/40 p-4">
                    <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Instructions</h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--shadow)]">{item.description}</p>
                </div>
            )}

            {submission.submissionText ? (
                <span className="block whitespace-pre-line rounded-lg border border-[var(--line)] p-4 text-sm leading-relaxed text-[var(--shadow)]">
                    <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Answer</h3>
                    {submission.submissionText}
                </span>
            ) : (
                !isQuiz && <p className="text-sm italic text-[var(--muted)]">No written answer.</p>
            )}

            {submission.fileUrl && (
                <p>
                    <a className="text-sm font-semibold text-[var(--main)] underline hover:text-[var(--secondary)]" href={submission.fileUrl} target="_blank" rel="noreferrer">
                        Open attached file
                    </a>
                </p>
            )}

            {isQuiz && item?.questions && (
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Quiz Responses</h3>
                    <button
                        className="self-start rounded-lg border border-[var(--main)] px-3 py-1.5 text-xs font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white cursor-pointer"
                        type="button"
                        onClick={handleAutoGradeQuiz}
                    >
                        Auto-calculate Grade
                    </button>

                    <ol className="flex list-decimal flex-col gap-3 pl-5 marker:font-semibold marker:text-[var(--main)]">
                        {item.questions.map((q, qIdx) => {
                            const learnerAnswer = Array.isArray(submission.answers) ? submission.answers[qIdx] : submission.answers?.[qIdx];
                            return (
                                <li key={qIdx} className="rounded-lg border border-[var(--line)] p-4">
                                    <h3 className="text-sm font-semibold text-[var(--shadow)]">{q.prompt}</h3>

                                    <ul className="mt-2 flex flex-col gap-1 text-sm text-[var(--shadow)]">
                                        {q.choices.map((choice, cIdx) => (
                                            <li key={cIdx}>
                                                {choice}
                                                {q.correctAnswer === cIdx && <strong className="text-[var(--main)]"> ✓ Correct</strong>}
                                                {learnerAnswer === cIdx && <strong className="text-[var(--warning)]"> (Learner Answer)</strong>}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}

            <form className="flex flex-col gap-4" onSubmit={submit}>
                <ErrorNote error={error} />

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="grade">
                            Grade <span className="requiredMarker" aria-hidden="true" hidden={isReadOnlyGrade}>*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                className="w-28 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] read-only:bg-[var(--highlight)]/60 focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                                id="grade"
                                type="number"
                                min={0}
                                max={maxPoints}
                                step="0.5"
                                value={grade}
                                readOnly={isReadOnlyGrade}
                                tabIndex={isReadOnlyGrade ? -1 : undefined}
                                onChange={(e) => {
                                    if (isReadOnlyGrade) return;
                                    setGrade(e.target.value);
                                    setSaved(false);
                                }}
                                style={
                                    isReadOnlyGrade ?
                                        {
                                            pointerEvents: 'none',
                                            userSelect: 'none'
                                        } : undefined
                                }
                                required
                            />
                            <span className="text-sm font-medium text-[var(--muted)]">/ {maxPoints}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="feedback">Feedback</label>
                        <textarea
                            className="w-full resize-y rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="feedback"
                            placeholder="Add feedback for the learner"
                            rows={5}
                            maxLength={100}
                            value={feedback}
                            onChange={(e) => {
                                setFeedback(e.target.value);
                                setSaved(false);
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="inline-flex items-center justify-center rounded-lg bg-[var(--main)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        disabled={busy}
                    >
                        {busy ? 'Saving…' : submission.status === 'graded' ? 'Update grade' : 'Save grade'}
                    </button>
                    {saved && <span className="text-sm font-medium text-[var(--main)]">Grade saved.</span>}
                </div>
            </form>
        </section>
    );
}