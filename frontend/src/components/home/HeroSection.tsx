import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, Zap, BarChart, Clock, RefreshCw, DollarSign, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Gradient text style
const gradientTextStyle = {
  backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent',
  display: 'inline-block'
};

const HeroSection: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <section className="relative overflow-hidden bg-black text-white min-h-[90vh] flex items-center pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 opacity-80"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-10"></div>
      </div>
      
      <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="md:w-1/2 rtl space-y-8"
          >
            {isAuthenticated ? (
              // תוכן למשתמש מחובר
              <>
                <div>
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-4 border border-white/20"
                  >
                    👋 שלום {user?.displayName || 'משתמש יקר'}
                  </motion.span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="block"
                  >
                    ברוך שובך 
                  </motion.span>
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    style={gradientTextStyle} 
                    className="font-extrabold"
                  >
                    למערכת הניהול
                  </motion.span>
                </h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="text-xl md:text-2xl text-white/80 font-light"
                >
                  המשך לנהל את הבוטים שלך או צור בוט חדש עם תוכן מותאם אישית לעסק שלך
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="pt-8 flex flex-wrap gap-5"
                >
                  <Link to="/businesses">
                    <Button size="lg" className="rounded-full px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-105">
                      <span className="flex items-center gap-2">
                        <ArrowRight className="w-5 h-5" /> העסקים שלי
                      </span>
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button size="lg" variant="outline" className="rounded-full px-8 py-6 border-2 border-white/30 text-white bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                      <span className="flex items-center gap-2">
                        <BarChart className="w-5 h-5" /> לוח בקרה
                      </span>
                    </Button>
                  </Link>
                  <Link to="/businesses">
                    <Button size="lg" variant="outline" className="rounded-full px-8 py-6 border-2 border-white/30 text-white bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                      <span className="flex items-center gap-2">
                        <Plus className="w-5 h-5" /> צור בוט חדש
                      </span>
                    </Button>
                  </Link>
                </motion.div>
              </>
            ) : (
              // תוכן למשתמש לא מחובר
              <>
                <div>
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-4 border border-white/20"
                  >
                    🚀 פתרון AI מתקדם לעסקים
                  </motion.span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="block"
                  >
                    בוט צ'אט 
                  </motion.span>
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    style={gradientTextStyle} 
                    className="font-extrabold"
                  >
                    חכם במיוחד
                  </motion.span>
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="block"
                  >
                    לעסק שלך
                  </motion.span>
                </h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="text-xl md:text-2xl text-white/80 font-light"
                >
                  הפוך את שירות הלקוחות שלך לאוטומטי עם בוט WhatsApp מותאם אישית המבוסס על בינה מלאכותית מתקדמת
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="pt-8 flex flex-wrap gap-5"
                >
                  <Link to="/register">
                    <Button size="lg" className="rounded-full px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-105">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" /> התחל עכשיו - בחינם
                      </span>
                    </Button>
                  </Link>
                  <Link to="/whatsapp">
                    <Button size="lg" variant="outline" className="rounded-full px-8 py-6 border-2 border-white/30 text-white bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                      <span className="flex items-center gap-2">
                        <Zap className="w-5 h-5" /> הדגמה חיה
                      </span>
                    </Button>
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
          
          <HeroPhoneMockup />
        </div>
      </div>
    </section>
  );
};

// Phone mockup component
const HeroPhoneMockup: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="md:w-1/2 mt-12 md:mt-0 flex justify-center items-center"
    >
      {/* Decorative elements */}
      <div className="absolute w-20 h-20 bg-blue-500 rounded-full filter blur-3xl opacity-20 -top-10 right-20 animate-pulse"></div>
      <div className="absolute w-32 h-32 bg-purple-500 rounded-full filter blur-3xl opacity-20 bottom-10 right-10 animate-pulse animation-delay-2000"></div>
      
      <div className="relative w-full max-w-md">
        {/* Phone mockup */}
        <div className="relative z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[40px] blur-xl transform rotate-6 scale-105"></div>
          <motion.div 
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 2, 0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[40px] border-[8px] border-gray-800 shadow-2xl overflow-hidden p-2 backdrop-blur-xl"
          >
            {/* Phone status bar */}
            <div className="bg-black rounded-t-3xl pt-2 pb-1 px-4 flex justify-between items-center">
              <div className="w-12"></div>
              <div className="w-16 h-4 bg-black rounded-b-xl mx-auto relative">
                <div className="absolute inset-x-0 top-0 h-1.5 w-10 mx-auto bg-gray-800 rounded-b-md"></div>
              </div>
              <div className="text-white text-xs">20:45</div>
            </div>
            
            {/* WhatsApp interface */}
            <div className="bg-[#0a1014] h-[500px] overflow-hidden">
              {/* WhatsApp header */}
              <div className="bg-[#1f2c34] p-3 flex items-center">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-white font-bold">
                    SB
                  </div>
                  <div className="rtl">
                    <div className="text-white font-medium">בוט סלון יופי</div>
                    <div className="text-green-400 text-xs">מקליד הודעה...</div>
                  </div>
                </div>
              </div>
              
              {/* Chat background */}
              <div className="bg-[url('/whatsapp-bg.png')] bg-repeat bg-opacity-5 h-full p-3 space-y-3 overflow-y-auto">
                {/* Messages */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.3 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#1f2c34] text-white p-2 rounded-lg rounded-tl-none max-w-[80%] shadow-sm rtl">
                    <p className="text-sm">שלום! אני הבוט החכם של סלון יופי. אשמח לעזור לך בקביעת תור, מידע על השירותים שלנו או כל שאלה אחרת.</p>
                    <div className="text-xs text-gray-400 text-left mt-1">20:30</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6, duration: 0.3 }}
                  className="flex justify-end"
                >
                  <div className="bg-[#005c4b] text-white p-2 rounded-lg rounded-tr-none max-w-[80%] shadow-sm rtl">
                    <p className="text-sm">אני רוצה לקבוע תור לתספורת</p>
                    <div className="text-xs text-gray-300 text-left mt-1">20:31 <span className="mr-1 text-blue-300">✓✓</span></div>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8, duration: 0.3 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#1f2c34] text-white p-2 rounded-lg rounded-tl-none max-w-[80%] shadow-sm rtl">
                    <p className="text-sm">בשמחה! אשמח לקבוע לך תור לתספורת. מתי תרצה להגיע?</p>
                    <div className="text-xs text-gray-400 text-left mt-1">20:31</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.0, duration: 0.3 }}
                  className="flex justify-end"
                >
                  <div className="bg-[#005c4b] text-white p-2 rounded-lg rounded-tr-none max-w-[80%] shadow-sm rtl">
                    <p className="text-sm">מחר בשעה 14:00</p>
                    <div className="text-xs text-gray-300 text-left mt-1">20:32 <span className="mr-1 text-blue-300">✓✓</span></div>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.2, duration: 0.3 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#1f2c34] text-white p-2 rounded-lg rounded-tl-none max-w-[80%] shadow-sm rtl">
                    <p className="text-sm">מצוין! קבעתי לך תור למחר בשעה 14:00 עם הספר יוסי. התור ימשך כ-45 דקות. נשמח לראותך!</p>
                    <div className="text-xs text-gray-400 text-left mt-1">20:32</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ delay: 2.4, duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-700/30 px-12 py-1 rounded-full">
                    <p className="text-xs text-white/70">מקליד הודעה...</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroSection;
