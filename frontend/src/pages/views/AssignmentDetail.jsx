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
    }, [assignmentId, canTeach]);

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
        <div className="assignmentPage">
            <p className="assignmentBreadcrumb">
                {course ? (
                    <Link to={`/courses/${course._id}`}>
                        ⟵ {course.courseCode} · {course.title}
                    </Link>
                ) : (
                    <Link to="/courses">⟵ All courses</Link>
                )}
            </p>

            <header>
                {canTeach && (
                    <div className="courseworkActions">
                        <Link
                            className="editButton"
                            to={`/courses/${activeCourseId}/assignments/${assignment._id}/edit`}
                            aria-label={`Edit assignment ${assignment.title}`}
                            title="Edit assignment"
                        >
                            <span aria-hidden="true">Edit</span>
                        </Link>

                        <button
                            className="deleteButton"
                            type="button"
                            onClick={deleteAssignment}
                            aria-label={`Delete assignment ${assignment.title}`}
                            title="Delete assignment"
                        >
                            <span aria-hidden="true">Delete</span>
                        </button>
                    </div>
                )}
                
                {course?.courseCode && <span>{course.courseCode}</span>}
                <h1>{assignment.title}</h1>
                <p className={`assignmentDueBadge ${meta.className}`}>
                    {meta.label} · {assignment.maxPoints} points
                </p>
            </header>

            <div className="assignmentContentGrid">
                <section className="assignmentPanel assignmentInfoPanel">
                    <h2>Instructions</h2>
                    <p className="textBlock">{assignment.description}</p>
                </section>

                {canTeach ? (
                    <section className="assignmentPanel assignmentSubmissionPanel">
                        <h2>Submissions</h2>
                        <p className="panelDescription">Review and grade what students have turned in.</p>

                        <Link className='gradingButton' to={`/courses/${activeCourseId}/assignments/${assignmentId}/submissions`}>
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
        <section className="assignmentPanel assignmentSubmissionPanel">
            <h2>Your work</h2>

            <p className="assignmentStatusRow">
                <span className={`assignmentStatusDot ${submission?.status === 'submitted' ? 'submittedStatus' : submission?.status === 'graded' ? 'gradedStatus' : 'pendingStatus'}`} />
                {STATUS_LABEL[submission?.status ?? 'pending']}
                {submission?.submittedAt && (
                    submission?.status === 'graded' 
                        ? ` ${formatDate(submission.submittedAt)}` 
                        : ` ${formatDate(submission.submittedAt)} | awaiting grade`
                )}
            </p>

            {graded && (
                <div className="assignmentGradeBlock">
                    <p className="assignmentGradeScore">
                        {submission.grade}
                        <span className="scoreMax"> / {assignment.maxPoints}</span>
                    </p>
                    {submission.feedback && <p className="textBlock">{submission.feedback}</p>}
                </div>
            )}

            {graded ? (
                <p>This assignment has been graded and can no longer be changed.</p>
            ) : submission?.status === 'submitted' ? (
                <p>Your score will be visible once your instructor grades this quiz.</p>
            ) : (
                <form className="assignmentSubmitForm" onSubmit={submit}>
                    <ErrorNote error={error} />

                    <div className="formGrid">
                        <div className="formField span">
                            <label htmlFor="s-text">Answer <span className="requiredMarker" aria-hidden="true">*</span></label>
                            <textarea
                                placeholder="Write your answer here"
                                id="s-text"
                                rows={7}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                        </div>

                        <div className="formField span">
                            <label htmlFor="s-file">Link to a file <span className="supportingText">(optional)</span></label>
                            <input
                                id="s-file"
                                type="url"
                                placeholder="https://"
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    {closed && (
                        <p className="assignmentLateNotice">The due date has passed. Your work will be marked late.</p>
                    )}

                    <button className="turnInButton" disabled={busy || (!text.trim() && !fileUrl)}>
                        {busy ? 'Turning in…' :  'Turn in'}
                    </button>
                </form>
            )}
        </section>
    );
}