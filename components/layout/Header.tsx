
import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { ArrowLeftIcon } from '../icons';

const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    const path = location.pathname.split('/')[1] || 'home';
    switch (path) {
      case 'home': return 'Dashboard';
      case 'attendance': return 'Attendance';
      case 'work': return 'Work Reports';
      case 'materials': return 'Materials';
      case 'tasks': return 'Tasks';
      case 'projects': return 'Projects';
      case 'profile': return 'Profile';
      case 'admin': return 'Admin Panel';
      case 'board-dashboard': return 'Company Dashboard';
      case 'board': return 'Project Overview';
      default: return 'ConstructFlow';
    }
  };

  const rootPaths = [
    '/',
    '/home',
    '/attendance',
    '/work',
    '/materials',
    '/tasks',
    '/projects',
    '/profile',
    '/admin',
    '/board-dashboard',
  ];

  const showBackButton = !rootPaths.includes(location.pathname);
  const title = getTitle();

  return (
    <header className="bg-white sticky top-0 z-10 p-4 flex justify-between items-center h-[73px] border-b border-neutral-200">
      <div className="flex items-center space-x-4">
        {showBackButton && (
          <button onClick={() => navigate(-1)} className="text-neutral-600 hover:text-neutral-900">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        )}
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
          {user?.role !== UserRole.Board && !showBackButton && <p className="text-xs text-neutral-500">Project: Skyscraper Tower</p>}
        </div>
      </div>
      <Link to="/profile">
        <img
          src={user?.avatarUrl}
          alt="User Avatar"
          className="w-10 h-10 rounded-full"
        />
      </Link>
    </header>
  );
};

export default Header;
