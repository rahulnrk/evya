import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Eye, EyeOff } from "lucide-react";
import { baseURL } from '@/config';
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');

    if (emailParam && tokenParam) {
      setEmail(emailParam);
      setToken(tokenParam);
      setTokenValid(true);
    } else {
      setTokenValid(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(
        `${baseURL}/services/userprofile/save-password`,
        null,
        {
          params: {
            email,
            password,
            confirmPassword
          }
        }
      );

      if (response.data.status === 'success') {
        setMessage('Password updated successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.data.message || 'Failed to update password');
      }
      } catch (err) {
        setError(err.response?.data?.message || 'Error updating password');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (tokenValid === null) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="text-center">
              <p>Loading...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

  if (!tokenValid) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              The password reset link is invalid or expired.
            </Alert>
            <Button
              onClick={() => navigate('/forgot-password')}
              className="w-full"
            >
              Request New Reset Link
            </Button>
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
            Set New Password
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              <label>New Password</label>
              <div className="relative">
                <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                minLength="8"
                required
                autoComplete="new-password"/>
                <button type="button" className="absolute right-2 top-2 text-muted-foreground hover:text-primary"
                onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                    )}
                </button>
              </div>
            </div>           
            <div className="space-y-2">
              <label>Confirm Password</label>
              <div className="relative">
                <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                minLength="8"
                required
                autoComplete="new-password"/>
                <button type="button" className="absolute right-2 top-2 text-muted-foreground hover:text-primary"
                onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                    ) : (
                    <Eye className="h-4 w-4" />
                    )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            > {isLoading ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
