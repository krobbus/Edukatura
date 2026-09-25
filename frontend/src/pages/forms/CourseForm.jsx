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
    
    const [facultyUsers, setFacultyUsers] = useState([]);
    const [originalCourse, setOriginalCourse] = useState(null);
    const [form, setForm] = useState({ courseCode: '', title: '', description: '', faculty: '' });

    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [loadingData, setLoadingData] = useState(isEditing);

    useEffect(() => {
        if (!isAdmin) return;
        api.get('/users')
            .then((data) => setFacultyUsers((data.users ?? data ?? []).filter((user) => user.role === 'faculty')))
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
                    faculty: course.faculty?._id ?? course.faculty ?? '',
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

    const selectedFacultyObj = facultyUsers.find(f => f._id === form.faculty) || originalCourse?.faculty;

    if (loadingData) return <Loading label="Loading course details..." />;

    return (
        <section className='courseFormPage'>
            <p className="courseBreadcrumb">
                <Link to="/courses">⟵ All courses</Link>
            </p>
            
            {isEditing &&
                <div className="courseCard" style={{ '--spine': spineColor(form.courseCode || 'DEFAULT') }}>
                    <div className="courseCardContent">
                        <span className="courseCode">{form.courseCode?.toUpperCase() || 'CODE'}</span>
                        <h2>{form.title || 'Course Title'}</h2>
                        {selectedFacultyObj && typeof selectedFacultyObj === 'object' && <p>{fullName(selectedFacultyObj)}</p>}
                        {form.description && <p className="textBlock">{form.description}</p>}
                    </div>
                </div>
            }

            <form className="courseForm" onSubmit={submit}>
                <h2>{isEditing ? 'Edit course' : 'New course'}</h2>
                <ErrorNote error={error} />

                <div className="formGrid">
                    <div className="formField">
                        <label htmlFor="courseCode">Course code <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input
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
                        <div className="formField">
                            <label htmlFor="faculty">Faculty handling this course <span className="requiredMarker" aria-hidden="true">*</span></label>
                            <select id="faculty" name="faculty" value={form.faculty} onChange={change} required>
                                <option value="">Select a faculty member</option>
                                {facultyUsers.map((faculty) => (
                                    <option key={faculty._id} value={faculty._id}>
                                        {fullName(faculty)} ({faculty.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="formField span">
                        <label htmlFor="title">Title <span className="requiredMarker" aria-hidden="true">*</span></label>
                        <input
                            id="title"
                            name="title"
                            placeholder="Course title"
                            maxLength={100}
                            value={form.title}
                            onChange={change}
                            required
                        />
                    </div>

                    <div className="formField span">
                        <label htmlFor="description">Description</label>
                        <textarea
                            placeholder="What will students learn?"
                            id="description"
                            name="description"
                            rows={3}
                            value={form.description}
                            onChange={change}
                        />
                    </div>
                </div>

                <div className="formActions">
                    <button className="submitButton" disabled={busy}>
                        {busy ? 'Creating…' : 'Create course'}
                    </button>

                    <button className="cancelButton" type="button" onClick={() => navigate('/courses')}>
                        Cancel
                    </button>
                </div>
            </form>
        </section>
    );
}