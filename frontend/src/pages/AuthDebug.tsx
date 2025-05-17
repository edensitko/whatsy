import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
import { getToken, getCurrentUser, loginUser, logoutUser } from '@/services/authService';
import { authApi } from '@/services/apiService';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthDebug = () => {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load token and user on mount
  useEffect(() => {
    refreshAuthState();
  }, []);

  const refreshAuthState = () => {
    const currentToken = getToken();
    const currentUser = getCurrentUser();
    setToken(currentToken);
    setUser(currentUser);
    setCopied(false);
  };
  
  const copyTokenToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token)
        .then(() => {
          setCopied(true);
          toast({
            title: 'Token Copied',
            description: 'Authentication token copied to clipboard'
          });
          
          // Reset the copied state after 2 seconds
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy token:', err);
          toast({
            title: 'Copy Failed',
            description: 'Could not copy token to clipboard',
            variant: 'destructive'
          });
        });
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await loginUser(email, password);
      refreshAuthState();
      setEmail('');
      setPassword('');
      
      // Log the token to console for easy access
      console.log('Authentication Token:', response.token);
      
      toast({
        title: 'Login Successful',
        description: 'Your authentication token is now displayed below for use in Postman.'
      });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    refreshAuthState();
    setValidationResult(null);
  };

  const validateToken = async () => {
    if (!token) {
      setError('No token to validate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authApi.validateToken(token);
      setValidationResult(result);
    } catch (err: any) {
      setError(err.message || 'Token validation failed');
      setValidationResult({ valid: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const makeTestRequest = async () => {
    if (!token) {
      setError('No token available for test request');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Make a direct fetch request to test authentication
      const response = await fetch('http://localhost:3000/api/business/my-businesses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.text();
      let result;
      
      try {
        result = JSON.parse(data);
      } catch (e) {
        result = data;
      }

      setValidationResult({
        status: response.status,
        statusText: response.statusText,
        data: result
      });
    } catch (err: any) {
      setError(err.message || 'Test request failed');
      setValidationResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Header />
      
      <div className="max-w-3xl mx-auto mt-8">
        <h1 className="text-3xl font-bold mb-6">Authentication Debug Tool</h1>
        
        <div className="grid gap-6">
          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                <Button onClick={handleLogin} disabled={loading}>
                  {loading ? 'Loading...' : 'Login'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Token Display for Postman */}
          {token && (
            <Card className="border-2 border-green-500">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex justify-between items-center">
                  <span>Authentication Token for Postman</span>
                  <Button 
                    onClick={copyTokenToClipboard} 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy Token'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <div className="bg-gray-100 p-4 rounded-md overflow-auto">
                    <p className="text-xs mb-2 text-gray-500">For use in Postman Authorization header:</p>
                    <code className="text-sm font-bold break-all block p-2 bg-gray-200 rounded border border-gray-300">
                      Bearer {token}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Current Auth State */}
          <Card>
            <CardHeader>
              <CardTitle>Current Authentication State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Token</h3>
                  <div className="bg-gray-100 p-3 rounded-md overflow-auto max-h-20 relative">
                    <code className="text-sm break-all">{token || 'No token'}</code>
                    {token && (
                      <Button 
                        onClick={copyTokenToClipboard} 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-2 top-2"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">User</h3>
                  <div className="bg-gray-100 p-3 rounded-md overflow-auto max-h-40">
                    <pre className="text-sm">
                      {user ? JSON.stringify(user, null, 2) : 'No user'}
                    </pre>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={refreshAuthState} variant="outline">
                    Refresh
                  </Button>
                  <Button onClick={handleLogout} variant="destructive" disabled={!token}>
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Token Validation */}
          <Card>
            <CardHeader>
              <CardTitle>Test Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex gap-2">
                  <Button onClick={validateToken} disabled={!token || loading} className="flex-1">
                    Validate Token
                  </Button>
                  <Button onClick={makeTestRequest} disabled={!token || loading} className="flex-1">
                    Test API Request
                  </Button>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
                    {error}
                  </div>
                )}
                
                {validationResult && (
                  <div>
                    <h3 className="font-semibold mb-2">Result</h3>
                    <div className="bg-gray-100 p-3 rounded-md overflow-auto max-h-60">
                      <pre className="text-sm">
                        {JSON.stringify(validationResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;
