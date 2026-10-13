import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { dueMeta, formatDate, fullName, initials, spineColor } from '../../utils';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';
import EmptyState from '../../components/EmptyState';

export default function CourseDetail() {
    const { courseId } = useParams();
    const { canTeach } = useAuth();

    const navigate = useNavigate();

    const [tab, setTab] = useState('work');
    const [roster, setRoster] = useState([]);
    const [enrolled, setEnrolled] = useState(false);
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });

    const load = useCallback(() => {
        setState({ loading: true, error: null });
        Promise.all([
            api.get(`/courses/${courseId}`),
            api.get(canTeach ? `/enrollments?course=${courseId}` : '/enrollments/my'),
        ])
            .then(async ([courseResponse, enrollmentResponse]) => {
                const courseData = courseResponse.course ?? courseResponse;
                const enrollments = enrollmentResponse?.enrollments ?? enrollmentResponse ?? [];

                const isEnrolled = canTeach
                    || courseData.isEnrolled === true
                    || (Array.isArray(enrollments) && enrollments.some((e) => String(e.course?._id ?? e.course) === String(courseId)));

                setCourse(courseData);
                setEnrolled(isEnrolled);
                setRoster(canTeach && Array.isArray(enrollments) ? enrollments : []);

                if (isEnrolled) {
                    const [moduleResponse, assignmentResponse, quizResponse] = await Promise.all([
                        api.get(`/modules?course=${courseId}`),
                        api.get(`/assignments?course=${courseId}`),
                        api.get(`/quizzes?course=${courseId}`),
                    ]);
                    setModules(moduleResponse.modules ?? moduleResponse ?? []);
                    setAssignments(assignmentResponse.assignments ?? assignmentResponse ?? []);
                    setQuizzes(quizResponse.quizzes ?? quizResponse ?? []);
                } else {
                    setModules([]);
                    setAssignments([]);
                    setQuizzes([]);
                }

                setState({ loading: false, error: null });
            })
            .catch((error) => setState({ loading: false, error }));
    }, [courseId, canTeach]);

    useEffect(load, [load]);

    if (state.loading) return <Loading label="Loading course" />;
    if (state.error) return <ErrorNote error={state.error} onRetry={load} />;
    if (!course) return null;

    const hasAccess = canTeach || enrolled;

    const byModule = (moduleId) => assignments.filter((assignment) => (assignment.module?._id ?? assignment.module) === moduleId);
    const looseAssignments = assignments.filter((assignment) => !assignment.module);
    const quizzesByModule = (moduleId) => quizzes.filter((quiz) => (quiz.module?._id ?? quiz.module) === moduleId);
    const looseQuizzes = quizzes.filter((quiz) => !quiz.module);

    async function deleteCourse() {
        if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) return;

        try {
            await api.delete(`/courses/${courseId}`);
            navigate('/courses', { replace: true });
        } catch (error) {
            setState((current) => ({ ...current, error }));
        }
    }

    async function deleteModule(moduleId, title) {
        if (!window.confirm(`Delete module "${title}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/modules/${moduleId}`);
            setModules((list) => list.filter((m) => m._id !== moduleId));
        } catch (error) {
            setState((current) => ({ ...current, error }));
        }
    }

    async function deleteAssignment(id, title) {
        if (!window.confirm(`Delete assignment "${title}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/assignments/${id}`);
            setAssignments((list) => list.filter((item) => item._id !== id));
        } catch (error) {
            setState((current) => ({ ...current, error }));
        }
    }

    async function deleteQuiz(id, title) {
        if (!window.confirm(`Delete quiz "${title}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/quizzes/${id}`);
            setQuizzes((list) => list.filter((item) => item._id !== id));
        } catch (error) {
            setState((current) => ({ ...current, error }));
        }
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-12">
            <div className="inline-flex w-fit items-center gap-1.5">
                <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to="/dashboard">
                    Dashboard
                </Link>
                <span className="text-sm font-semibold text-[var(--main)] select-none">/</span>
                <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to="/courses">
                    My courses
                </Link>
            </div>

            <header
                className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)] shadow-sm"
                style={{ '--spine': spineColor(course.courseCode) }}
            >
                <div className="relative flex h-32 items-end bg-[var(--spine)] p-6 sm:h-36 sm:px-8">
                    <span className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" aria-hidden="true" />
                    <span className="absolute -right-10 -top-14 size-52 rounded-full bg-white/15" aria-hidden="true" />
                    <span className="absolute -bottom-20 right-40 size-44 rounded-full bg-white/10" aria-hidden="true" />

                    <span className="relative rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--secondary)] shadow-sm">
                        {course.courseCode}
                    </span>
                </div>

                <div className="flex flex-col gap-5 p-6 sm:px-8 sm:py-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <h1 className="font-[family-name:var(--headings)] text-3xl font-bold tracking-[-0.02em] text-[var(--secondary)] sm:text-4xl">{course.title}</h1>
                            {course.instructor && typeof course.instructor === 'object' && (
                                <p className="text-sm font-semibold text-[var(--main)]">Taught by {fullName(course.instructor)}</p>
                            )}
                        </div>

                        {canTeach && (
                            <div className="flex items-center gap-2">
                                <Link
                                    className="inline-flex items-center rounded-lg border border-[var(--main)] px-3.5 py-2 text-xs font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white"
                                    to={`/courses/${course._id}/edit`}
                                    aria-label={`Edit ${course.title}`}
                                    title="Edit course"
                                >
                                    <span aria-hidden="true">Edit</span>
                                </Link>

                                <button
                                    className="inline-flex items-center rounded-lg border border-[var(--danger)] px-3.5 py-2 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white"
                                    type="button"
                                    onClick={deleteCourse}
                                    aria-label="Delete course"
                                    title="Delete course"
                                >
                                    <span aria-hidden="true">Delete</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {course.description && <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">{course.description}</p>}

                    {hasAccess && (
                        <ul className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-5 text-xs font-semibold text-[var(--secondary)]">
                            <li className="rounded-full bg-[var(--highlight)]/50 px-3 py-1.5">{modules.length} {modules.length === 1 ? 'module' : 'modules'}</li>
                            <li className="rounded-full bg-[var(--highlight)]/50 px-3 py-1.5">{assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}</li>
                            <li className="rounded-full bg-[var(--highlight)]/50 px-3 py-1.5">{quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'}</li>
                            {canTeach && (
                                <li className="rounded-full bg-[var(--highlight)]/50 px-3 py-1.5">{roster.length} {roster.length === 1 ? 'learner' : 'learners'}</li>
                            )}
                        </ul>
                    )}
                </div>
            </header>
            
            {canTeach ? ( 
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex gap-1 rounded-xl bg-[var(--panel)]/60 p-1" role="tablist">
                        <button
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--secondary)] aria-selected:bg-[var(--main)] aria-selected:text-white aria-selected:shadow-sm cursor-pointer"
                            role="tab"
                            aria-selected={tab === 'work'}
                            onClick={() => setTab('work')}
                        >
                            Coursework
                        </button>

                        <button
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--secondary)] aria-selected:bg-[var(--main)] aria-selected:text-white aria-selected:shadow-sm cursor-pointer"
                            role="tab"
                            aria-selected={tab === 'users'}
                            onClick={() => setTab('users')}
                        >
                            Learners ({roster.length})
                        </button>
                    </div>

                    {tab === 'work' && (
                        <div className="flex flex-wrap gap-2">
                            <Link
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--main)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--secondary)]"
                                to={`/courses/${courseId}/modules/new`}
                            >
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                                Add module
                            </Link>

                            <Link
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--main)] bg-white px-4 py-2 text-sm font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white"
                                to={`/courses/${courseId}/assignments/new`}
                            >
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                                Post assignment
                            </Link>

                            <Link
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--main)] bg-white px-4 py-2 text-sm font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white"
                                to={`/courses/${courseId}/quizzes/new`}
                            >
                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                                Create quiz
                            </Link>
                        </div>
                    )}
                </div>
            ) : hasAccess ? (
                <h1 className="font-[family-name:var(--headings)] text-2xl font-bold tracking-[-0.02em] text-[var(--secondary)]">
                    Modules & Courseworks
                </h1>
            ) : null}

            {!hasAccess ? null : tab === 'users' ? <Roster roster={roster} /> : (
                modules.length === 0 && assignments.length === 0 && quizzes.length === 0 ? (
                    <EmptyState
                        title="No coursework yet"
                        body={canTeach ? 'Add a module to group your material, then post assignments into it.' : 'Your instructor has not posted anything here yet.'}
                    />
                ) : (
                    <div className="flex flex-col gap-5">
                        {modules.map((module, index) => (
                            <ModuleBlock
                                key={module._id}
                                index={index + 1}
                                courseId={courseId}
                                module={module}
                                assignments={byModule(module._id)}
                                quizzes={quizzesByModule(module._id)}
                                canTeach={canTeach}
                                onDeleteModule={deleteModule}
                                onDeleteAssignment={deleteAssignment}
                                onDeleteQuiz={deleteQuiz}
                            />
                        ))}

                        {looseAssignments.length > 0 && (
                            <ModuleBlock
                                courseId={courseId}
                                module={{ title: 'Other assignments' }}
                                assignments={looseAssignments}
                                quizzes={[]}
                                canTeach={canTeach}
                                onDeleteAssignment={deleteAssignment}
                                onDeleteQuiz={deleteQuiz}
                            />
                        )}

                        {looseQuizzes.length > 0 && (
                            <ModuleBlock
                                courseId={courseId}
                                module={{ title: 'Other quizzes' }}
                                assignments={[]}
                                quizzes={looseQuizzes}
                                canTeach={canTeach}
                                onDeleteAssignment={deleteAssignment}
                                onDeleteQuiz={deleteQuiz}
                            />
                        )}
                    </div>
                )
            )}
        </div>
    );
}

function Roster({ roster }) {
    if (roster.length === 0) return <EmptyState title="No learners enrolled" body="Share the course code so learners can enrol." />;
    return (
        <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-sm">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead className="bg-[var(--highlight)]/40 text-[var(--secondary)]">
                    <tr>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider">Learner</th>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider">Email</th>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider">Enrolled</th>
                    </tr>
                </thead>

                <tbody>
                    {roster.map((enrollment) => (
                        <tr className="border-t border-[var(--line)] transition hover:bg-[var(--main)]/5" key={enrollment._id}>
                            <td className="px-5 py-3.5">
                                <span className="flex items-center gap-3">
                                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--main)]/10 text-xs font-bold text-[var(--main)]" aria-hidden="true">
                                        {enrollment.learner ? initials(enrollment.learner) : '?'}
                                    </span>
                                    <span className="font-semibold text-[var(--shadow)]">{fullName(enrollment.learner)}</span>
                                </span>
                            </td>
                            <td className="px-5 py-3.5 text-[var(--muted)]">{enrollment.learner?.email}</td>
                            <td className="px-5 py-3.5 text-[var(--muted)]">{formatDate(enrollment.enrolledAt, false)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ModuleBlock({
    index,
    courseId,
    module,
    assignments,
    quizzes = [],
    canTeach,
    onDeleteModule,
    onDeleteAssignment,
    onDeleteQuiz
}) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-[var(--secondary)] to-[var(--main)] font-[family-name:var(--headings)] text-lg font-bold text-white shadow-sm">
                        {index ?? '•'}
                    </span>
                    <div className="flex flex-col">
                        <h2 className="font-[family-name:var(--headings)] text-xl font-bold tracking-[-0.01em] text-[var(--secondary)]">{module.title}</h2>
                        <span className="text-xs font-medium text-[var(--muted)]">
                            {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'} · {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'}
                        </span>
                    </div>
                </div>

                {canTeach && module._id && (
                    <div className="flex items-center gap-2">
                        <Link
                            className="inline-flex items-center rounded-lg border border-[var(--main)] px-3 py-1.5 text-xs font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white"
                            to={`/courses/${courseId}/modules/${module._id}/edit`}
                            aria-label={`Edit module ${module.title}`}
                            title="Edit module"
                        >
                            <span aria-hidden="true">Edit</span>
                        </Link>

                        <button
                            className="inline-flex items-center rounded-lg border border-[var(--danger)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white"
                            type="button"
                            onClick={() => onDeleteModule(module._id, module.title)}
                            aria-label={`Delete module ${module.title}`}
                            title="Delete module"
                        >
                            <span aria-hidden="true">Delete</span>
                        </button>
                    </div>
                )}
            </div>

            {module.description && <p className="text-sm leading-relaxed text-[var(--muted)]">{module.description}</p>}

            {assignments.length > 0 || quizzes.length > 0 ? (
                <ul className="flex flex-col gap-2.5">
                    {assignments.map((assignment) => {
                        const meta = dueMeta(assignment.dueDate);

                        return (
                            <li
                                key={assignment._id}
                                className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 transition hover:border-[var(--main)]/50 hover:shadow-sm"
                            >
                                <Link className="flex min-w-0 flex-1 items-center gap-3" to={`/courses/${courseId}/assignments/${assignment._id}`}>
                                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--main)]/10 text-sm font-bold text-[var(--main)]" title="Assignment">A</span>
                                    <span className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm font-semibold text-[var(--shadow)] transition group-hover:text-[var(--main)]">{assignment.title}</span>
                                        <span className={`text-xs font-medium text-[var(--muted)] ${meta.className ?? ''}`}>Assignment · {meta.label}</span>
                                    </span>
                                </Link>

                                {canTeach ? (
                                    <div className="flex items-center gap-2">
                                        <Link
                                            className="inline-flex items-center rounded-lg border border-[var(--main)] px-3 py-1.5 text-xs font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white"
                                            to={`/courses/${courseId}/assignments/${assignment._id}/edit`}
                                            aria-label={`Edit assignment ${assignment.title}`}
                                            title="Edit assignment"
                                        >
                                            <span aria-hidden="true">Edit</span>
                                        </Link>

                                        <button
                                            className="inline-flex items-center rounded-lg border border-[var(--danger)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white"
                                            type="button"
                                            onClick={() => onDeleteAssignment(assignment._id, assignment.title)}
                                            aria-label={`Delete assignment ${assignment.title}`}
                                            title="Delete assignment"
                                        >
                                            <span aria-hidden="true">Delete</span>
                                        </button>
                                    </div>
                                ) : (
                                    <Link className="min-w-0" to={`/courses/${courseId}/assignments/${assignment._id}`}>
                                        <span className="pt-1 text-xs font-semibold text-[var(--main)] cursor-pointer">View Assignment →</span>
                                    </Link>
                                )}
                            </li>
                        );
                    })}

                    {quizzes.map((quiz) => {
                        const meta = dueMeta(quiz.dueDate);
                        return (
                            <li
                                key={quiz._id}
                                className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 transition hover:border-[var(--secondary)]/50 hover:shadow-sm"
                            >
                                <Link className="flex min-w-0 flex-1 items-center gap-3" to={`/courses/${courseId}/quizzes/${quiz._id}`}>
                                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--main)]/10 text-sm font-bold text-[var(--main)]" title="Quiz">Q</span>
                                    <span className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm font-semibold text-[var(--shadow)] transition group-hover:text-[var(--secondary)]">{quiz.title}</span>
                                        <span className={`text-xs font-medium text-[var(--muted)] ${meta.className ?? ''}`}>Quiz · {meta.label}</span>
                                    </span>
                                </Link>

                                {canTeach ? (
                                    <div className="flex items-center gap-2">
                                        <Link
                                            className="inline-flex items-center rounded-lg border border-[var(--main)] px-3 py-1.5 text-xs font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white"
                                            to={`/courses/${courseId}/quizzes/${quiz._id}/edit`}
                                            aria-label={`Edit quiz ${quiz.title}`}
                                            title="Edit quiz"
                                        >
                                            <span aria-hidden="true">Edit</span>
                                        </Link>

                                        <button
                                            className="inline-flex items-center rounded-lg border border-[var(--danger)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white"
                                            type="button"
                                            onClick={() => onDeleteQuiz(quiz._id, quiz.title)}
                                            aria-label={`Delete quiz ${quiz.title}`}
                                            title="Delete quiz"
                                        >
                                            <span aria-hidden="true">Delete</span>
                                        </button>
                                    </div>
                                ) : (
                                    <Link className="min-w-0" to={`/courses/${courseId}/quizzes/${quiz._id}`}>
                                        <span className="pt-1 text-xs font-semibold text-[var(--main)] cursor-pointer">View Quiz →</span>
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="rounded-xl border border-dashed border-[var(--line)] px-4 py-5 text-center text-sm text-[var(--muted)]">
                    Nothing in this module yet.
                </p>
            )}
        </section>
    );
}