import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { dueMeta, formatDate, fullName, spineColor } from '../utils';
import Loading from '../components/Loading';
import ErrorNote from '../components/ErrorNote';
import EmptyState from '../components/EmptyState';

export default function CourseDetail() {
    const { courseId } = useParams();
    const { canTeach } = useAuth();

    const navigate = useNavigate();

    const [tab, setTab] = useState('work');
    const [roster, setRoster] = useState([]);
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });

    const load = useCallback(() => {
        setState({ loading: true, error: null });
        const calls = [
            api.get(`/courses/${courseId}`),
            api.get(`/modules?course=${courseId}`),
            api.get(`/assignments?course=${courseId}`),
            api.get(`/quizzes?course=${courseId}`),
        ];
        if (canTeach) calls.push(api.get(`/enrollments?course=${courseId}`));

        Promise.all(calls)
            .then(([courseResponse, moduleResponse, assignmentResponse, quizResponse, enrollmentResponse]) => {
                setCourse(courseResponse.course ?? courseResponse);
                setModules(moduleResponse.modules ?? moduleResponse ?? []);
                setAssignments(assignmentResponse.assignments ?? assignmentResponse ?? []);
                setQuizzes(quizResponse.quizzes ?? quizResponse ?? []);
                setRoster(enrollmentResponse ? enrollmentResponse.enrollments ?? enrollmentResponse ?? [] : []);
                setState({ loading: false, error: null });
            })
            .catch((error) => setState({ loading: false, error }));
    }, [courseId, canTeach]);

    useEffect(load, [load]);

    if (state.loading) return <Loading label="Loading course" />;
    if (state.error) return <ErrorNote error={state.error} onRetry={load} />;
    if (!course) return null;

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
        <section className="courseDetailPage">
            <p className="courseBreadcrumb">
                <Link to="/courses">⟵ All courses</Link>
            </p>

            <header style={{ '--spine': spineColor(course.courseCode) }}>
                {canTeach && (
                    <div className="courseButtons">
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
                            onClick={deleteCourse}
                            aria-label="Delete course"
                            title="Delete course"
                        >
                            <span aria-hidden="true">Delete</span>
                        </button>
                    </div>
                )}

                <span className="courseCode">{course.courseCode}</span>
                <h1>{course.title}</h1>
                {course.faculty && typeof course.faculty === 'object' && <p>Taught by {fullName(course.faculty)}</p>}
                {course.description && <p>{course.description}</p>}
            </header>

            <div className="tabList" role="tablist">
                <button role="tab" aria-selected={tab === 'work'} onClick={() => setTab('work')}>
                    Coursework
                </button>

                {canTeach && (
                    <button role="tab" aria-selected={tab === 'users'} onClick={() => setTab('users')}>
                        Students ({roster.length})
                    </button>
                )}
            </div>

            {tab === 'users' ? <Roster roster={roster} /> : (
                <>
                    {canTeach && (
                        <div className="linkActions">
                            <Link to={`/courses/${courseId}/modules/new`}>
                                Add module
                            </Link>

                            <Link to={`/courses/${courseId}/assignments/new`}>
                                Post assignment
                            </Link>

                            <Link to={`/courses/${courseId}/quizzes/new`}>
                                Create quiz
                            </Link>
                        </div>
                    )}

                    {modules.length === 0 && assignments.length === 0 && quizzes.length === 0 ? (
                        <EmptyState
                            title="No coursework yet"
                            body={canTeach ? 'Add a module to group your material, then post assignments into it.' : 'Your instructor has not posted anything here yet.'}
                        />
                    ) : (
                        <div className="courseworkList">
                            {modules.map((module) => (
                                <ModuleBlock
                                    key={module._id}
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
                    )}
                </>
            )}
        </section>
    );
}

function Roster({ roster }) {
    if (roster.length === 0) return <EmptyState title="No students enrolled" body="Share the course code so students can enrol." />;
    return (
        <div className="studentsDataContainer">
            <table className="dataTable">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Enrolled</th>
                    </tr>
                </thead>
                <tbody>
                    {roster.map((enrollment) => (
                        <tr key={enrollment._id}>
                            <td>{fullName(enrollment.student)}</td>
                            <td>{enrollment.student?.email}</td>
                            <td>{formatDate(enrollment.enrolledAt, false)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ModuleBlock({
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
        <section className="moduleBlockContainer">
            <div className="moduleBlockHeading">
                <div>
                    <h2>{module.title}</h2>
                    <span className="assignmentCount">Assignments ({assignments.length}) · Quizzes ({quizzes.length})</span>
                </div>

                {canTeach && module._id && (
                    <div className="moduleBlockActions">
                        <Link
                            className="editButton"
                            to={`/courses/${courseId}/modules/${module._id}/edit`}
                            aria-label={`Edit module ${module.title}`}
                            title="Edit module"
                        >
                            <span aria-hidden="true">Edit</span>
                        </Link>

                        <button
                            className="deleteButton"
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

            {module.description && <p className="moduleBlockDescription">{module.description}</p>}

            {(assignments.length > 0 || quizzes.length > 0) && (
                <ul>
                    {assignments.map((assignment) => {
                        const meta = dueMeta(assignment.dueDate);

                        return (
                            <li key={assignment._id} className="courseworkListItem assignmentBlock">
                                <Link className="courseworkLink" to={`/courses/${courseId}/assignments/${assignment._id}`}>
                                    <span className='assignmentTitle'><strong className="assignmentLabel">Assignment</strong> {assignment.title}</span>
                                    <span className={`dueDate ${meta.className}`}>{meta.label}</span>
                                </Link>

                                {canTeach && (
                                    <div className="courseworkActions">
                                        <Link
                                            className="editButton"
                                            to={`/courses/${courseId}/assignments/${assignment._id}/edit`}
                                            aria-label={`Edit assignment ${assignment.title}`}
                                            title="Edit assignment"
                                        >
                                            <span aria-hidden="true">Edit</span>
                                        </Link>

                                        <button
                                            className="deleteButton"
                                            type="button"
                                            onClick={() => onDeleteAssignment(assignment._id, assignment.title)}
                                            aria-label={`Delete assignment ${assignment.title}`}
                                            title="Delete assignment"
                                        >
                                            <span aria-hidden="true">Delete</span>
                                        </button>
                                    </div>
                                )}
                            </li>
                        );
                    })}

                    {quizzes.map((quiz) => {
                        const meta = dueMeta(quiz.dueDate);
                        return (
                            <li key={quiz._id} className="courseworkListItem quizBlock">
                                <Link className="courseworkLink" to={`/courses/${courseId}/quizzes/${quiz._id}`}>
                                    <span className='quizTitle'><strong className="quizLabel">Quiz</strong> {quiz.title}</span>
                                    <span className={`dueDate ${meta.className}`}>{meta.label}</span>
                                </Link>

                                {canTeach && (
                                    <div className="courseworkActions">
                                        <Link
                                            className="editButton"
                                            to={`/courses/${courseId}/quizzes/${quiz._id}/edit`}
                                            aria-label={`Edit quiz ${quiz.title}`}
                                            title="Edit quiz"
                                        >
                                            <span aria-hidden="true">Edit</span>
                                        </Link>
                                        
                                        <button
                                            className="deleteButton"
                                            type="button"
                                            onClick={() => onDeleteQuiz(quiz._id, quiz.title)}
                                            aria-label={`Delete quiz ${quiz.title}`}
                                            title="Delete quiz"
                                        >
                                            <span aria-hidden="true">Delete</span>
                                        </button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}