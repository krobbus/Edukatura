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
    const [state, setState] = useState({ loading: true, error: null });

    function load() {
        setState({ loading: true, error: null });
        const controller = new AbortController();
        const requests = [
            api.get('/courses', { signal: controller.signal }),
            api.get('/assignments?upcoming=true', { signal: controller.signal }),
            api.get('/quizzes?upcoming=true', { signal: controller.signal }),
        ];

        if (!canTeach) {
            requests.push(api.get('/submissions/my', { signal: controller.signal }).catch(() => []));
        }

        Promise.all(requests)
            .then(([c, a, q, s]) => {
                setCourses(c.courses ?? c ?? []);
                setAssignments(a.assignments ?? a ?? []);
                setQuizzes(q.quizzes ?? q ?? []);
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

    if (state.loading) return <Loading label="Loading your dashboard" />;

    const submittedIds = new Set(
        submissions.map((s) => {
            const aId = typeof s.assignment === 'object' ? s.assignment?._id : s.assignment;
            const qId = typeof s.quiz === 'object' ? s.quiz?._id : s.quiz;
            return aId || qId;
        }).filter(Boolean)
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

    return (
        <section className="dashboardPage">
            <header>
                <h1>Good to see you, {user?.firstName}.</h1>
                <p>
                    {canTeach
                        ? `You are teaching ${courses.length} ${courses.length === 1 ? 'course' : 'courses'}.`
                        : `You are enrolled in ${courses.length} ${courses.length === 1 ? 'course' : 'courses'}.`}
                </p>
            </header>

            <ErrorNote error={state.error} onRetry={load} />

            <main>
                <section className="dashboardSection">
                    <h2>{canTeach ? 'Your courses' : 'Enrolled courses'}</h2>

                    {courses.length === 0 ? (
                        <EmptyState
                            title={canTeach ? 'No courses yet' : 'You are not enrolled in anything yet'}
                            body={
                                canTeach
                                    ? 'Create a course to start adding modules and assignments.'
                                    : 'Browse the catalogue and enroll with a course code from your instructor.'
                            }
                            action={
                                <Link to="/courses">
                                    {canTeach ? 'Create a course' : 'Browse courses'}
                                </Link>
                            }
                        />
                    ) : (
                        <div className="dashboardCourseGrid">
                            {courses.map((c) => (
                                <Link
                                    key={c._id}
                                    className="dashboardCourseCard"
                                    to={`/courses/${c._id}`}
                                    style={{ '--spine': spineColor(c.courseCode) }}
                                >
                                    <span className="courseCode">{c.courseCode}</span>
                                    <span className="courseTitle">{c.title}</span>
                                    {c.description && <span className="courseDescription">{c.description}</span>}
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                <section className="dashboardSection">
                    <h2>Coming up</h2>

                    {soon.length === 0 ? (
                        <EmptyState
                            title="Nothing due"
                            body={canTeach ? 'Assignments and quizzes you post will appear here.' : 'You are all caught up.'}
                        />
                    ) : (
                        <ul className="dashboardAnnouncement">
                            {soon.map((item) => {
                                const meta = dueMeta(item.dueDate);
                                const courseId = typeof item.course === 'object' ? item.course?._id : item.course;
                                const itemType = item.kind === 'quiz' ? 'quizzes' : 'assignments';
                                const path = courseId
                                    ? `/courses/${courseId}/${itemType}/${item._id}`
                                    : `/${itemType}/${item._id}`;

                                return (
                                    <Link
                                        key={`${item.kind}-${item._id}`}
                                        className="dashboardAnnouncementCard"
                                        to={path}
                                    >
                                        <span className="announcementCode">{item.course?.courseCode ?? item.course?.title ?? ''}</span>
                                        <span className="announcementTitle">{item.title}</span>
                                        {item.kind === 'quiz' ? (
                                            <span className="announcementTag quiz">Quiz</span>
                                        ) : (
                                            <span className="announcementTag assignment">Assignment</span>
                                        )}
                                        <span className="announcementLabel">{meta.label}</span>
                                    </Link>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {!canTeach && (
                    <section className="dashboardSection">
                        <h2>Completed</h2>

                        {completed.length === 0 ? (
                            <EmptyState
                                title="No completed work yet"
                                body="Submitted assignments and quizzes will appear here."
                            />
                        ) : (
                            <ul className="dashboardAnnouncement">
                                {completed.map((item) => {
                                    const courseId = typeof item.course === 'object' ? item.course?._id : item.course;
                                    const itemType = item.kind === 'quiz' ? 'quizzes' : 'assignments';
                                    const path = courseId
                                        ? `/courses/${courseId}/${itemType}/${item._id}`
                                        : `/${itemType}/${item._id}`;

                                    return (
                                        <Link
                                            key={`completed-${item.kind}-${item._id}`}
                                            className="dashboardAnnouncementCard"
                                            to={path}
                                        >
                                            <span className="announcementCode">{item.course?.courseCode ?? item.course?.title ?? ''}</span>
                                            <span className="announcementTitle">{item.title}</span>
                                            {item.kind === 'quiz' ? (
                                                <span className="announcementTag quiz">Quiz</span>
                                            ) : (
                                                <span className="announcementTag assignment">Assignment</span>
                                            )}
                                            <span className="announcementLabel">Submitted</span>
                                        </Link>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                )}
            </main>
        </section>
    );
}