import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../api/client';
import { capitalizeFirstLetter, dueMeta, toInputDateTime } from '../../utils';
import ErrorNote from '../../components/ErrorNote';
import Loading from '../../components/Loading';

export default function AssignmentForm() {
    const navigate = useNavigate();
    const { courseId, assignmentId } = useParams();
    const isEditing = Boolean(assignmentId);

    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        maxPoints: 100,
        module: '',
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

        api.get(`/assignments/${assignmentId}`)
            .then((data) => {
                const assignment = data.assignment ?? data;
                setForm({
                    title: assignment.title ?? '',
                    description: assignment.description ?? '',
                    dueDate: toInputDateTime(assignment.dueDate),
                    maxPoints: assignment.maxPoints ?? 100,
                    module: assignment.module?._id ?? assignment.module ?? '',
                });
            })
            .catch((err) => setError(err))
            .finally(() => setLoadingData(false));
    }, [assignmentId, isEditing]);

    function change(e) {
        const { name, value } = e.target;
        setForm((current) => ({
            ...current,
            [name]: name === 'title' || name === 'description' ? capitalizeFirstLetter(value) : value,
        }));
    }

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const data = await api.post('/assignments', {
                course: courseId,
                title: form.title,
                description: form.description,
                dueDate: new Date(form.dueDate).toISOString(),
                maxPoints: Number(form.maxPoints),
                module: form.module || null 
            });

            if (isEditing) {
                await api.put(`/assignments/${assignmentId}`, payload);
            } else {
                await api.post('/assignments', payload);
            }

            navigate(`/courses/${courseId}`);
        } catch (submitError) {
            setError(submitError);
        } finally {
            setBusy(false);
        }
    }

    const meta = form.dueDate ? dueMeta(form.dueDate) : { label: 'No due date', className: '' };

    if (loadingData) return <Loading label="Loading assignment details..." />;

    return (
        <section className="assignmentFormPage">
            <p className="assignmentBreadcrumb">
                <Link to={`/courses/${courseId}`}>
                    ⟵ {course?.courseCode ? `${course.courseCode} · ${course.title}` : 'Back to course'}
                </Link>
            </p>

            {isEditing &&
                <div className="assignmentCard">
                    <div className="assignmentCardContent">
                        <strong className="assignmentLabel">Saved details</strong>

                        <div className="assignmentHeading">
                            <h2>{form.title || 'Assignment Title'}</h2>

                            <div className="assignmentSubheading">
                                <span className={`dueDate ${meta.className}`}>{meta.label}</span>
                                <span>Max points: {form.maxPoints}</span>
                            </div>
                        </div>

                        {form.description && <p className='assignmentDescription'>{form.description}</p>}
                    </div>
                </div>
            }

            <form className="assignmentForm" onSubmit={submit}>
                <h2>{isEditing ? 'Edit assignment' : 'New assignment'}</h2>
                <ErrorNote error={error} />

                <div className="formGrid">
                    <div className="formField">
                        <label htmlFor="a-title">Title <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input id="a-title" name="title" placeholder="Assignment title" maxLength={100} value={form.title} onChange={change} required />
                    </div>

                    <div className="formField">
                        <label htmlFor="a-module">Module</label>
                        <select id="a-module" name="module" value={form.module} onChange={change}><option value="">No module</option>{modules.map((module) => <option key={module._id} value={module._id}>{module.title}</option>)}</select>
                    </div>

                    <div className="formField span">
                        <label htmlFor="a-desc">Instructions <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <textarea id="a-desc" name="description" placeholder="Explain what students need to do" rows={5} value={form.description} onChange={change} required />
                    </div>

                    <div className="formField">
                        <label htmlFor="a-due">Due date <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input id="a-due" name="dueDate" type="datetime-local" placeholder="Choose a due date" min={toInputDateTime(Date.now())} value={form.dueDate} onChange={change} required />
                    </div>

                    <div className="formField">
                        <label htmlFor="a-points">Max Points</label>
                        <input id="a-points" name="maxPoints" type="number" placeholder="100" min={1} value={form.maxPoints} onChange={change} />
                    </div>
                </div>

                <div className="formActions">
                    <button className="submitButton" disabled={busy}>
                        {busy ? (isEditing ? 'Saving…' : 'Posting…') : (isEditing ? 'Save changes' : 'Post assignment')}
                    </button>

                    <button className="cancelButton" type="button" onClick={() => navigate(`/courses/${courseId}`)}>Cancel</button>
                </div>
            </form>
        </section>
    );
}