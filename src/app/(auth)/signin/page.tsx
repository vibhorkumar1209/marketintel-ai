'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignInFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Check for error from NextAuth
  React.useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'CredentialsSignin') {
      setGeneralError('Invalid email or password');
    } else if (error === 'GoogleSignin') {
      setGeneralError('Failed to sign in with Google');
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SignInFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});

    try {
      // Validate form
      const validated = signInSchema.parse(formData);

      setIsLoading(true);

      // Sign in user
      const result = await signIn('credentials', {
        email: validated.email,
        password: validated.password,
        redirect: false,
      });

      if (result?.error) {
        setGeneralError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof SignInFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof SignInFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setGeneralError('An error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { redirect: true, callbackUrl: '/dashboard' });
    } catch (error) {
      setGeneralError('Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[#E8EDF5]">Sign In</h1>
            <span className="bg-teal-500/20 text-teal-400 text-[10px] font-black px-2 py-0.5 rounded border border-teal-500/30">v2.5.1 NEW</span>
        </div>
        <p className="text-[#8899BB]">Access your refined RefractOne v2.5.1 account</p>

      {generalError && (
        <div className="bg-red-600 bg-opacity-10 border border-red-600 border-opacity-30 rounded-lg p-4">
          <p className="text-red-300 text-sm">{generalError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          error={errors.email}
          disabled={isLoading}
        />

        <div className="flex items-end justify-between">
          <label className="block text-sm font-medium text-[#E8EDF5] mb-2">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-teal-600 hover:text-teal-500 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.password}
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          disabled={isLoading}
          className="w-full"
        >
          Sign In
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2A3A55]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#111827] text-[#8899BB]">Or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign in with Google
      </Button>

      <p className="text-center text-[#8899BB] text-sm">
        Don't have an account?{' '}
        <Link href="/signup" className="text-teal-600 hover:text-teal-500 font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
