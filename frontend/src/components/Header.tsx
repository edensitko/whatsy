import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, MessageCircle, User, LogOut, LogIn, UserPlus, Settings, Bell, HelpCircle, BarChart, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  // אופציונלי - פונקציה שתקרא בעת לחיצה על כפתור ההתנתקות
  // אם לא מועבר, נשתמש בפונקציה מה-AuthContext
  onLogout?: () => void;
}

const Header = ({ onLogout }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div 
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="rounded-xl w-12 h-12 flex items-center justify-center shadow-sm bg-white overflow-hidden"
          >
            <img 
              src="/logo.PNG" 
              alt="Smart Biz Chatflow Logo" 
              className="w-full h-full object-contain p-1"
            />
          </motion.div>
          <div className="flex flex-col">
            <span className={`font-bold text-xl rtl:mr-2 ltr:ml-2 transition-colors duration-300 ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
              Smart Biz Chatflow
            </span>
            <span className={`text-xs rtl:mr-2 ltr:ml-2 transition-colors duration-300 ${isScrolled ? 'text-gray-500' : 'text-gray-300'}`}>
              בוט WhatsApp חכם לעסקים
            </span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <Button 
                  variant={location.pathname === '/dashboard' ? 'default' : 'ghost'} 
                  className={`rtl:ml-2 font-medium transition-all duration-300 ${isScrolled ? 'text-gray-800 hover:text-blue-600' : 'text-white hover:text-blue-200'}`}
                >
                  <User className="ml-2 w-4 h-4" />
                  לוח בקרה
                </Button>
              </Link>
              
              {/* User Profile Menu */}
              <div className="relative" ref={userMenuRef}>
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <Button 
                    variant="ghost" 
                    className={`rounded-full px-3 py-2 transition-all duration-300 flex items-center ${isScrolled ? 'text-gray-800 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="flex items-center">
                      {user && user.photoURL ? (
                        <img src={user.photoURL} alt="תמונת פרופיל" className="w-8 h-8 rounded-full ml-2 border-2 border-white/30" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ml-2 border-2 border-white/30">
                          {user?.displayName?.charAt(0) || 'מ'}
                        </div>
                      )}
                      <span className="max-w-[100px] truncate">{user?.displayName || 'משתמש'}</span>
                      <ChevronDown className={`w-4 h-4 mr-1 transition-transform duration-200 ${userMenuOpen ? 'transform rotate-180' : ''}`} />
                    </div>
                  </Button>
                </motion.div>
                
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute left-0 mt-2 w-56 rounded-lg shadow-lg py-1 z-50 rtl ${isScrolled ? 'bg-white' : 'bg-white/90 backdrop-blur-md'}`}
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}>
                        <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center cursor-pointer">
                          <User className="ml-2 w-4 h-4 text-gray-500" />
                          הפרופיל שלי
                        </div>
                      </Link>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <div 
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center cursor-pointer"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                      >
                        <LogOut className="ml-2 w-4 h-4 text-red-500" />
                        התנתק
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
             
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    className={`rtl:ml-2 rounded-full px-6 py-2 transition-all duration-300 relative z-10 overflow-hidden ${isScrolled ? 'text-purple-600 bg-purple-50/50 hover:bg-purple-100/70' : 'text-white bg-white/10 backdrop-blur-sm hover:bg-white/20'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                    <div className="relative z-10 flex items-center">
                      <LogIn className="ml-2 w-4 h-4" />
                      <span>התחברות</span>
                    </div>
                  </Button>
                </Link>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Link to="/register">
                  <Button 
                    variant="default" 
                    className="rounded-full px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 relative z-10"
                  >
                    <UserPlus className="ml-2 w-4 h-4" />
                    הרשמה
                  </Button>
                </Link>
              </motion.div>
            </>
          )}
        </nav>
        
        {/* Mobile Menu Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`md:hidden p-2 rounded-full backdrop-blur-sm transition-colors duration-300 ${isScrolled ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-white/10 text-white hover:bg-white/20'}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </motion.button>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 backdrop-blur-md shadow-lg overflow-hidden border-t border-gray-100"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4 rtl">
              {isAuthenticated ? (
                <>
                  {/* User profile info */}
                  <div className="p-4 border-b border-gray-100 mb-2">
                    <div className="flex items-center">
                      {user && user.photoURL ? (
                        <img src={user.photoURL} alt="תמונת פרופיל" className="w-12 h-12 rounded-full ml-3 border-2 border-purple-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ml-3 border-2 border-purple-200">
                          {user?.displayName?.charAt(0) || 'מ'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user?.displayName || 'משתמש'}</p>
                        <p className="text-xs text-gray-500">{user?.email || ''}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={location.pathname === '/dashboard' ? 'default' : 'ghost'} className="w-full justify-start">
                      <User className="ml-2 w-4 h-4" />
                      לוח בקרה
                    </Button>
                  </Link>
                  
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="ml-2 w-4 h-4" />
                      הפרופיל שלי
                    </Button>
                  </Link>
                  
                  <div className="border-t border-gray-100 my-2"></div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onLogout) {
                        onLogout();
                      } else {
                        logout();
                      }
                    }}
                  >
                    <LogOut className="ml-2 w-4 h-4" />
                    התנתק
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start bg-gradient-to-r from-purple-500/5 to-pink-500/5 text-purple-600 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 transition-all duration-300 rounded-lg overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex items-center">
                        <LogIn className="ml-2 w-4 h-4" />
                        <span>התחברות</span>
                      </div>
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="default" 
                      className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all duration-300"
                    >
                      <UserPlus className="ml-2 w-4 h-4" />
                      <span className="relative inline-block">הרשמה</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
