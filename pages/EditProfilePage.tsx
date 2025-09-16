
import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../lib/supabase';
import { EditIcon } from '../components/icons';

const EditProfilePage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            let newAvatarUrl = user.avatarUrl;
            
            // 1. Upload new avatar if a new one is selected
            if (avatarFile) {
                const filePath = `${user.id}/${Date.now()}_${avatarFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile);
                
                if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);
                
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                newAvatarUrl = publicUrl;
            }

            // 2. Update profile information
            const { error: profileError } = await supabase.from('profiles')
                .update({ name, phone, avatar_url: newAvatarUrl })
                .eq('id', user.id);
            
            if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);

            // 3. Delete old avatar from storage if it's not a default one
            const isOldAvatarInStorage = user.avatarUrl.includes('supabase.co/storage');
            if (avatarFile && isOldAvatarInStorage) {
                const oldAvatarPath = user.avatarUrl.split('/avatars/')[1];
                if (oldAvatarPath) {
                    await supabase.storage.from('avatars').remove([oldAvatarPath]);
                }
            }
            
            // 4. Refresh user data in the app and navigate
            await refreshUser();
            alert('Profile updated successfully!');
            navigate('/profile');

        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match.");
            return;
        }
        if (!newPassword) {
            alert("New password cannot be empty.");
            return;
        }

        setIsSaving(true);
        // FIX: Reverted to `updateUser`, which is the correct method for changing passwords in Supabase JS v2.
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            alert(`Error changing password: ${error.message}`);
        } else {
            alert('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setIsSaving(false);
    };

    return (
        <div className="p-4 lg:p-0 space-y-6">
            <PageHeader title="Edit Profile" subtitle="Update your personal details and password." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <form onSubmit={handleInfoSubmit} className="space-y-4">
                        <h3 className="text-lg font-bold text-neutral-700">Edit Personal Information</h3>

                        <div className="flex justify-center">
                            <div className="relative">
                                <img
                                    src={avatarPreview || ''}
                                    alt="Profile Avatar"
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={handleAvatarClick}
                                    className="absolute bottom-0 right-0 bg-primary-600 p-2 rounded-full text-white hover:bg-primary-700 transition"
                                    aria-label="Change profile picture"
                                >
                                    <EditIcon className="w-4 h-4" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarChange}
                                    accept="image/png, image/jpeg"
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <Input id="name" label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                        <Input id="phone" label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
                        <Input id="email" label="Email Address" type="email" value={user?.email || ''} disabled className="bg-neutral-100" />
                        
                        <Button type="submit" fullWidth disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </Card>

                <Card>
                     <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <h3 className="text-lg font-bold text-neutral-700">Change Password</h3>
                        <Input id="new-password" label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        <Input id="confirm-password" label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        
                        <Button type="submit" fullWidth variant="secondary" disabled={isSaving}>
                            {isSaving ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default EditProfilePage;
