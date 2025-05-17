import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import CtaSection from '@/components/home/CtaSection';
import FooterSection from '@/components/home/FooterSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// Import animations CSS
import '@/styles/animations.css';

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Add scroll animation 
  useEffect(() => {
    const handleScroll = () => {
      const scrollElements = document.querySelectorAll('.scroll-animation');
      
      scrollElements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementPosition < windowHeight - 100) {
          element.classList.add('animate');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    // Trigger once on load
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 ">
        {isAuthenticated && user ? (
          // תוכן מותאם למשתמש מחובר
          <div className="container mx-auto px-2 py-1">
            <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 rounded-2xl p-8 shadow-2xl mb-12">
              <div className="max-w-4xl mx-auto text-center pt-16 pb-16">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                    ברוך הבא, {user?.displayName || 'משתמש יקר'}!
                  </span>
                </h1>
                <p className="text-lg text-blue-100 mb-8">
                  אנחנו שמחים לראות אותך שוב. מה תרצה לעשות היום?  
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                  <Link to="/dashboard">
                    <div className="bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 p-6 rounded-xl shadow-lg border border-white/10 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">לוח הבקרה שלי</h3>
                      <p className="text-blue-100">צפה בנתונים ובסטטיסטיקות של העסק שלך</p>
                    </div>
                  </Link>
                  
                  <Link to="/businesses">
                    <div className="bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 p-6 rounded-xl shadow-lg border border-white/10 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">העסקים שלי</h3>
                      <p className="text-blue-100">נהל את העסקים שלך וצור עסקים חדשים</p>
                    </div>
                  </Link>
                  <Link to="/settings">
                    <div className="bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 p-6 rounded-xl shadow-lg border border-white/10 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">הגדרות הפרופיל</h3>
                      <p className="text-blue-100">נהל את הפרופיל וההגדרות שלך</p>
                    </div>
                  </Link>


                  <Link to="/calendar">
                    <div className="bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 p-6 rounded-xl shadow-lg border border-white/10 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">לוח תורים </h3>
                      <p className="text-blue-100">הנהל את תורים העסק שלך</p>
                    </div>
                  </Link>
                  

                </div>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">הפעילות האחרונה שלך</h2>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="space-y-4">
                  <p className="text-gray-600 text-center">אין פעילות אחרונה להצגה.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // תוכן רגיל למשתמש לא מחובר
          <>
            <HeroSection />
            <StatsSection />
            <FeaturesSection />
            {/* <HowItWorksSection /> */}
            {/* <TestimonialsSection /> */}
            {/* <CtaSection /> */}
          </>
        )}
      </main>
      
      <FooterSection />
    </div>
  );
};

export default Index;