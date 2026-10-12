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

    return (
        <section className="flex min-h-screen flex-col">
            <nav className="relative flex items-center justify-center gap-5 bg-[var(--secondary)] px-6 py-4 max-[820px]:flex-wrap max-[820px]:justify-between">
                <Link
                    className="font-[family-name:var(--headings)] text-[1.6rem] font-bold tracking-[-0.03em] text-white no-underline"
                    to="/dashboard"
                >
                    Edukatura
                </Link>

                <ul className="flex flex-1 items-center justify-center gap-4 max-[820px]:order-3 max-[820px]:w-full">
                    <li>
                        <NavLink
                            className={({ isActive }: { isActive: boolean }) =>
                                `rounded-xl px-4 py-2 text-[0.85rem] font-semibold no-underline transition duration-200 ease-in-out hover:bg-[var(--main)] hover:text-white ${isActive ? 'bg-[var(--main)] text-white' : 'text-white/80'}`
                            }
                            to="/dashboard"
                        >
                            Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            className={({ isActive }: { isActive: boolean }) =>
                                `rounded-xl px-4 py-2 text-[0.85rem] font-semibold no-underline transition duration-200 ease-in-out hover:bg-[var(--main)] hover:text-white ${isActive ? 'bg-[var(--main)] text-white' : 'text-white/80'}`
                            }
                            to="/courses"
                        >
                            {canTeach ? 'My courses' : 'Courses'}
                        </NavLink>
                    </li>
                    {isAdmin && (
                        <li>
                            <NavLink
                                className={({ isActive }: { isActive: boolean }) =>
                                    `rounded-xl px-4 py-2 text-[0.85rem] font-semibold no-underline transition duration-200 ease-in-out hover:bg-[var(--main)] hover:text-white ${isActive ? 'bg-[var(--main)] text-white' : 'text-white/80'}`
                                }
                                to="/users"
                            >
                                Users
                            </NavLink>
                        </li>
                    )}
                </ul>

                <div className="ml-auto flex items-center gap-[0.8rem] text-white max-[820px]:ml-0">
                    <span
                        className="grid size-9 select-none place-items-center rounded-full border border-white/30 bg-white/[0.14] text-[0.72rem] font-bold"
                        aria-hidden="true"
                    >
                        {initials(user)}
                    </span>

                    <span className="flex select-none flex-col gap-[0.1rem] text-xs text-white">
                        {fullName(user)}
                        <span className="text-[0.68rem] capitalize opacity-80">{(user as { role?: string })?.role}</span>
                    </span>

                    <button
                        className="cursor-pointer rounded-lg border border-white/30 bg-transparent px-3 py-2 text-[0.8rem] text-white hover:border-[var(--danger)] hover:bg-[var(--danger)]"
                        type="button"
                        onClick={signOut}
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            <main className="flex-1 pt-8">
                <Outlet />
            </main>
        </section>
    );
}