
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ResetPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600">Reset Password</h1>
        </div>
        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <p className="text-gray-600 text-center">Enter your email address and we will send you a link to reset your password.</p>
            <Input 
              id="email" 
              label="Email Address" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            <Button type="submit" fullWidth>
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-800">Check your email</h2>
            <p className="mt-4 text-gray-600">We've sent a password reset link to <span className="font-semibold">{email}</span>.</p>
          </div>
        )}
        <p className="mt-6 text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
