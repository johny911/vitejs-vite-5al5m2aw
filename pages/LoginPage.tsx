import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../core/auth/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { LogoIcon, LogoText } from '../components/icons';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('johnyabraham8056@gmail.com');
  const [password, setPassword] = useState('test123');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      // Error is handled by the alert in useAuth, so we just need to prevent navigation.
      console.log("Login attempt failed.");
    }
  };

  const handleQuickLogin = async (loginEmail: string, loginPass: string) => {
    setEmail(loginEmail);
    setPassword(loginPass);
    try {
      await login(loginEmail, loginPass);
      navigate('/');
    } catch (error) {
      console.log("Quick login attempt failed.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <LogoIcon className="w-16 h-16 text-primary-600 mb-2" />
          <LogoText className="h-10 text-neutral-800" />
          <p className="text-neutral-600 mt-2">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <Input 
            id="email" 
            label="Email Address" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <Input 
            id="password" 
            label="Password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/reset-password" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </Link>
            </div>
          </div>
          <Button type="submit" fullWidth>
            Sign In
          </Button>
        </form>
         <div className="mt-4 bg-neutral-200 p-3 rounded-lg">
            <p className="text-xs text-center text-neutral-600 mb-2 font-semibold">Quick Logins for Demo</p>
            <div className="grid grid-cols-3 gap-2">
                <Button variant="secondary" className="py-2 text-xs" onClick={() => handleQuickLogin('johnyabraham8056@gmail.com', 'test123')}>Engineer</Button>
                <Button variant="secondary" className="py-2 text-xs" onClick={() => handleQuickLogin('johnyabraham49@gmail.com', 'test123')}>Admin</Button>
                <Button variant="secondary" className="py-2 text-xs" onClick={() => handleQuickLogin('johny@arkbuilders.co.in', 'test123')}>Board</Button>
            </div>
        </div>
        <p className="mt-6 text-center text-sm text-neutral-600">
          Not a member?{' '}
          <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;