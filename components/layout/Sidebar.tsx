
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../core/auth/useAuth';
import { UserRole } from '../../types';
import { HomeIcon, AttendanceIcon, WorkIcon, MaterialsIcon, TasksIcon, AdminIcon, BriefcaseIcon, LogoIcon, LogoText, LogOutIcon } from '../icons';

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();

    const engineerNav = [
      { path: '/', label: 'Home', icon: HomeIcon },
      { path: '/attendance', label: 'Attendance', icon: AttendanceIcon },
      { path: '/work', label: 'Work Reports', icon: WorkIcon },
      { path: '/materials', label: 'Materials', icon: MaterialsIcon },
      { path: '/tasks', label: 'Tasks', icon: TasksIcon },
      { path: '/projects', label: 'Projects', icon: BriefcaseIcon },
    ];

    const adminNav = [
      { path: '/admin', label: 'Admin Panel', icon: AdminIcon },
      { path: '/projects', label: 'Projects', icon: BriefcaseIcon },
    ];

    const boardNav = [
      { path: '/board-dashboard', label: 'Dashboard', icon: HomeIcon },
      { path: '/projects', label: 'Projects', icon: BriefcaseIcon },
    ];

    let navItems = engineerNav;
    if (user?.role === UserRole.Admin) {
        navItems = adminNav;
    } else if (user?.role === UserRole.Board) {
        navItems = boardNav;
    }
    
    return (
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-neutral-200">
            <div className="flex items-center justify-center h-[73px] border-b border-neutral-200 px-4">
                <Link to="/" className="flex items-center space-x-2">
                    <LogoIcon className="w-8 h-8 text-primary-600"/>
                    <LogoText className="h-7 text-neutral-800"/>
                </Link>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                                isActive 
                                ? 'bg-primary-50 text-primary-600' 
                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-neutral-200">
                <div className="flex items-center space-x-3 mb-4">
                    <Link to="/profile">
                        <img src={user?.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full"/>
                    </Link>
                    <div>
                        <Link to="/profile" className="font-bold text-sm text-neutral-800 hover:underline">{user?.name}</Link>
                        <p className="text-xs text-neutral-500">{user?.role}</p>
                    </div>
                </div>
                 <button 
                    onClick={logout} 
                    className="flex items-center justify-center w-full p-2 bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-600 transition-colors rounded-lg font-semibold text-sm"
                >
                    <LogOutIcon className="w-5 h-5 mr-2" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
