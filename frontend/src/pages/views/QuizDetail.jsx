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

export default function QuizDetail() {
    const { courseId, quizId } = useParams();
    const { canTeach } = useAuth();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [state, setState] = useState({ loading: true, error: null });

    const load = useCallback(() => {
        setState({ loading: true, error: null });
        const calls = [api.get(`/quizzes/${quizId}`)];
        if (!canTeach) calls.push(api.get(`/submissions/my?quiz=${quizId}`).catch(() => null));

        Promise.all(calls)
            .then(([q, s]) => {
                const quizData = q.quiz ?? q;
                setQuiz(quizData);

                const subList = Array.isArray(s)
                    ? s : s?.submissions ?? (s?.submission ? [s.submission] : s?._id ? [s] : []);

                const subData = subList.find((x) =>
                        String(x?.quiz?._id ?? x?.quiz) === String(quizId) &&
                        x?.status !== 'pending'
                    ) ?? null;
                setSubmission(subData);

                if (subData?.answers) {
                    const answersObj = Array.isArray(subData.answers)
                        ? Object.fromEntries(subData.answers.map((ans, idx) => [idx, ans]))
                        : subData.answers;
                    setAnswers(answersObj);
                }

                const cId = courseId || (typeof quizData.course === 'object' ? quizData.course?._id : quizData.course);
                if (typeof quizData.course === 'object' && quizData.course?.title) {
                    setCourse(quizData.course);
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
    }, [quizId, courseId, canTeach]);

    useEffect(load, [load]);

    async function deleteQuiz() {
        if (!window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/quizzes/${quizId}`);
            const activeCourseId = courseId || course?._id;
            navigate(activeCourseId ? `/courses/${activeCourseId}` : '/courses', { replace: true });
        } catch (err) {
            setState((current) => ({ ...current, error: err }));
        }
    }

    function handleSelectChoice(questionIndex, choiceIndex) {
        if (canTeach || submission) return;
        setAnswers((prev) => ({
            ...prev,
            [questionIndex]: choiceIndex,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);

        const totalQuestions = quiz.questions?.length ?? 0;
        const formattedAnswers = Array.from({ length: totalQuestions }, (_, i) => answers[i] ?? null);

        try {
            const data = await api.post('/submissions', {
                quiz: quizId,
                answers: formattedAnswers,
            });
            setSubmission(data?.submission ?? data);
        } catch (err) {
            setSubmitError(err);
        } finally {
            setSubmitting(false);
        }
    }

    if (state.loading) return <Loading label="Loading quiz" />;
    if (state.error) return <ErrorNote error={state.error} onRetry={load} />;
    if (!quiz) return null;

    const meta = dueMeta(quiz.dueDate);
    const activeCourseId = courseId || course?._id || (typeof quiz.course === 'object' ? quiz.course?._id : quiz.course);
    const questionsCount = quiz.questions?.length ?? 0;
    const answeredCount = Object.keys(answers).length;
    const locked = canTeach || Boolean(submission);

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-12">
            {course && typeof course === 'object' ? (
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
                <div className="h-2 bg-linear-to-r from-[var(--main)] to-[var(--secondary)]" aria-hidden="true" />

                <div className="flex flex-col gap-4 p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[var(--secondary)]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--secondary)]">Quiz</span>
                            {course?.courseCode && (
                                <span className="rounded-full bg-[var(--highlight)]/50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--secondary)]">{course.courseCode}</span>
                            )}
                        </div>

                        {canTeach && (
                            <div className="flex items-center gap-2">
                                <Link
                                    className="inline-flex items-center rounded-lg border border-[var(--main)] px-3.5 py-2 text-xs font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white"
                                    to={`/courses/${activeCourseId}/quizzes/${quiz._id}/edit`}
                                    aria-label={`Edit quiz ${quiz.title}`}
                                    title="Edit quiz"
                                >
                                    <span aria-hidden="true">Edit</span>
                                </Link>

                                <button
                                    className="inline-flex items-center rounded-lg border border-[var(--danger)] px-3.5 py-2 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white"
                                    type="button"
                                    onClick={deleteQuiz}
                                    aria-label={`Delete quiz ${quiz.title}`}
                                    title="Delete quiz"
                                >
                                    <span aria-hidden="true">Delete</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <h1 className="font-[family-name:var(--headings)] text-3xl font-bold tracking-[-0.02em] text-[var(--secondary)] sm:text-4xl">{quiz.title}</h1>

                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[var(--highlight)]/50 px-3 py-1.5 text-[var(--secondary)] ${meta.className ?? ''}`}>
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                            {meta.label}
                        </span>
                        <span className="rounded-full bg-[var(--main)]/10 px-3 py-1.5 text-[var(--main)]">{quiz.maxPoints} points</span>
                        <span className="rounded-full bg-[var(--secondary)]/10 px-3 py-1.5 text-[var(--secondary)]">{questionsCount} {questionsCount === 1 ? 'question' : 'questions'}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="flex flex-col gap-6">
                    <section className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm sm:p-8">
                        <h2 className="font-[family-name:var(--headings)] text-xl font-bold text-[var(--secondary)]">Instructions</h2>
                        <p className="whitespace-pre-line text-sm leading-7 text-[var(--shadow)]">{quiz.description}</p>
                    </section>

                    <section className="flex flex-col gap-4">
                        <div className="flex items-end justify-between gap-3">
                            <h2 className="font-[family-name:var(--headings)] text-xl font-bold text-[var(--secondary)]">Questions</h2>
                            <span className="text-xs font-medium text-[var(--muted)]">{questionsCount} {questionsCount === 1 ? 'question' : 'questions'}</span>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <ol className="flex flex-col gap-5">
                                {(quiz.questions ?? []).map((question, questionIndex) => (
                                    <li className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm sm:p-6" key={`${quiz._id}-${questionIndex}`}>
                                        <div className="flex items-start gap-3">
                                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--main)] text-sm font-bold text-white">{questionIndex + 1}</span>
                                            <h3 className="pt-1 text-base font-semibold leading-snug text-[var(--shadow)]">{question.prompt}</h3>
                                        </div>

                                        <ul className="flex flex-col gap-2.5">
                                            {question.choices.map((choice, choiceIndex) => {
                                                const isSelected = answers[questionIndex] === choiceIndex;
                                                const isCorrectChoice = canTeach && choiceIndex === question.correctAnswer;

                                                return (
                                                    <li key={`${questionIndex}-${choiceIndex}`}>
                                                        <label
                                                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition has-[:focus-visible]:shadow-[0_0_0_3px_rgba(42,107,92,0.25)] ${
                                                                locked ? 'cursor-default' : 'cursor-pointer hover:border-[var(--main)]/60 hover:bg-[var(--main)]/5'
                                                            } ${
                                                                isSelected
                                                                    ? 'border-[var(--secondary)] bg-[var(--secondary)]/10'
                                                                    : isCorrectChoice
                                                                        ? 'border-[var(--main)] bg-[var(--main)]/10'
                                                                        : 'border-[var(--line)] bg-white'
                                                            }`}
                                                        >
                                                            <input
                                                                className="sr-only"
                                                                type="radio"
                                                                name={`question-${questionIndex}`}
                                                                checked={isSelected}
                                                                disabled={locked}
                                                                onChange={() => handleSelectChoice(questionIndex, choiceIndex)}
                                                            />
                                                            <span
                                                                className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                                                                    isSelected
                                                                        ? 'border-[var(--secondary)] bg-[var(--secondary)] text-white'
                                                                        : isCorrectChoice
                                                                            ? 'border-[var(--main)] bg-[var(--main)] text-white'
                                                                            : 'border-[var(--line)] text-[var(--muted)]'
                                                                }`}
                                                                aria-hidden="true"
                                                            >
                                                                {String.fromCharCode(65 + choiceIndex)}
                                                            </span>
                                                            <span className="flex-1 text-[var(--shadow)]">{choice}</span>
                                                            {isCorrectChoice && <strong className="rounded-full bg-[var(--main)] px-2.5 py-0.5 text-xs font-semibold text-white">Correct answer</strong>}
                                                            {!canTeach && isSelected && locked && <strong className="rounded-full bg-[var(--secondary)] px-2.5 py-0.5 text-xs font-semibold text-white">Your answer</strong>}
                                                        </label>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </li>
                                ))}
                            </ol>
                        </form>
                    </section>
                </div>

                {canTeach ? (
                    <section className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm lg:sticky lg:top-6">
                        <div className="flex flex-col gap-1">
                            <h2 className="font-[family-name:var(--headings)] text-xl font-bold text-[var(--secondary)]">Submissions</h2>
                            <p className="text-sm text-[var(--muted)]">Review and grade what learners have turned in.</p>
                        </div>

                        <Link
                            className="inline-flex items-center justify-center rounded-xl bg-[var(--main)] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(42,107,92,0.25)] transition hover:-translate-y-0.5 hover:bg-[var(--secondary)]"
                            to={`/courses/${activeCourseId}/quizzes/${quizId}/submissions`}
                        >
                            Open grading
                        </Link>
                    </section>
                ) : (
                    <SubmissionPanel
                        quiz={quiz}
                        submission={submission}
                        answeredCount={answeredCount}
                        questionsCount={questionsCount}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        error={submitError}
                    />
                )}
            </div>
        </div>
    );
}

function SubmissionPanel({ quiz, submission, answeredCount, questionsCount, onSubmit, submitting, error }) {
    const graded = submission?.status === 'graded';
    const closed = new Date(quiz.dueDate) < new Date();
    const score = submission?.grade ?? submission?.score ?? 0;
    const scorePercent = quiz.maxPoints > 0 ? Math.min(100, Math.max(0, (Number(score) / quiz.maxPoints) * 100)) : 0;
    const progressPercent = questionsCount > 0 ? Math.min(100, (answeredCount / questionsCount) * 100) : 0;

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
                {submission?.submittedAt && ` ${formatDate(submission.submittedAt)} | awaiting grade`}
            </p>

            {graded && (
                <div className="flex flex-col gap-3 rounded-xl bg-[var(--main)]/10 p-4">
                    <p className="font-[family-name:var(--headings)] text-4xl font-bold leading-none text-[var(--secondary)]">
                        {score}
                        <span className="text-base font-medium text-[var(--muted)]"> / {quiz.maxPoints}</span>
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-white/80" role="presentation">
                        <div className="h-full rounded-full bg-[var(--main)]" style={{ width: `${scorePercent}%` }} />
                    </div>
                    {submission.feedback && <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--shadow)]">{submission.feedback}</p>}
                </div>
            )}

            {graded ? (
                <p className="text-sm text-[var(--muted)]">This quiz has been graded and can no longer be changed.</p>
            ) : submission?.status === 'submitted' ? (
                <p className="text-sm text-[var(--muted)]">Your score will be visible once your instructor grades this quiz.</p>
            ) : (
                <form className="flex flex-col gap-4" onSubmit={onSubmit}>
                    <ErrorNote error={error} />

                    <div className="flex flex-col gap-2">
                        <p className="flex items-center justify-between text-sm font-medium text-[var(--muted)]">
                            <span>Answered {answeredCount} of {questionsCount} questions</span>
                            <span className="text-xs font-semibold text-[var(--main)]">{Math.round(progressPercent)}%</span>
                        </p>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--highlight)]/60" role="presentation">
                            <div className="h-full rounded-full bg-[var(--main)] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>

                    {closed && (
                        <p className="rounded-xl bg-[var(--warning)]/15 px-4 py-3 text-sm font-medium text-[var(--warning)]">The due date has passed. Your work will be marked late.</p>
                    )}

                    <button
                        className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--main)] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(42,107,92,0.25)] transition hover:-translate-y-0.5 hover:bg-[var(--secondary)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                        disabled={submitting || answeredCount < questionsCount}
                    >
                        {submitting ? 'Submitting…' : 'Submit Quiz'}
                    </button>
                </form>
            )}
        </section>
    );
}