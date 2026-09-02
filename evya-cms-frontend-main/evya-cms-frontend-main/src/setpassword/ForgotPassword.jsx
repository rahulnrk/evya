import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";
import { baseURL } from '@/config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.get(
        `${baseURL}/services/userprofile/check-email`,
        { params: { email } }
      );

      if (response.data.exists) {
        setMessage('Password reset link has been sent to your email');
      } else {
        setError('Email not found');
      }
    } catch (err) {
      setError('Error sending reset link. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

   if (message) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Reset Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <p className="text-center">{message}</p>
            </Alert>
            <div className="flex flex-col space-y-3">
              <Button
                variant="link"
                onClick={() => {
                  setMessage('');
                  setEmail('');
                }}
              >
                Send Reset Link to Another Email
              </Button>
              <Button
                variant="link"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 mb-6">
            Enter your email to receive a password reset link
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <p>{error}</p>
              </Alert>
            )}           
            {message && (
              <Alert>
                <p>{message}</p>
              </Alert>
            )}
            <div className="space-y-2">
              <label>Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Remember your password?{' '}
            <Button
              variant="link"
              className="px-1"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}