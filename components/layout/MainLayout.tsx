
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import OfflineBanner from '../OfflineBanner';

const MainLayout: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-neutral-100">
      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-full w-full max-w-lg mx-auto bg-neutral-50 shadow-lg">
        <Header />
        <main className="flex-grow overflow-y-auto pb-28 animate-page-fade-in overscroll-y-contain">
          <Outlet />
        </main>
        <BottomNav />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full w-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 xl:p-8 overscroll-y-contain">
          <Outlet />
        </main>
      </div>
      <OfflineBanner />
    </div>
  );
};

export default MainLayout;
