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
    }, [quizId, canTeach]);

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

    return (
        <div className="quizPage">
            <p className="quizBreadcrumb">
                {course && typeof course === 'object' ? (
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
                            to={`/courses/${activeCourseId}/quizzes/${quiz._id}/edit`}
                            aria-label={`Edit quiz ${quiz.title}`}
                            title="Edit quiz"
                        >
                            <span aria-hidden="true">Edit</span>
                        </Link>

                        <button
                            className="deleteButton"
                            type="button"
                            onClick={deleteQuiz}
                            aria-label={`Delete quiz ${quiz.title}`}
                            title="Delete quiz"
                        >
                            <span aria-hidden="true">Delete</span>
                        </button>
                    </div>
                )}
                
                {course?.courseCode && <span>{course.courseCode}</span>}
                <h1>{quiz.title}</h1>
                <p className={`quizDueBadge ${meta.className}`}>
                    {meta.label} · {quiz.maxPoints} points
                </p>
            </header>

            <div className="quizContentGrid">
                <section className="quizPanel quizInfoPanel">
                    <h2>Instructions</h2>
                    <p className="textBlock">{quiz.description}</p>

                    <div className="quizQuestionsHeader">
                        <h2>Questions</h2>
                        <span>{questionsCount} questions</span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <ol className="quizQuestionList">
                            {(quiz.questions ?? []).map((question, questionIndex) => (
                                <li className="quizQuestionCard" key={`${quiz._id}-${questionIndex}`}>
                                    <h3>{question.prompt}</h3>

                                    <ol className="quizChoiceList" type="A">
                                        {question.choices.map((choice, choiceIndex) => {
                                            const isSelected = answers[questionIndex] === choiceIndex;
                                            const isCorrectChoice = canTeach && choiceIndex === question.correctAnswer;
                                            
                                            let itemClass = '';
                                            if (isCorrectChoice) itemClass = 'correctChoice';
                                            if (isSelected) itemClass += ' selectedChoice active';

                                            return (
                                                <li key={`${questionIndex}-${choiceIndex}`} className={itemClass.trim()}>
                                                    {!canTeach && !submission ? (
                                                        <label className="choiceLabel">
                                                            <input
                                                                type="radio"
                                                                name={`question-${questionIndex}`}
                                                                checked={isSelected}
                                                                onChange={() => handleSelectChoice(questionIndex, choiceIndex)}
                                                            />
                                                            <span>{choice}</span>
                                                        </label>
                                                    ) : (
                                                        <>
                                                            <span>{choice}</span>
                                                            {isCorrectChoice && <strong>Correct answer</strong>}
                                                            {!canTeach && isSelected && <strong>Your answer</strong>}
                                                        </>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </li>
                            ))}
                        </ol>
                    </form>
                </section>

                {canTeach ? (
                    <section className="quizPanel quizSubmissionPanel">
                        <h2>Submissions</h2>
                        <p className="panelDescription">Review and grade what students have turned in.</p>

                        <Link className="gradingButton" to={`/courses/${activeCourseId}/quizzes/${quizId}/submissions`}>
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

    return (
        <section className="quizPanel quizSubmissionPanel">
            <h2>Your work</h2>

            <p className="quizStatusRow">
                <span className={`quizStatusDot ${submission?.status === 'submitted' ? 'submittedStatus' : submission?.status === 'graded' ? 'gradedStatus' : 'pendingStatus'}`} />
                {STATUS_LABEL[submission?.status ?? 'pending']}
                {submission?.submittedAt && ` ${formatDate(submission.submittedAt)} | awaiting grade`}
            </p>

            {graded && (
                <div className="quizGradeBlock">
                    <p className="quizGradeScore">
                        {submission.grade ?? submission.score ?? 0}
                        <span className="scoreMax"> / {quiz.maxPoints}</span>
                    </p>
                    {submission.feedback && <p className="textBlock">{submission.feedback}</p>}
                </div>
            )}

            {graded ? (
                <p>This quiz has been graded and can no longer be changed.</p>
            ) : submission?.status === 'submitted' ? (
                <p>Your score will be visible once your instructor grades this quiz.</p>
            ) : (
                <form className="quizSubmitForm" onSubmit={onSubmit}>
                    <ErrorNote error={error} />

                    <p className="quizProgress">Answered {answeredCount} of {questionsCount} questions</p>

                    {closed && (
                        <p className="quizLateNotice">The due date has passed. Your work will be marked late.</p>
                    )}

                    <button className="turnInButton" disabled={submitting || answeredCount < questionsCount}>
                        {submitting ? 'Submitting…' : 'Submit Quiz'}
                    </button>
                </form>
            )}
        </section>
    );
}