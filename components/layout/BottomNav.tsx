
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../core/auth/useAuth';
import { UserRole } from '../../types';
import { HomeIcon, AttendanceIcon, WorkIcon, MaterialsIcon, TasksIcon, AdminIcon, BriefcaseIcon } from '../icons';

const BottomNav: React.FC = () => {
  const { user } = useAuth();

  const engineerNav = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/attendance', label: 'Attendance', icon: AttendanceIcon },
    { path: '/work', label: 'Work', icon: WorkIcon },
    { path: '/materials', label: 'Materials', icon: MaterialsIcon },
    { path: '/tasks', label: 'Tasks', icon: TasksIcon },
  ];

  const adminNav = [
    { path: '/projects', label: 'Projects', icon: BriefcaseIcon },
    { path: '/admin', label: 'Admin', icon: AdminIcon },
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
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-neutral-200 shadow-t-lg z-10">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full text-xs transition-colors duration-200 ${
                isActive ? 'text-primary-600' : 'text-neutral-500 hover:text-primary-500'
              }`
            }
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
