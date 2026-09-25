import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../api/client';
import { capitalizeFirstLetter, dueMeta, toInputDateTime } from '../../utils';
import ErrorNote from '../../components/ErrorNote';
import Loading from '../../components/Loading';

export default function QuizForm() {
    const navigate = useNavigate();
    const { courseId, quizId } = useParams();
    const isEditing = Boolean(quizId);

    const createQuestion = () => ({ prompt: '', choices: ['', ''], correctAnswer: 0 });

    const [modules, setModules] = useState([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        maxPoints: 100,
        module: '',
        questions: [createQuestion()],
    });

    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        api.get(`/modules?course=${courseId}`)
            .then((data) => setModules(data.modules ?? data ?? []))
            .catch((err) => setError(err));
    }, [courseId]);

    useEffect(() => {
        if (!isEditing) {
            setLoadingData(false);
            return;
        }

        api.get(`/quizzes/${quizId}`)
            .then((data) => {
                const quiz = data.quiz ?? data;
                setForm({
                    title: quiz.title ?? '',
                    description: quiz.description ?? '',
                    dueDate: toInputDateTime(quiz.dueDate),
                    maxPoints: quiz.maxPoints ?? 100,
                    module: quiz.module?._id ?? quiz.module ?? '',
                    questions: quiz.questions?.length ? quiz.questions : [createQuestion()],
                });
            })
            .catch((err) => setError(err))
            .finally(() => setLoadingData(false));
    }, [quizId, isEditing]);

    function change(e) {
        const { name, value } = e.target;
        setForm((current) => ({
            ...current,
            [name]: name === 'title' || name === 'description' ? capitalizeFirstLetter(value) : value,
        }));
    }

    function changeQuestion(questionIndex, field, value) {
        setForm((current) => ({
            ...current,
            questions: current.questions.map((question, index) => (
                index === questionIndex
                    ? { ...question, [field]: field === 'prompt' ? capitalizeFirstLetter(value) : Number(value) }
                    : question
            )),
        }));
    }

    function changeChoice(questionIndex, choiceIndex, value) {
        setForm((current) => ({
            ...current,
            questions: current.questions.map((question, index) => {
                if (index !== questionIndex) return question;
                const choices = question.choices.map((choice, currentIndex) => currentIndex === choiceIndex ? capitalizeFirstLetter(value) : choice);
                return { ...question, choices };
            }),
        }));
    }

    function addChoice(questionIndex) {
        setForm((current) => ({
            ...current,
            questions: current.questions.map((question, index) => (
                index === questionIndex && question.choices.length < 4
                    ? { ...question, choices: [...question.choices, ''] }
                    : question
            )),
        }));
    }

    function removeChoice(questionIndex, choiceIndex) {
        setForm((current) => ({
            ...current,
            questions: current.questions.map((question, index) => {
                if (index !== questionIndex || question.choices.length <= 2) return question;
                const choices = question.choices.filter((_, currentIndex) => currentIndex !== choiceIndex);
                return {
                    ...question,
                    choices,
                    correctAnswer: Math.min(question.correctAnswer, choices.length - 1),
                };
            }),
        }));
    }

    function addQuestion() {
        setForm((current) => ({ ...current, questions: [...current.questions, createQuestion()] }));
    }

    function removeQuestion(questionIndex) {
        setForm((current) => ({
            ...current,
            questions: current.questions.length > 1
                ? current.questions.filter((_, index) => index !== questionIndex)
                : current.questions,
        }));
    }

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const data = await api.post('/quizzes', {
                course: courseId,
                title: form.title,
                description: form.description,
                dueDate: new Date(form.dueDate).toISOString(),
                maxPoints: Number(form.maxPoints),
                module: form.module || null,
                questions: form.questions,
            });
            onCreated(data.quiz ?? data);
            setForm({ title: '', description: '', dueDate: '', maxPoints: 100, module: '', questions: [createQuestion()] });
            onToggle();
        } catch (submitError) {
            setError(submitError);
        } finally {
            setBusy(false);
        }
    }

    const meta = form.dueDate ? dueMeta(form.dueDate) : { label: 'No due date', className: '' };

    if (loadingData) return <Loading label="Loading quiz details..." />;

    return (
        <section className="quizFormPage">
            <p className="quizBreadcrumb">
                <Link to={`/courses/${courseId}`}>⟵ View modules</Link>
            </p>

            {isEditing &&
                <div className="quizCard">
                    <div className="quizCardContent">
                        <strong className="quizLabel">Saved details</strong>

                        <div className="quizHeading">
                            <h2>{form.title || 'Quiz Title'}</h2>

                            <div className="quizSubheading">
                                <span className={`dueDate ${meta.className}`}>{meta.label}</span>
                                <span>Questions: {form.questions.length} · Max points: {form.maxPoints}</span>
                            </div>
                        </div>

                        {form.description && <p>{form.description}</p>}
                    </div>
                </div>
            }
            <form className="quizForm" onSubmit={submit}>
                <h2>{isEditing ? 'Edit quiz' : 'New quiz'}</h2>
                <ErrorNote error={error} />

                <div className="formGrid">
                    <div className="formField">
                        <label htmlFor="q-title">Title <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input id="q-title" name="title" placeholder="Quiz title" maxLength={100} value={form.title} onChange={change} required />
                    </div>

                    <div className="formField">
                        <label htmlFor="q-module">Module</label>
                        <select id="q-module" name="module" value={form.module} onChange={change}>
                            <option value="">No module</option>
                            {modules.map((module) => <option key={module._id} value={module._id}>{module.title}</option>)}
                        </select>
                    </div>

                    <div className="formField span">
                        <label htmlFor="q-desc">Instructions <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <textarea id="q-desc" name="description" placeholder="Explain what students need to do" rows={5} value={form.description} onChange={change} required />
                    </div>

                    <div className="formField">
                        <label htmlFor="q-due">Due date <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input id="q-due" name="dueDate" type="datetime-local" min={toInputDateTime(Date.now())} value={form.dueDate} onChange={change} required />
                    </div>

                    <div className="formField">
                        <label htmlFor="q-points">Max points</label>
                        <input id="q-points" name="maxPoints" type="number" min={1} value={form.maxPoints} onChange={change} />
                    </div>
                </div>

                <div className="quizQuestions">
                    {form.questions.map((question, questionIndex) => (
                        <fieldset className="quizQuestion" key={questionIndex}>
                            <legend>Question {questionIndex + 1}</legend>

                            <div className="formField quizPromptField">
                                <label htmlFor={`q-${questionIndex}-prompt`}>Question <span className="requiredMarker" aria-hidden="true">*</span></label>
                                <textarea
                                    id={`q-${questionIndex}-prompt`}
                                    value={question.prompt}
                                    onChange={(event) => changeQuestion(questionIndex, 'prompt', event.target.value)}
                                    placeholder="Write the question"
                                    rows={3}
                                    maxLength={500}
                                    required
                                />
                            </div>

                            <div className="quizChoices">
                                <div className="quizSectionHeading">
                                    <span>Choices</span>
                                    <button type="button" className="inlineButton" onClick={() => addChoice(questionIndex)} disabled={question.choices.length >= 4}>
                                        Add choice
                                    </button>
                                </div>

                                {question.choices.map((choice, choiceIndex) => (
                                    <div className="quizChoiceRow" key={choiceIndex}>
                                        <div className="formField">
                                            <label htmlFor={`q-${questionIndex}-choice-${choiceIndex}`}>Choice {choiceIndex + 1}</label>
                                            <input
                                                id={`q-${questionIndex}-choice-${choiceIndex}`}
                                                value={choice}
                                                onChange={(event) => changeChoice(questionIndex, choiceIndex, event.target.value)}
                                                maxLength={250}
                                                required
                                            />
                                        </div>
                                        <button type="button" className="inlineButton quizRemoveChoice" onClick={() => removeChoice(questionIndex, choiceIndex)} disabled={question.choices.length <= 2} aria-label={`Remove choice ${choiceIndex + 1}`}>
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="formField">
                                <label htmlFor={`q-${questionIndex}-answer`}>Correct answer</label>
                                <select
                                    id={`q-${questionIndex}-answer`}
                                    value={question.correctAnswer}
                                    onChange={(event) => changeQuestion(questionIndex, 'correctAnswer', event.target.value)}
                                >
                                    {question.choices.map((_, choiceIndex) => <option key={choiceIndex} value={choiceIndex}>Choice {choiceIndex + 1}</option>)}
                                </select>
                            </div>

                            <button className="removeButton" type="button" onClick={() => removeQuestion(questionIndex)} disabled={form.questions.length <= 1}>
                                Remove question
                            </button>
                        </fieldset>
                    ))}

                    <button className="addButton" type="button" onClick={addQuestion}>
                        Add question
                    </button>
                </div>

                <div className="formActions">
                    <button className="submitButton" disabled={busy}>{busy ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save changes' : 'Create quiz')}</button>
                    <button className="cancelButton" type="button" onClick={() => navigate(`/courses/${courseId}`)}>Cancel</button>
                </div>
            </form>
        </section>
    );
}