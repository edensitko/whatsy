import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const TestLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
  }, []);

  const handleTestLogin = () => {
    // Create a test user
    const testUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      businesses: []
    };

    // Store the test token and user in localStorage
    localStorage.setItem('auth_token', 'test-token-123');
    localStorage.setItem('auth_user', JSON.stringify(testUser));

    toast({
      title: 'Test Login Successful',
      description: 'You are now logged in as a test user',
    });

    setIsLoggedIn(true);
  };

  const handleFirebaseTestLogin = () => {
    // Create a test user with a firebase-style token
    const testUser = {
      uid: 'firebase-user-123',
      email: 'firebase@example.com',
      displayName: 'Firebase Test User',
      businesses: []
    };

    // Store the firebase-style test token and user in localStorage
    localStorage.setItem('auth_token', 'firebase:firebase-user-123');
    localStorage.setItem('auth_user', JSON.stringify(testUser));

    toast({
      title: 'Firebase Test Login Successful',
      description: 'You are now logged in as a firebase test user',
    });

    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    toast({
      title: 'Logged Out',
      description: 'You have been logged out',
    });

    setIsLoggedIn(false);
  };

  const goToBusinessList = () => {
    navigate('/businesses');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Header />
      
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              This page allows you to log in with a test account without going through the full authentication flow.
              This is useful for development and testing.
            </p>
            
            {isLoggedIn ? (
              <>
                <div className="bg-green-50 p-3 rounded-md text-green-700 text-sm">
                  You are currently logged in as a test user.
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button onClick={goToBusinessList}>
                    Go to Business List
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Button onClick={handleTestLogin}>
                  Login with Test Account
                </Button>
                <Button variant="outline" onClick={handleFirebaseTestLogin}>
                  Login with Firebase Test Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestLogin;
