import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { dueMeta, spineColor } from '../utils';
import Loading from '../components/Loading';
import ErrorNote from '../components/ErrorNote';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
    const { user, canTeach } = useAuth();
    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [needsGrading, setNeedsGrading] = useState({});
    const [state, setState] = useState({ loading: true, error: null });

    function load() {
        setState({ loading: true, error: null });
        const controller = new AbortController();
        const requests = [
            api.get(canTeach ? '/courses' : '/enrollments/my', { signal: controller.signal }),
            api.get('/assignments?upcoming=true', { signal: controller.signal }),
            api.get('/quizzes?upcoming=true', { signal: controller.signal }),
        ];

        if (!canTeach) {
            requests.push(api.get('/submissions/my', { signal: controller.signal }).catch(() => []));
        }

        Promise.all(requests)
            .then(([c, a, q, s]) => {
                const rawCourses = c.courses ?? c ?? [];
                const courseList = canTeach ? rawCourses : rawCourses.map((e) => e.course).filter(Boolean);
                const courseIds = new Set(courseList.map((x) => String(x._id)));
                const inMyCourses = (item) =>
                    canTeach || courseIds.has(String(typeof item.course === 'object' ? item.course?._id : item.course));

                setCourses(courseList);
                setAssignments((a.assignments ?? a ?? []).filter(inMyCourses));
                setQuizzes((q.quizzes ?? q ?? []).filter(inMyCourses));

                if (s) {
                    setSubmissions(s.submissions ?? (Array.isArray(s) ? s : []));
                }
                setState({ loading: false, error: null });
            })
            .catch((err) => {
                if (err.name !== 'AbortError') setState({ loading: false, error: err });
            });
        return controller;
    }

    useEffect(() => {
        const controller = load();
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!canTeach) return;

        const items = [
            ...assignments.map((i) => ({ id: i._id, kind: 'assignment' })),
            ...quizzes.map((i) => ({ id: i._id, kind: 'quiz' })),
        ];
        if (items.length === 0) return;

        let cancelled = false;

        Promise.all(
            items.map(async ({ id, kind }) => {
                try {
                    const res = await api.get(`/submissions?${kind}=${id}`);
                    const list = res?.submissions ?? (Array.isArray(res) ? res : []);
                    return [`${kind}-${id}`, list.filter((s) => s.status === 'submitted').length];
                } catch {
                    return [`${kind}-${id}`, 0];
                }
            })
        ).then((entries) => {
            if (!cancelled) setNeedsGrading(Object.fromEntries(entries));
        });

        return () => { cancelled = true; };
    }, [assignments, quizzes, canTeach]);

    if (state.loading) return <Loading label="Loading your dashboard" />;

    const submittedIds = new Set(
        submissions.map((s) => {
            const aId = typeof s.assignment === 'object' ? s.assignment?._id : s.assignment;
            const qId = typeof s.quiz === 'object' ? s.quiz?._id : s.quiz;
            return aId || qId;
        }).filter(Boolean)
    );

    const gradedIds = new Set(
        submissions
            .filter((s) => s.status === 'graded')
            .map((s) => {
                const aId = typeof s.assignment === 'object' ? s.assignment?._id : s.assignment;
                const qId = typeof s.quiz === 'object' ? s.quiz?._id : s.quiz;
                return aId || qId;
            })
            .filter(Boolean)
    );

    const allItems = [
        ...assignments.map((item) => ({ ...item, kind: 'assignment' })),
        ...quizzes.map((item) => ({ ...item, kind: 'quiz' })),
    ];

    const soon = allItems
        .filter((item) => !submittedIds.has(item._id))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 6);

    const completed = allItems
        .filter((item) => submittedIds.has(item._id))
        .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
        .slice(0, 6);

    const dueCount = allItems.filter((item) => !submittedIds.has(item._id)).length;
    const completedCount = allItems.filter((item) => submittedIds.has(item._id)).length;
    const awaitingGrading = Object.values(needsGrading).reduce((sum, n) => sum + n, 0);
    const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pb-12">
            <header className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[var(--secondary)] to-[var(--main)] p-7 text-white shadow-[0_20px_50px_rgba(18,63,54,0.3)] sm:p-10">
                <span className="pointer-events-none absolute -right-14 -top-20 size-64 rounded-full bg-white/10" aria-hidden="true" />
                <span className="pointer-events-none absolute -bottom-24 right-32 size-56 rounded-full bg-white/5" aria-hidden="true" />

                <div className="relative flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{today}</p>
                    <h1 className="font-[family-name:var(--headings)] text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">
                        Good to see you, {user?.firstName}.
                    </h1>
                    <p className="max-w-xl text-sm leading-relaxed text-white/80">
                        {canTeach
                            ? `Glad you're here! You are teaching ${courses.length} ${courses.length === 1 ? 'course' : 'courses'}.`
                            : `Glad you're here! You are enrolled in ${courses.length} ${courses.length === 1 ? 'course' : 'courses'}.`}
                    </p>
                </div>

                <Link
                    className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[var(--secondary)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    to={canTeach ? '/courses/new' : '/courses'}
                >
                    {canTeach ? 'Create a course' : 'Browse courses'}
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
            </header>

            <ErrorNote error={state.error} onRetry={load} />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Overview">
                <div className="relative overflow-hidden flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
                    <span className="pointer-events-none absolute -right-4 -top-10 size-24 rounded-full bg-[var(--main)]/10" aria-hidden="true" />
                    <span className="pointer-events-none absolute -bottom-16 right-2 size-32 rounded-full bg-[var(--main)]/10" aria-hidden="true" />

                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--main)]/10 text-[var(--main)]">
                        <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 6.25C10.5 5 8.2 4.5 4.5 4.5v13c3.7 0 6 .5 7.5 1.75 1.5-1.25 3.8-1.75 7.5-1.75v-13c-3.7 0-6 .5-7.5 1.75zM12 6.25v13" /></svg>
                    </span>

                    <div className="flex flex-col">
                        <span className="font-[family-name:var(--body)] text-3xl font-bold leading-none text-[var(--secondary)]">{courses.length}</span>
                        <span className="mt-1 text-xs font-medium text-[var(--muted)]">{canTeach ? 'Courses teaching' : 'Enrolled courses'}</span>
                    </div>
                </div>
 
                <div className="relative overflow-hidden flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
                    <span className="pointer-events-none absolute -right-4 -top-10 size-24 rounded-full bg-[var(--main)]/10" aria-hidden="true" />
                    <span className="pointer-events-none absolute -bottom-16 right-2 size-32 rounded-full bg-[var(--main)]/10" aria-hidden="true" />

                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--secondary)]/10 text-[var(--secondary)]">
                        <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4.5h6M9 3h6a1 1 0 011 1v1H8V4a1 1 0 011-1zM8 5H6.5A1.5 1.5 0 005 6.5v13A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0017.5 5H16M9 12h6M9 16h4" /></svg>
                    </span>

                    <div className="flex flex-col">
                        <span className="font-[family-name:var(--body)] text-3xl font-bold leading-none text-[var(--secondary)]">{canTeach ? allItems.length : dueCount}</span>
                        <span className="mt-1 text-xs font-medium text-[var(--muted)]">{canTeach ? 'Active coursework' : 'Due soon'}</span>
                    </div>
                </div>

                <div className="relative overflow-hidden flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
                    <span className="pointer-events-none absolute -right-4 -top-10 size-24 rounded-full bg-[var(--main)]/10" aria-hidden="true" />
                    <span className="pointer-events-none absolute -bottom-16 right-2 size-32 rounded-full bg-[var(--main)]/10" aria-hidden="true" />
                    
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--warning)]/15 text-[var(--warning)]">
                        <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 12.75l2.25 2.25L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>

                    <div className="flex flex-col">
                        <span className="font-[family-name:var(--body)] text-3xl font-bold leading-none text-[var(--secondary)]">{canTeach ? awaitingGrading : completedCount}</span>
                        <span className="mt-1 text-xs font-medium text-[var(--muted)]">{canTeach ? 'Awaiting grading' : 'Completed'}</span>
                    </div>
                </div>
            </section>
            
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[3fr_2fr]">
                <section className="flex min-w-0 flex-col gap-4 bg-[var(--main)]/20 rounded-lg px-6 py-8">
                    <div className="flex items-end justify-between gap-4">
                        <h2 className="font-[family-name:var(--headings)] text-2xl font-bold tracking-[-0.02em] text-[var(--secondary)]">
                            {canTeach ? 'Your courses' : 'Enrolled courses'}
                        </h2>
                        
                        {courses.length > 0 && (
                            <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to="/courses">
                                View all →
                            </Link>
                        )}
                    </div>

                    {courses.length === 0 ? (
                        <EmptyState
                            title={canTeach ? 'No courses yet' : 'You are not enrolled in anything yet'}
                            body={
                                canTeach
                                    ? 'Create a course to start adding modules and assignments.'
                                    : 'Browse the catalogue and enroll with a course code from your instructor.'
                            }
                            action={
                                <Link className="font-semibold text-[var(--main)] hover:underline" to="/courses">
                                    {canTeach ? 'Create a course' : 'Browse courses'}
                                </Link>
                            }
                        />
                    ) : (
                        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {courses.map((c) => (
                                <li key={c._id} style={{ '--spine': spineColor(c.courseCode) }}>
                                    <Link
                                        className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--main)]/40 hover:shadow-lg"
                                        to={`/courses/${c._id}`}
                                    >
                                        <span className="absolute inset-x-0 top-0 h-1.5 bg-[var(--spine)]" aria-hidden="true" />

                                        <div className="mt-1 flex items-center justify-between gap-3">
                                            <span className="grid size-11 place-items-center rounded-xl bg-[var(--spine)] text-sm font-bold uppercase text-white shadow-sm">
                                                {(c.courseCode ?? c.title ?? '?').slice(0, 2)}
                                            </span>
                                            <span className="rounded-full bg-[var(--highlight)]/50 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-[var(--secondary)]">
                                                {c.courseCode}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <span className="font-[family-name:var(--headings)] text-lg font-semibold leading-snug text-[var(--secondary)] transition group-hover:text-[var(--main)]">
                                                {c.title}
                                            </span>
                                            {c.description && (
                                                <span className="line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">{c.description}</span>
                                            )}
                                        </div>

                                        <span className="mt-auto pt-1 text-xs font-semibold text-[var(--main)]">Open course →</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className="order-first flex min-w-0 flex-col gap-8 lg:order-none bg-[var(--main)]/20 rounded-lg px-6 py-8">
                    <section className="flex flex-col gap-4">
                        <h2 className="font-[family-name:var(--headings)] text-2xl font-bold tracking-[-0.02em] text-[var(--secondary)]">
                            {canTeach ? 'Your courseworks' : 'Due Soon'}
                        </h2>

                        {soon.length === 0 ? (
                            <EmptyState
                                title="Nothing due"
                                body={canTeach ? 'Assignments and quizzes you post will appear here.' : 'You are all caught up.'}
                            />
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {soon.map((item) => {
                                    const meta = dueMeta(item.dueDate);
                                    const courseId = typeof item.course === 'object' ? item.course?._id : item.course;
                                    const itemType = item.kind === 'quiz' ? 'quizzes' : 'assignments';
                                    const path = courseId
                                        ? `/courses/${courseId}/${itemType}/${item._id}`
                                        : `/${itemType}/${item._id}`;
                                    const pending = canTeach ? needsGrading[`${item.kind}-${item._id}`] : 0;

                                    return (
                                        <li key={`${item.kind}-${item._id}`}>
                                            <Link
                                                className="group flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm transition hover:border-[var(--main)]/50 hover:shadow-md"
                                                to={path}
                                            >
                                                <span
                                                    className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold bg-[var(--main)]/10 text-[var(--main)]"
                                                    title={item.kind === 'quiz' ? 'Quiz' : 'Assignment'}
                                                >
                                                    {item.kind === 'quiz' ? 'Q' : 'A'}
                                                </span>

                                                <div className="flex flex-col gap-2">
                                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                        <span className="truncate text-sm font-semibold text-[var(--shadow)] transition group-hover:text-[var(--main)]">{item?.title}</span>
                                                        <span className="text-xs text-[var(--muted)]">
                                                            {item.kind === 'quiz' ? 'Quiz' : 'Assignment'}
                                                        </span>
                                                    </span>

                                                    <span className={`inline-flex w-fit rounded-full bg-[var(--highlight)]/50 px-2.5 py-0.5 text-xs font-semibold text-[var(--secondary)] ${meta.className ?? ''}`}>
                                                        {meta.label}
                                                    </span>

                                                    {pending > 0 && (
                                                        <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--warning)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--warning)]">
                                                            <span className="size-1.5 rounded-full bg-[var(--warning)]" aria-hidden="true" />
                                                            {pending} learner needs to be graded
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    {!canTeach && (
                        <section className="flex flex-col gap-4">
                            <h2 className="font-[family-name:var(--headings)] text-2xl font-bold tracking-[-0.02em] text-[var(--secondary)]">
                                Completed
                            </h2>

                            {completed.length === 0 ? (
                                <EmptyState
                                    title="No completed work yet"
                                    body="Submitted assignments and quizzes will appear here."
                                />
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {completed.map((item) => {
                                        const courseId = typeof item.course === 'object' ? item.course?._id : item.course;
                                        const itemType = item.kind === 'quiz' ? 'quizzes' : 'assignments';
                                        const path = courseId
                                            ? `/courses/${courseId}/${itemType}/${item._id}`
                                            : `/${itemType}/${item._id}`;

                                        return (
                                            <li key={`completed-${item.kind}-${item._id}`}>
                                                <Link
                                                    className="group flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm transition hover:border-[var(--main)]/50 hover:shadow-md"
                                                    to={path}
                                                >
                                                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--main)]/10 text-[var(--main)]">
                                                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                    </span>

                                                    <span className="flex min-w-0 flex-1 flex-col">
                                                        <span className="truncate text-sm font-semibold text-[var(--shadow)] transition group-hover:text-[var(--main)]">{item.title}</span>
                                                        <span className="text-xs text-[var(--muted)]">
                                                            {item.kind === 'quiz' ? 'Quiz' : 'Assignment'}
                                                        </span>
                                                    </span>

                                                    {gradedIds.has(item._id) ? (
                                                        <span className="shrink-0 rounded-full bg-[var(--main)] px-2.5 py-1 text-xs font-semibold text-white">Graded</span>
                                                    ) : (
                                                        <span className="shrink-0 rounded-full bg-[var(--warning)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--warning)]">Pending grade</span>
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}