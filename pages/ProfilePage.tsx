import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ChevronRightIcon, UserIcon, BellIcon, HelpCircleIcon, InfoIcon, LogOutIcon, RefreshCwIcon } from '../components/icons';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const ProfileLink: React.FC<{ icon: React.FC<{className?: string}>; label: string; onClick?: () => void; isDestructive?: boolean }> = ({ icon: Icon, label, onClick, isDestructive = false }) => (
    <button onClick={onClick} className={`flex items-center w-full text-left p-4 bg-white transition-colors rounded-lg ${isDestructive ? 'hover:bg-red-50' : 'hover:bg-neutral-50'}`}>
        <div className={`p-2 rounded-lg mr-4 ${isDestructive ? 'bg-red-100' : 'bg-primary-100'}`}>
            <Icon className={`w-6 h-6 ${isDestructive ? 'text-red-600' : 'text-primary-600'}`} />
        </div>
        <span className={`flex-grow font-semibold ${isDestructive ? 'text-red-700' : 'text-neutral-700'}`}>{label}</span>
        <ChevronRightIcon className="w-5 h-5 text-neutral-400" />
    </button>
);


const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isAboutModalOpen, setAboutModalOpen] = useState(false);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    // Hardcode the version to fix runtime crash. This is a robust solution for the current environment.
    const version = '1.1.0';

    const handleClearCacheAndRestart = async () => {
        try {
            console.log('Clearing cache and unregistering service workers...');
            
            // Clear all caches
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
            
            // Unregister all service workers
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
            
            console.log('Cache and service workers cleared. Reloading...');
            setConfirmModalOpen(false);
            
            // Force a hard reload from the server
            window.location.reload();

        } catch (error) {
            console.error('Failed to clear cache and restart:', error);
            alert('Could not clear cache. Please try clearing your browser data manually.');
            setConfirmModalOpen(false);
        }
    };

    return (
        <div className="bg-neutral-100 min-h-full lg:p-0">
            <PageHeader title="Profile" />
            <div className="lg:hidden bg-primary-600 p-6 rounded-b-3xl text-white">
                 <div className="flex flex-col items-center text-center">
                    <img src={user?.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full mb-4 border-4 border-primary-400 shadow-lg" />
                    <h2 className="text-2xl font-bold">{user?.name}</h2>
                    <p className="text-primary-200">{user?.role}</p>
                 </div>
            </div>
            
            <div className="p-4 lg:p-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 hidden lg:block bg-white p-6 rounded-xl shadow-sm text-center">
                    <img src={user?.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full mb-4 border-4 border-primary-200 shadow-lg mx-auto" />
                    <h2 className="text-2xl font-bold">{user?.name}</h2>
                    <p className="text-neutral-500">{user?.role}</p>
                </div>
                <div className="lg:col-span-2 space-y-3">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                         <h3 className="font-bold text-lg mb-2 text-neutral-800">Account Information</h3>
                         <div className="space-y-2 text-sm text-neutral-600">
                            <p><span className="font-semibold">Email:</span> {user?.email}</p>
                            <p><span className="font-semibold">Phone:</span> {user?.phone}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-bold text-lg px-2 pt-2 text-neutral-800">Settings & More</h3>
                        <ProfileLink icon={UserIcon} label="Edit Profile & Password" onClick={() => navigate('/profile/edit')} />
                        <ProfileLink icon={BellIcon} label="Notifications" onClick={() => alert('Navigation to Notifications page')} />
                        <ProfileLink icon={HelpCircleIcon} label="Help & Support" onClick={() => alert('Navigation to Help page')} />
                        <ProfileLink icon={InfoIcon} label="About" onClick={() => setAboutModalOpen(true)} />
                        <ProfileLink icon={RefreshCwIcon} label="Clear Cache & Force Restart" isDestructive onClick={() => setConfirmModalOpen(true)} />
                    </div>

                    <div className="pt-4 lg:hidden">
                         <button 
                            onClick={logout} 
                            className="flex items-center justify-center w-full text-left p-4 bg-white hover:bg-red-50 text-red-600 transition-colors rounded-lg font-semibold"
                        >
                            <LogOutIcon className="w-6 h-6 mr-3" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* About Modal */}
            <Modal isOpen={isAboutModalOpen} onClose={() => setAboutModalOpen(false)}>
                <div className="text-center">
                    <InfoIcon className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold">About ConstructFlow</h3>
                    <p className="my-2 text-neutral-600">A modern PWA for construction management.</p>
                    <p className="font-semibold text-neutral-800">Version: {version}</p>
                    <Button onClick={() => setAboutModalOpen(false)} className="mt-6" fullWidth>
                        Close
                    </Button>
                </div>
            </Modal>

            {/* Confirmation Modal for Cache Clear */}
            <Modal isOpen={isConfirmModalOpen} onClose={() => setConfirmModalOpen(false)}>
                 <div className="text-center">
                    <RefreshCwIcon className="w-12 h-12 text-red-500 mx-auto mb-4 animate-spin" style={{ animationDuration: '2s' }}/>
                    <h3 className="text-xl font-bold">Are you sure?</h3>
                    <p className="my-4 text-neutral-600">
                        This will clear all locally cached data and force the app to restart. This can resolve issues with outdated content.
                    </p>
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleClearCacheAndRestart}>Confirm & Restart</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProfilePage;