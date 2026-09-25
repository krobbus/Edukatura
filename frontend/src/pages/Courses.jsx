import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { fullName, spineColor } from '../utils';
import Loading from '../components/Loading';
import ErrorNote from '../components/ErrorNote';
import EmptyState from '../components/EmptyState';

export default function Courses() {
    const { canTeach, isAdmin } = useAuth();
    const [courses, setCourses] = useState([]);
    const [facultyUsers, setFacultyUsers] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });

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

    useEffect(() => {
        if (!isAdmin) return;

        api.get('/users')
            .then((data) => setFacultyUsers((data.users ?? data ?? []).filter((user) => user.role === 'faculty')))
            .catch((err) => setState((s) => ({ ...s, error: err })));
    }, [isAdmin]);

    return (
        <section className="courseCatalogPage">
            <header>
                <div>
                    <h1>{canTeach ? 'Your courses' : 'Course catalogue'}</h1>
                    <p>
                        {canTeach
                            ? 'Everything you teach, newest first.'
                            : 'Enroll in a course to see its modules and assignments.'}
                    </p>
                </div>

                {canTeach && (
                    <Link className="createButton" to="/courses/new">
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
                <div className="courseGrid">
                    {courses.map((c) => (
                        <CourseTile key={c._id} course={c} canTeach={canTeach} isAdmin={isAdmin} facultyUsers={facultyUsers} onChange={load} />
                    ))}
                </div>
            )}
        </section>
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
        <div className="courseCard" style={{ '--spine': spineColor(course.courseCode) }}>
            <div className="courseButtons">
                <Link
                    className="manageButton"
                    to={`/courses/${course._id}`}
                    aria-label={`Manage modules and assignments for ${course.title}`}
                    title="Manage modules and assignments"
                >
                    Manage modules &amp; assignments
                </Link>

                {canTeach && (
                    <>
                        <Link
                            className="courseEditButton"
                            to={`/courses/${course._id}/edit`}
                            aria-label={`Edit ${course.title}`}
                            title="Edit course"
                        >
                            <span aria-hidden="true">Edit</span>
                        </Link>

                        <button
                            className="courseDeleteButton"
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
            </div>

            {!canTeach && course.isEnrolled && (
                <span className="enrolledPill">Enrolled</span>
            )}

            <div className="courseCardContent">
                <span className="courseCode">{course.courseCode?.toUpperCase()}</span>
                <h2>{course.title}</h2>
                {course.faculty && typeof course.faculty === 'object' && <p>{fullName(course.faculty)}</p>}
                {course.description && <p className="textBlock">{course.description}</p>}
            </div>

            {error && <p className="error">{error.message}</p>}

            {!canTeach && !course.isEnrolled && (
                <button className="enrollButton" onClick={enroll} disabled={busy}>
                    {busy ? 'Enrolling…' : 'Enroll'}
                </button>
            )}
        </div>
    );
}