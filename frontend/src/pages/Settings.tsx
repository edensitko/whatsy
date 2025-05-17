import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateProfile } from '@/services/authService';
// import { ProfilePhotoUploader } from '@/components/ProfilePhotoUploader';

const Settings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    language: 'he',
    darkMode: false,
    emailNotifications: true,
    smsNotifications: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        language: localStorage.getItem('preferredLanguage') || 'he',
        darkMode: localStorage.getItem('darkMode') === 'true',
        emailNotifications: localStorage.getItem('emailNotifications') !== 'false',
        smsNotifications: localStorage.getItem('smsNotifications') === 'true'
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
    localStorage.setItem(name, checked.toString());
  };

  const handleLanguageChange = (value: string) => {
    setFormData(prev => ({ ...prev, language: value }));
    localStorage.setItem('preferredLanguage', value);
  };

  // Photo update functionality is commented out for now
  // const handlePhotoUpdated = (photoURL: string) => {
  //   // Refresh user data would go here
  // };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedUser = await updateProfile({
        displayName: formData.displayName
      });

      alert('הפרופיל עודכן בהצלחה');
      // Refresh page to show updated profile
      window.location.reload();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('שגיאה בעדכון הפרופיל');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isAuthenticated || !user) {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 rtl">הגדרות</h1>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="profile" className="rtl">פרופיל</TabsTrigger>
              <TabsTrigger value="appearance" className="rtl">מראה</TabsTrigger>
              <TabsTrigger value="notifications" className="rtl">התראות</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="rtl">פרטי פרופיל</CardTitle>
                  <CardDescription className="rtl">
                    עדכן את הפרטים האישיים והתמונה שלך
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="md:w-1/3 flex justify-center">
                        {/* Profile photo uploader is temporarily disabled */}
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-gray-400 text-4xl">👤</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="md:w-2/3 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="displayName" className="rtl">שם מלא</Label>
                          <Input
                            id="displayName"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleInputChange}
                            className="rtl"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="rtl">דוא"ל</Label>
                          <Input
                            id="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="rtl bg-gray-100"
                          />
                          <p className="text-sm text-gray-500 rtl">לא ניתן לשנות את כתובת הדוא"ל</p>
                        </div>
                        
                        {/* Phone number field removed as it's not in the current user model */}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'מעדכן...' : 'שמור שינויים'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle className="rtl">הגדרות תצוגה</CardTitle>
                  <CardDescription className="rtl">
                    התאם את מראה האפליקציה להעדפותיך
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium rtl">מצב כהה</h3>
                      <p className="text-sm text-gray-500 rtl">הפעל מצב כהה לשימוש בלילה</p>
                    </div>
                    <Switch
                      checked={formData.darkMode}
                      onCheckedChange={(checked) => handleToggleChange('darkMode', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium rtl">שפה</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2 rtl">
                        <input
                          type="radio"
                          id="lang-he"
                          name="language"
                          checked={formData.language === 'he'}
                          onChange={() => handleLanguageChange('he')}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="lang-he">עברית</Label>
                      </div>
                      <div className="flex items-center space-x-2 rtl">
                        <input
                          type="radio"
                          id="lang-en"
                          name="language"
                          checked={formData.language === 'en'}
                          onChange={() => handleLanguageChange('en')}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="lang-en">English</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end">
                  <Button type="button">שמור שינויים</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="rtl">הגדרות התראות</CardTitle>
                  <CardDescription className="rtl">
                    קבע כיצד תרצה לקבל עדכונים והתראות
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium rtl">התראות דוא"ל</h3>
                      <p className="text-sm text-gray-500 rtl">קבל עדכונים לגבי העסקים שלך בדוא"ל</p>
                    </div>
                    <Switch
                      checked={formData.emailNotifications}
                      onCheckedChange={(checked) => handleToggleChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium rtl">התראות SMS</h3>
                      <p className="text-sm text-gray-500 rtl">קבל עדכונים דחופים באמצעות הודעות טקסט</p>
                    </div>
                    <Switch
                      checked={formData.smsNotifications}
                      onCheckedChange={(checked) => handleToggleChange('smsNotifications', checked)}
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end">
                  <Button type="button">שמור שינויים</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="rtl text-red-600">אזור מסוכן</CardTitle>
                <CardDescription className="rtl">
                  פעולות שעלולות להשפיע על החשבון שלך באופן משמעותי
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium rtl">התנתקות מכל המכשירים</h3>
                    <p className="text-sm text-gray-500 rtl">התנתק מכל המכשירים המחוברים לחשבון שלך</p>
                  </div>
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    התנתק מכל המכשירים
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
