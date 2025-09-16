
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { LogoIcon, LogoText } from '../components/icons';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Engineer);
  const [isLoading, setIsLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp({ name, email, password, phone, role });
      // The alert inside signUp will notify the user.
      // After successful sign up, Supabase might require email confirmation
      // depending on your project settings.
      navigate('/login');
    } catch (error) {
      // Error is handled by the alert in useAuth
      console.error("Signup attempt failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
            <LogoIcon className="w-16 h-16 text-primary-600 mb-2" />
            <LogoText className="h-10 text-neutral-800" />
            <p className="text-neutral-600 mt-2">Create your ConstructFlow account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-4">
          <Input id="name" label="Full Name" type="text" value={name} onChange={e => setName(e.target.value)} required />
          <Input id="email" label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input id="phone" label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
          <Input id="password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Select
            id="role"
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {Object.values(UserRole)
              // Removed filter to allow Admin and Board sign-ups for initial setup
              .map((r) => (
                <option key={r} value={r}>{r}</option>
            ))}
          </Select>
          <div className="pt-4">
            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-neutral-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
