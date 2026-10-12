import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { fullName, spineColor } from '../utils';
import Loading from '../components/Loading';
import ErrorNote from '../components/ErrorNote';
import EmptyState from '../components/EmptyState';

export default function Courses() {
    const { canTeach } = useAuth();
    const [courses, setCourses] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');

    function load() {
        setState((s) => ({ ...s, loading: true, error: null }));
        api.get(canTeach ? '/courses' : '/courses?scope=all')
            .then((data) => {
                setCourses(data.courses ?? data ?? []);
                setState({ loading: false, error: null });
            })
            .catch((err) => setState({ loading: false, error: err }));
    }
    useEffect(load, [canTeach]);

    const enrolledCount = courses.filter((c) => c.isEnrolled).length;
    const needle = query.trim().toLowerCase();

    const visible = courses.filter((c) => {
        if (!canTeach && filter === 'enrolled' && !c.isEnrolled) return false;
        if (!canTeach && filter === 'available' && c.isEnrolled) return false;
        if (!needle) return true;

        const instructor = c.instructor && typeof c.instructor === 'object' ? fullName(c.instructor) : '';
        return [c.title, c.courseCode, c.description, instructor]
            .filter(Boolean)
            .some((text) => String(text).toLowerCase().includes(needle));
    });

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-12">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--main)]">
                        {canTeach ? 'Teaching' : 'Catalogue'}
                    </p>

                    <h1 className="font-[family-name:var(--headings)] text-4xl font-bold tracking-[-0.02em] text-[var(--secondary)]">
                        {canTeach ? 'Your courses' : 'Course catalogue'}
                    </h1>

                    <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                        {canTeach
                            ? 'Here are all the courses you teach, sorted by newest first!'
                            : 'Ready to dive in? Enroll in a course to explore modules and start managing your coursework.'}
                    </p>
                </div>

                {canTeach && (
                    <Link
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--main)] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(42,107,92,0.3)] transition hover:-translate-y-0.5 hover:bg-[var(--secondary)]"
                        to="/courses/new"
                    >
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                        Create a course
                    </Link>
                )}
            </header>

            <ErrorNote error={state.error} onRetry={load} />

            {state.loading ? (
                <Loading label="Loading courses" />
            ) : courses.length === 0 ? (
                <EmptyState
                    title="No courses to show"
                    body={canTeach ? 'Create your first course to get started.' : 'Nothing has been published yet.'}
                />
            ) : (
                <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1">
                            <svg className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                            <input
                                className="w-full rounded-2xl border border-[var(--line)] bg-[var(--panel)] py-2.5 pl-10 pr-4 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] transition focus:border-[var(--main)] focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(42,107,92,0.15)]"
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by title, code, or instructor"
                                aria-label="Search courses"
                            />
                        </div>

                        {!canTeach && (
                            <div className="flex gap-1 rounded-xl p-1" role="group" aria-label="Filter courses">
                                <button
                                    className="flex-1 rounded-lg px-3.5 py-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--secondary)] aria-pressed:bg-[var(--main)] aria-pressed:text-white aria-pressed:shadow-sm sm:flex-none cursor-pointer"
                                    type="button"
                                    aria-pressed={filter === 'all'}
                                    onClick={() => setFilter('all')}
                                >
                                    All ({courses.length})
                                </button>

                                <button
                                    className="flex-1 rounded-lg px-3.5 py-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--secondary)] aria-pressed:bg-[var(--main)] aria-pressed:text-white aria-pressed:shadow-sm sm:flex-none cursor-pointer"
                                    type="button"
                                    aria-pressed={filter === 'enrolled'}
                                    onClick={() => setFilter('enrolled')}
                                >
                                    Enrolled ({enrolledCount})
                                </button>

                                <button
                                    className="flex-1 rounded-lg px-3.5 py-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--secondary)] aria-pressed:bg-[var(--main)] aria-pressed:text-white aria-pressed:shadow-sm sm:flex-none cursor-pointer"
                                    type="button"
                                    aria-pressed={filter === 'available'}
                                    onClick={() => setFilter('available')}
                                >
                                    Available ({courses.length - enrolledCount})
                                </button>
                            </div>
                        )}
                    </div>

                    {visible.length === 0 ? (
                        <EmptyState
                            title="No matching courses"
                            body="Try a different search term or filter."
                        />
                    ) : (
                        <>
                            <p className="text-xs font-medium text-[var(--muted)]">
                                Showing {visible.length} of {courses.length} {courses.length === 1 ? 'course' : 'courses'}
                            </p>

                            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {visible.map((c) => (
                                    <li key={c._id} className="flex">
                                        <CourseTile course={c} canTeach={canTeach} onChange={load} />
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

function CourseTile({ course, canTeach, onChange }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    async function enroll() {
        setBusy(true);
        setError(null);
        try {
            await api.post('/enrollments', { courseId: course._id });
            onChange();
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    }

    async function removeCourse(event) {
        event.preventDefault();
        event.stopPropagation();

        if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) return;

        setBusy(true);
        setError(null);
        try {
            await api.delete(`/courses/${course._id}`);
            onChange();
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    }

    return (
        <article
            className="group flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            style={{ '--spine': spineColor(course.courseCode) }}
        >
            <div className="relative flex h-28 items-end justify-between gap-2 overflow-hidden bg-[var(--spine)] p-4">
                <span className="absolute inset-0 bg-linear-to-t from-black/35 to-transparent" aria-hidden="true" />
                <span className="absolute -right-8 -top-10 size-36 rounded-full bg-white/15" aria-hidden="true" />

                <span className="relative rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--secondary)] shadow-sm">
                    {course.courseCode?.toUpperCase()}
                </span>

                {!canTeach && course.isEnrolled && (
                    <span className="relative inline-flex items-center gap-1 rounded-full bg-[var(--main)] px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
                        Enrolled
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex flex-col gap-1.5">
                    <h2 className="font-[family-name:var(--headings)] text-xl font-semibold leading-snug text-[var(--secondary)]">
                        {course.title}
                    </h2>

                    {course.instructor && typeof course.instructor === 'object' && (
                        <p className="text-xs font-semibold text-[var(--main)]">{fullName(course.instructor)}</p>
                    )}
                    
                    {course.description && (
                        <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">{course.description}</p>
                    )}
                </div>

                {error && <p className="text-sm font-medium text-[var(--danger)]">{error.message}</p>}

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
                    <Link
                        className={`inline-flex flex-1 items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer transition ${
                            !canTeach && !course.isEnrolled
                                ? 'border border-[var(--main)] text-[var(--main)] hover:bg-[var(--main)] hover:text-white'
                                : 'bg-[var(--main)] text-white hover:bg-[var(--secondary)]'
                        }`}
                        to={`/courses/${course._id}`}
                        aria-label={`Manage modules and assignments for ${course.title}`}
                        title="Manage modules and assignments"
                    >
                        {canTeach ? 'Manage course' : 'Open course'}
                    </Link>

                    {canTeach && (
                        <>
                            <Link
                                className="inline-flex items-center rounded-lg border border-[var(--main)] px-3.5 py-2 text-xs font-semibold text-[var(--main)] transition hover:bg-[var(--main)] hover:text-white cursor-pointer"
                                to={`/courses/${course._id}/edit`}
                                aria-label={`Edit ${course.title}`}
                                title="Edit course"
                            >
                                <span aria-hidden="true">Edit</span>
                            </Link>

                            <button
                                className="inline-flex items-center rounded-lg border border-[var(--danger)] px-3.5 py-2 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                type="button"
                                onClick={removeCourse}
                                disabled={busy}
                                aria-label={`Delete ${course.title}`}
                                title="Delete course"
                            >
                                <span aria-hidden="true">Delete</span>
                            </button>
                        </>
                    )}

                    {!canTeach && !course.isEnrolled && (
                        <button
                            className="inline-flex flex-1 items-center justify-center rounded-lg bg-[var(--main)] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                            type="button"
                            onClick={enroll}
                            disabled={busy}
                        >
                            {busy ? 'Enrolling…' : 'Enroll'}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}