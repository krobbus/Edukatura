import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { fullName, initials } from '../utils';

export default function Layout() {
    const { user, logout, isAdmin, canTeach } = useAuth();
    const navigate = useNavigate();

    function signOut() {
        (logout as unknown as () => void)();
        navigate('/login', { replace: true });
    }

    const link = ({ isActive }: { isActive: boolean }) => `navLink${isActive ? ' active' : ''}`;

    return (
        <section className="layoutContainer">
            <nav>
                <Link className="title" to="/dashboard">
                    Edukatura
                </Link>

                <ul>
                    <li>
                        <NavLink className={link} to="/dashboard">
                            Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink className={link} to="/courses">
                            {canTeach ? 'My courses' : 'Courses'}
                        </NavLink>
                    </li>
                    {isAdmin && (
                        <li>
                            <NavLink className={link} to="/users">
                                Users
                            </NavLink>
                        </li>
                    )}
                </ul>

                <div className="userLogContainer">
                    <span className="avatar" aria-hidden="true">
                        {initials(user)}
                    </span>

                    <span className="user">
                        {fullName(user)}
                        <span className="role">{(user as { role?: string })?.role}</span>
                    </span>

                    <button type="button" onClick={signOut}>
                        Sign out
                    </button>
                </div>
            </nav>

            <main>
                <Outlet />
            </main>
        </section>
    );
}