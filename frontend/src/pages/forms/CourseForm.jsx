import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { capitalizeFirstLetter, fullName, spineColor } from '../../utils';
import ErrorNote from '../../components/ErrorNote';
import Loading from '../../components/Loading';

export default function CreateCourseForm() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const { courseId } = useParams();
    const isEditing = Boolean(courseId);

    const [instructorUsers, setInstructorUsers] = useState([]);
    const [originalCourse, setOriginalCourse] = useState(null);
    const [form, setForm] = useState({ courseCode: '', title: '', description: '', instructor: '' });

    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [loadingData, setLoadingData] = useState(isEditing);

    useEffect(() => {
        if (!isAdmin) return;
        api.get('/users')
            .then((data) => setInstructorUsers((data.users ?? data ?? []).filter((user) => user.role === 'instructor')))
            .catch((err) => setError(err));
    }, [isAdmin]);

    useEffect(() => {
        if (!isEditing) return;

        api.get(`/courses/${courseId}`)
            .then((data) => {
                const course = data.course ?? data;
                setOriginalCourse(course);
                setForm({
                    courseCode: course.courseCode ?? '',
                    title: course.title ?? '',
                    description: course.description ?? '',
                    instructor: course.instructor?._id ?? course.instructor ?? '',
                });
            })
            .catch((err) => setError(err))
            .finally(() => setLoadingData(false));
    }, [courseId, isEditing]);

    function change(e) {
        const { name, value } = e.target;
        setForm((f) => ({
            ...f,
            [name]: name === 'courseCode'
                ? value.toUpperCase()
                : name === 'title' || name === 'description'
                    ? capitalizeFirstLetter(value)
                    : value,
        }));
    }

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const data = await api.post('/courses', {
                ...form,
                courseCode: form.courseCode.trim().toUpperCase(),
            });
            navigate('/courses');
        } catch (err) {
            setError(err);
        } finally {
            setBusy(false);
        }
    }

    const selectedInstructor = instructorUsers.find((user) => user._id === form.instructor) || originalCourse?.instructor;

    if (loadingData) return <Loading label="Loading course details..." />;

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-5 py-8">
            <p>
                <Link className="text-sm font-semibold text-[var(--main)] hover:underline" to="/courses">⟵ All courses</Link>
            </p>

            {isEditing &&
                <div
                    className="flex flex-col gap-3 rounded-xl border border-[var(--line)] border-l-8 border-l-[color:var(--spine)] bg-[var(--panel)] p-5 shadow-sm"
                    style={{ '--spine': spineColor(form.courseCode || 'DEFAULT') }}
                >
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--main)]">{form.courseCode?.toUpperCase() || 'CODE'}</span>
                        <h2 className="font-[family-name:var(--headings)] text-xl font-semibold text-[var(--secondary)]">{form.title || 'Course Title'}</h2>
                        {selectedInstructor && typeof selectedInstructor === 'object' && (
                            <p className="text-sm font-medium text-[var(--muted)]">{fullName(selectedInstructor)}</p>
                        )}
                        {form.description && <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--shadow)]">{form.description}</p>}
                    </div>
                </div>
            }

            <form className="flex flex-col gap-5 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm" onSubmit={submit}>
                <h2 className="font-[family-name:var(--headings)] text-2xl font-semibold text-[var(--secondary)]">{isEditing ? 'Edit course' : 'New course'}</h2>
                <ErrorNote error={error} />

                <div className="flex flex-col gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="courseCode">Course code <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input
                            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            placeholder="e.g. CS101"
                            id="courseCode"
                            name="courseCode"
                            maxLength={10}
                            value={form.courseCode}
                            onChange={change}
                            required
                        />
                    </div>

                    {isAdmin && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="instructor">Instructor for this course <span className="requiredMarker" aria-hidden="true">*</span></label>
                            <select
                                className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                                id="instructor" name="instructor" value={form.instructor} onChange={change} required
                            >
                                <option value="">Select an instructor</option>
                                {instructorUsers.map((instructor) => (
                                    <option key={instructor._id} value={instructor._id}>
                                        {fullName(instructor)} ({instructor.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="title">Title <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input
                            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            id="title"
                            name="title"
                            placeholder="Course title"
                            maxLength={100}
                            value={form.title}
                            onChange={change}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[var(--secondary)]" htmlFor="description">Description</label>
                        <textarea
                            className="w-full resize-y rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--shadow)] placeholder:text-[var(--muted)] focus:border-[var(--main)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(42,107,92,0.2)]"
                            placeholder="What will learners learn?"
                            id="description"
                            name="description"
                            rows={3}
                            value={form.description}
                            onChange={change}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        className="inline-flex items-center justify-center rounded-lg bg-[var(--main)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        disabled={busy}
                    >
                        {busy ? 'Creating…' : 'Create course'}
                    </button>

                    <button
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--secondary)] transition hover:bg-[var(--highlight)] cursor-pointer"
                        type="button"
                        onClick={() => navigate('/courses')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </section>
    );
}