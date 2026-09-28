import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { dueMeta, formatDate, fullName } from '../utils';
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

                const student = typeof updated.student === 'object' && updated.student ? updated.student : s.student;
                return { ...s, ...updated, student };
            })
        );
    }

    return (
        <div className="gradingPage">
            <p className="gradingBreadcrumb">
                <Link to={`/courses/${activeCourseId}/${courseworkType}/${itemId}`}>
                    ⟵ {item.title}
                </Link>
            </p>

            <header>
                {canTeach && (
                    <div className="courseworkActions">
                        <Link
                            className="editButton"
                            to={`/courses/${activeCourseId}/${courseworkType}/${itemId}/edit`}
                            aria-label={`Edit ${isQuiz ? 'quiz' : 'assignment'} ${item.title}`}
                            title={`Edit ${isQuiz ? 'quiz' : 'assignment'}`}
                        >
                            <span aria-hidden="true">Edit</span>
                        </Link>

                        <button
                            className="deleteButton"
                            type="button"
                            onClick={deleteItem}
                            aria-label={`Delete ${isQuiz ? 'quiz' : 'assignment'} ${item.title}`}
                            title={`Delete ${isQuiz ? 'quiz' : 'assignment'}`}
                        >
                            <span aria-hidden="true">Delete</span>
                        </button>
                    </div>
                )}
                
                {course?.courseCode && <span>{course.courseCode}</span>}
                <h1>{item.title}</h1>
                <p className={`assignmentDueBadge ${meta.className}`}>
                    {meta.label} · {item.maxPoints} points
                </p>
            </header>

            {turnedIn.length === 0 ? (
                <EmptyState title="Nothing turned in yet" body="Submissions appear here as students turn work in." />
            ) : (
                <div className="gradingLayout">
                    <ul className="submissionList">
                        {turnedIn.map((s) => (
                            <li key={s._id}>
                                <button
                                    type="button"
                                    className={`submissionPicker${s._id === selectedId ? ' active' : ''}`}
                                    onClick={() => setSelectedId(s._id)}
                                    aria-current={s._id === selectedId}
                                >
                                    <span className="submissionPickerName">{fullName(s.student)}</span>
                                    <span className="submissionPickerMeta">
                                        <span className={`submissionStatusDot ${s.status === 'submitted' ? 'submittedStatus' : 'gradedStatus'}`} />
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
                        <EmptyState title="Pick a student" body="Choose a submission from the list to review it." />
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
            const studentAns = Array.isArray(parsedAnswers)
                ? parsedAnswers[idx]
                : parsedAnswers[idx] ?? parsedAnswers[q._id];

            const correctText = q.choices?.[Number(q.correctAnswer)];
            if (
                studentAns != null &&
                (String(studentAns) === String(q.correctAnswer) ||
                    String(studentAns) === String(correctText))
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
        <section className="gradingPanel">
            <h2>{fullName(submission.student)}</h2>
            <p className="gradingMeta">Turned in {formatDate(submission.submittedAt)}</p>

            {item?.description && (
                <div className="gradingInstructionText">
                    <h3>Instructions</h3>
                    <p className="textBlock">{item.description}</p>
                </div>
            )}

            {submission.submissionText ? (
                <span className="gradingSubmissionText">
                    <h3>Answer</h3>
                    {submission.submissionText}
                </span>
            ) : (
                !isQuiz && <p className="gradingEmptyMessage">No written answer.</p>
            )}

            {submission.fileUrl && (
                <p className="gradingAttachmentLink">
                    <a href={submission.fileUrl} target="_blank" rel="noreferrer">
                        Open attached file
                    </a>
                </p>
            )}

            {isQuiz && item?.questions && (
                <div className="quizGradingReview">
                    <h3>Quiz Responses</h3>
                    <button className="calculateButton" type='button' onClick={handleAutoGradeQuiz}>
                        Auto-calculate Grade
                    </button>

                    <ol className="quizQuestionList">
                        {item.questions.map((q, qIdx) => {
                            const studentAns = Array.isArray(submission.answers) ? submission.answers[qIdx] : submission.answers?.[qIdx];
                            return (
                                <li key={qIdx} className="quizQuestionCard">
                                    <h3>{q.prompt}</h3>

                                    <ul className="quizChoiceList">
                                        {q.choices.map((choice, cIdx) => (
                                            <li key={cIdx}>
                                                {choice}
                                                {q.correctAnswer === cIdx && <strong> ✓ Correct</strong>}
                                                {studentAns === cIdx && <strong> (Student Answer)</strong>}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}

            <form onSubmit={submit}>
                <ErrorNote error={error} />

                <div className="formGrid">
                    <div className="formField span">
                        <label htmlFor="grade">
                            Grade <span className="requiredMarker" aria-hidden="true" hidden={isReadOnlyGrade}>*</span>
                        </label>
                        <div className="gradeInputGroup">
                            <input
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
                            <span className="gradeUnit">/ {maxPoints}</span>
                        </div>
                    </div>

                    <div className="formField span">
                        <label htmlFor="feedback">Feedback</label>
                        <textarea
                            id="feedback"
                            placeholder="Add feedback for the student"
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

                <div className="gradingActions">
                    <button className="saveButton" disabled={busy}>
                        {busy ? 'Saving…' : submission.status === 'graded' ? 'Update grade' : 'Save grade'}
                    </button>
                    {saved && <span className="saveStatus">Grade saved.</span>}
                </div>
            </form>
        </section>
    );
}