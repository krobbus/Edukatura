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

    const [course, setCourse] = useState(null);
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
        api.get(`/courses/${courseId}`)
            .then((data) => setCourse(data.course ?? data))
            .catch(() => null);

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
            const payload = {
                course: courseId,
                title: form.title,
                description: form.description,
                dueDate: new Date(form.dueDate).toISOString(),
                maxPoints: Number(form.maxPoints),
                module: form.module || null,
                questions: form.questions,
            };

            if (isEditing) {
                await api.put(`/quizzes/${quizId}`, payload);
            } else {
                await api.post('/quizzes', payload);
            }

            navigate(`/courses/${courseId}`);
        } catch (submitError) {
            setError(submitError);
        } finally {
            setBusy(false);
        }
    }

    const meta = form.dueDate ? dueMeta(form.dueDate) : { label: 'No due date', className: '' };

    if (loadingData) return <Loading label="Loading quiz details..." />;

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-5 py-8">
            <p>
                <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to={`/courses/${courseId}`}>
                    ⟵ {course?.courseCode ? `${course.courseCode} · ${course.title}` : 'Back to course'}
                </Link>
            </p>

            {isEditing &&
                <div className="rounded-xl border border-[var(--line)] border-l-4 border-l-[var(--secondary)] bg-[var(--panel)] p-5 shadow-sm">
                    <div className="flex flex-col gap-2">
                        <strong className="text-xs font-bold uppercase tracking-widest text-[var(--secondary)]">Saved details</strong>

                        <div className="flex flex-col gap-1.5">
                            <h2 className="font-[family-name:var(--headings)] text-xl font-semibold text-[var(--secondary)]">{form.title || 'Quiz Title'}</h2>

                            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[var(--muted)]">
                                <span className={meta.className}>{meta.label}</span>
                                <span>Questions: {form.questions.length} · Max points: {form.maxPoints}</span>
                            </div>
                        </div>

                        {form.description && <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--shadow)]">{form.description}</p>}
                    </div>
                </div>
            }
            <form className="flex flex-col gap-5 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm" onSubmit={submit}>
                <h2 className="font-[family-name:var(--headings)] text-2xl font-semibold text-[var(--secondary)]">{isEditing ? 'Edit quiz' : 'New quiz'}</h2>
                <ErrorNote error={error} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="q-title">Title <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input
                            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="q-title" name="title" placeholder="Quiz title" maxLength={100} value={form.title} onChange={change} required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="q-module">Module</label>
                        <select
                            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="q-module" name="module" value={form.module} onChange={change}
                        >
                            <option value="">No module</option>
                            {modules.map((module) => <option key={module._id} value={module._id}>{module.title}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="q-desc">Instructions <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <textarea
                            className="w-full resize-y rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="q-desc" name="description" placeholder="Explain what learners need to do" rows={5} value={form.description} onChange={change} required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="q-due">Due date <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input
                            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="q-due" name="dueDate" type="datetime-local" min={toInputDateTime(Date.now())} value={form.dueDate} onChange={change} required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="q-points">Max points</label>
                        <input
                            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="q-points" name="maxPoints" type="number" min={1} value={form.maxPoints} onChange={change}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {form.questions.map((question, questionIndex) => (
                        <fieldset className="flex flex-col gap-4 rounded-xl border border-[var(--line)] p-5" key={questionIndex}>
                            <legend className="px-2 text-sm font-bold text-[var(--main)]">Question {questionIndex + 1}</legend>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor={`q-${questionIndex}-prompt`}>Question <span className="requiredMarker" aria-hidden="true">*</span></label>
                                    <button
                                        className="self-end rounded-lg border border-[var(--danger)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                        type="button"
                                        onClick={() => removeQuestion(questionIndex)}
                                        disabled={form.questions.length <= 1}
                                    >
                                        Remove question
                                    </button>
                                </div>

                                <textarea
                                    className="w-full resize-y rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                                    id={`q-${questionIndex}-prompt`}
                                    value={question.prompt}
                                    onChange={(event) => changeQuestion(questionIndex, 'prompt', event.target.value)}
                                    placeholder="Write the question"
                                    rows={3}
                                    maxLength={500}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-[var(--secondary)]">Choices</span>
                                    <button
                                        type="button"
                                        className="rounded-md border border-[var(--line)] bg-[var(--main)] px-3 py-1.5 text-xs font-semibold text-[var(--panel)] transition hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                        onClick={() => addChoice(questionIndex)}
                                        disabled={question.choices.length >= 4}
                                    >
                                        Add choice
                                    </button>
                                </div>

                                {question.choices.map((choice, choiceIndex) => (
                                    <div className="flex items-end gap-3" key={choiceIndex}>
                                        <div className="flex flex-1 flex-col gap-1.5">
                                            <label className="text-sm font-medium text-[var(--muted)]" htmlFor={`q-${questionIndex}-choice-${choiceIndex}`}>Choice {choiceIndex + 1}</label>
                                            <input
                                                className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                                                id={`q-${questionIndex}-choice-${choiceIndex}`}
                                                value={choice}
                                                onChange={(event) => changeChoice(questionIndex, choiceIndex, event.target.value)}
                                                maxLength={250}
                                                required
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className="rounded-md border border-[var(--danger)] bg-white px-3 py-2.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                            onClick={() => removeChoice(questionIndex, choiceIndex)}
                                            disabled={question.choices.length <= 2}
                                            aria-label={`Remove choice ${choiceIndex + 1}`}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor={`q-${questionIndex}-answer`}>Correct answer <span className="requiredMarker" aria-hidden="true">*</span></label>
                                <select
                                    className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                                    id={`q-${questionIndex}-answer`}
                                    value={question.correctAnswer}
                                    onChange={(event) => changeQuestion(questionIndex, 'correctAnswer', event.target.value)}
                                >
                                    {question.choices.map((_, choiceIndex) => <option key={choiceIndex} value={choiceIndex}>Choice {choiceIndex + 1}</option>)}
                                </select>
                            </div>
                        </fieldset>
                    ))}

                    <button
                        className="w-full rounded-lg border-2 border-dashed border-[var(--main)] px-4 py-2.5 text-sm font-semibold text-[var(--main)] transition hover:bg-[var(--main)]/10 cursor-pointer"
                        type="button"
                        onClick={addQuestion}
                    >
                        Add question
                    </button>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        className="inline-flex items-center justify-center rounded-lg bg-[var(--main)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        disabled={busy}
                    >
                        {busy ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save changes' : 'Create quiz')}
                    </button>

                    <button
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--secondary)] transition hover:bg-[var(--highlight)] cursor-pointer"
                        type="button"
                        onClick={() => navigate(`/courses/${courseId}`)}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </section>
    );
}