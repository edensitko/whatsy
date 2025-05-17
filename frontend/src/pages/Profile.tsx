import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
// import ProfilePhotoUploader from '@/components/ProfilePhotoUploader';
import { useToast } from '@/hooks/use-toast';
import { isLoggedIn, getCurrentUser, logoutUser, updateProfilePhoto } from '@/services/authService';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { AuthUser } from '@/services/authService';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userData, setUserData] = useState<AuthUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  // Check if user is logged in
  useEffect(() => {
    const loggedIn = isLoggedIn();
    setUserLoggedIn(loggedIn);
    
    if (loggedIn) {
      const user = getCurrentUser();
      setUserData(user);
      
      if (user) {
        setDisplayName(user.displayName || '');
        setEmail(user.email);
      }
    } else {
      // Redirect to login if not logged in
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData) return;
    
    try {
      setLoading(true);
      
      // Update user data in Firestore
      const db = getFirestore();
      const userDocRef = doc(db, 'users', userData.uid);
      
      await updateDoc(userDocRef, {
        displayName,
        updatedAt: new Date()
      });
      
      // Update local user data
      const updatedUser = {
        ...userData,
        displayName
      };
      
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      
      toast({
        title: "פרופיל עודכן בהצלחה",
        description: "הפרטים האישיים שלך עודכנו בהצלחה",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "שגיאה בעדכון הפרופיל",
        description: "אירעה שגיאה בעדכון הפרטים האישיים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpdated = (photoURL: string) => {
    if (userData) {
      // Update local state
      setUserData({
        ...userData,
        photoURL
      });
      
      toast({
        title: photoURL ? "תמונת פרופיל עודכנה" : "תמונת פרופיל הוסרה",
        description: photoURL ? "תמונת הפרופיל שלך עודכנה בהצלחה" : "תמונת הפרופיל שלך הוסרה בהצלחה",
        variant: "default",
      });
    }
  };

  if (!userLoggedIn || !userData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto p-4 pt-24 pb-8">
          <div className="flex justify-center items-center h-full">
            <p className="text-xl">טוען...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto p-4 pt-24 pb-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 rtl">הפרופיל שלי</h1>
          
          <Card>
            <CardHeader>
              <CardTitle className="rtl">פרטים אישיים</CardTitle>
              <CardDescription className="rtl">
                עדכן את הפרטים האישיים והתמונה שלך
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="md:w-1/3 flex justify-center">
                    {/* <ProfilePhotoUploader 
                      currentPhotoURL={userData.photoURL} 
                      onPhotoUpdated={handlePhotoUpdated} 
                    /> */}
                  </div>
                  
                  <div className="md:w-2/3 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="rtl">שם מלא</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="rtl"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="rtl">כתובת אימייל</Label>
                      <Input
                        id="email"
                        value={email}
                        disabled
                        className="rtl bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 rtl">לא ניתן לשנות את כתובת האימייל</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="rtl"
                  >
                    {loading ? 'מעדכן...' : 'שמור שינויים'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
