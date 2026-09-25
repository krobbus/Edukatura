import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../api/client';
import { capitalizeFirstLetter } from '../../utils';
import ErrorNote from '../../components/ErrorNote';
import Loading from '../../components/Loading';

export default function ModuleForm() {
    const navigate = useNavigate();
    const { courseId, moduleId } = useParams();
    const isEditing = Boolean(moduleId);

    const [form, setForm] = useState({ title: '', description: '' });
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [loadingData, setLoadingData] = useState(isEditing);

    useEffect(() => {
        if (!isEditing) return;

        const fetchModule = api.get(`/modules/${moduleId}`).catch(() => 
            api.get(`/modules?course=${courseId}`).then((res) => {
                const list = res.modules ?? res ?? [];
                const found = list.find((m) => m._id === moduleId);
                if (!found) throw new Error('Module not found');
                return found;
            })
        );
        const fetchAssignments = api.get(`/assignments?course=${courseId}`).catch(() => []);
        const fetchQuizzes = api.get(`/quizzes?course=${courseId}`).catch(() => []);

        Promise.all([fetchModule, fetchAssignments, fetchQuizzes])
            .then(([moduleData, assignmentData, quizData]) => {
                const module = moduleData.module ?? moduleData;
                setForm({
                    title: module.title ?? '',
                    description: module.description ?? '',
                });

                const allAssignments = assignmentData.assignments ?? assignmentData ?? [];
                const allQuizzes = quizData.quizzes ?? quizData ?? [];

                setAssignments(allAssignments.filter((a) => (a.module?._id ?? a.module) === moduleId));
                setQuizzes(allQuizzes.filter((q) => (q.module?._id ?? q.module) === moduleId));
            })
            .catch((err) => setError(err))
            .finally(() => setLoadingData(false));
    }, [courseId, moduleId, isEditing]);

    function change(e) {
        const { name, value } = e.target;
        setForm((f) => ({
            ...f,
            [name]: name === 'title' || name === 'description' ? capitalizeFirstLetter(value) : value,
        }));
    }

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const data = await api.post('/modules', { ...form, course: courseId });
            onCreated(data.module ?? data);
            setForm({ title: '', description: '' });
            onToggle();
        } catch (submitError) {
            setError(submitError);
        } finally {
            setBusy(false);
        }
    }

    if (loadingData) return <Loading label="Loading module details..." />;

    return (
        <section className="moduleFormPage">
            <p className="moduleBreadcrumb">
                <Link to={`/courses/${courseId}`}>⟵ View modules</Link>
            </p>
            
            {isEditing &&
                <div className="moduleCard">
                    <div className="moduleCardContent">
                        <div className="moduleHeading">
                            <h2>{form.title || 'Module Title'}</h2>
                            <span className="assignmentCount">Assignments ({assignments.length}) · Quizzes ({quizzes.length})</span>
                        </div>
                        {form.description && <p className="moduleDescription">{form.description}</p>}
                    </div>
                </div>
            }

            <form className="moduleForm" onSubmit={submit}>
                <h2>{isEditing ? 'Edit module' : 'New module'}</h2>
                <ErrorNote error={error} />

                <div className="formGrid">
                    <div className="formField span">
                        <label htmlFor="m-title">Title <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input
                            id="m-title"
                            name="title"
                            placeholder="Module title"
                            maxLength={100}
                            value={form.title}
                            onChange={change}
                            required
                        />
                    </div>

                    <div className="formField span">
                        <label htmlFor="m-desc">Description</label>
                        <textarea
                            id="m-desc"
                            name="description"
                            placeholder="Describe this module"
                            rows={3}
                            value={form.description}
                            onChange={change}
                        />
                    </div>
                </div>

                <div className="formActions">
                    <button className="submitButton" disabled={busy}>
                        {busy ? (isEditing ? 'Saving…' : 'Adding…') : (isEditing ? 'Save changes' : 'Add module')}
                    </button>

                    <button className="cancelButton" type="button" onClick={() => navigate(`/courses/${courseId}`)}>
                        Cancel
                    </button>
                </div>
            </form>
        </section>
    );
}