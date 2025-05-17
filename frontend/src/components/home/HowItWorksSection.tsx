import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, CheckCircle } from 'lucide-react';

// Gradient text style
const gradientTextStyle = {
  backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent',
  display: 'inline-block'
};

const HowItWorksSection: React.FC = () => {
  // מונע כפילות של הרכיב בדף
  // בדיקה אם הרכיב כבר קיים בדף
  React.useEffect(() => {
    const sections = document.querySelectorAll('.how-it-works-section');
    if (sections.length > 1) {
      // אם יש יותר מאחד, מסיר את הכפילות
      sections.forEach((section, index) => {
        if (index > 0) section.remove();
      });
    }
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-gray-100 relative overflow-hidden scroll-animation mt-0 mb-0 how-it-works-section">
      {/* אלמנטים דקורטיביים */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        <div className="absolute top-40 left-10 w-20 h-20 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-40 right-10 w-16 h-16 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* טקסט גדול ברקע */}
        <div className="absolute top-0 left-0 right-0 w-full flex justify-center items-center pointer-events-none overflow-hidden">
          <h2 className="text-9xl font-bold text-gray-100 opacity-30 select-none text-center w-full">איך זה עובד</h2>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-20 relative z-10"
        >
          <span className="inline-block px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium mb-4 shadow-lg transform hover:scale-105 transition-transform duration-300">מדריך מהיר</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center mx-auto w-full">
            איך <span style={gradientTextStyle}>מתחילים</span>?
          </h2>
          <div className="w-32 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto my-5 rounded-full"></div>
          <p className="mt-5 text-gray-600 max-w-2xl mx-auto text-center text-lg">שלושה צעדים פשוטים להפעלת בוט WhatsApp חכם לעסק שלך</p>
        </motion.div>
        
        <div className="relative mt-24">
          {/* Connection line */}
          <div className="hidden md:block absolute top-36 left-0 right-0 h-2.5 bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 rounded-full z-0 opacity-50"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 rtl relative z-10">
            <StepCard 
              number={1}
              title="הרשם בחינם"
              description="צור חשבון במערכת והגדר את העסק שלך במספר דקות בלבד. אין צורך בכרטיס אשראי בשלב זה."
              linkText="להרשמה"
              linkTo="/register"
              delay={0.1}
              icon={<Sparkles className="w-7 h-7" />}
              color="blue"
            />
            
            <StepCard 
              number={2}
              title="הגדר את הבוט"
              description="התאם את הבוט לצרכים של העסק שלך באמצעות ממשק נוח וידידותי. הוסף מידע על העסק, שעות פעילות, מחירים ושירותים."
              linkText="ללוח הבקרה"
              linkTo="/dashboard"
              delay={0.3}
              icon={<Zap className="w-7 h-7" />}
              color="purple"
            />
            
            <StepCard 
              number={3}
              title="הפעל וצור קשר"
              description="הפעל את הבוט ותן ללקוחות שלך ליצור קשר באמצעות WhatsApp. הבוט יענה באופן אוטומטי לשאלות ובקשות."
              linkText="להדגמה"
              linkTo="/whatsapp"
              delay={0.5}
              icon={<CheckCircle className="w-7 h-7" />}
              color="green"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  linkText: string;
  linkTo: string;
  delay: number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'indigo';
}

const StepCard: React.FC<StepCardProps> = ({ number, title, description, linkText, linkTo, delay, icon, color }) => {
  const gradientColors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };
  
  const bgColors = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
    indigo: 'bg-indigo-50'
  };
  
  const lightBgColors = {
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
    indigo: 'bg-indigo-100'
  };
  
  const textColors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    indigo: 'text-indigo-600'
  };
  
  const borderColors = {
    blue: 'border-blue-200',
    purple: 'border-purple-200',
    green: 'border-green-200',
    yellow: 'border-yellow-200',
    red: 'border-red-200',
    indigo: 'border-indigo-200'
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.03, y: -5 }}
      className={`text-center flex flex-col items-center bg-white rounded-2xl p-8 shadow-xl border ${borderColors[color]} relative overflow-hidden`}
    >
      {/* קישוט רקע */}
      <div className={`absolute top-0 left-0 right-0 h-2 ${lightBgColors[color]}`}></div>
      <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full ${lightBgColors[color]} opacity-50`}></div>
      <div className={`absolute -bottom-12 -left-12 w-24 h-24 rounded-full ${lightBgColors[color]} opacity-50`}></div>
      
      {/* אייקון ומספר */}
      <div className="relative">
        <div className={`relative z-10 w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br ${gradientColors[color]} flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden group`}>
          <div className="absolute inset-0 bg-white opacity-90 group-hover:opacity-80 transition-opacity duration-300"></div>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className={`w-14 h-14 rounded-xl ${lightBgColors[color]} flex items-center justify-center ${textColors[color]} shadow-md`}>
              {icon}
            </div>
          </div>
          <div className="absolute -bottom-1 left-0 right-0 text-center font-bold text-gray-800 bg-white bg-opacity-90 py-1 text-sm">
            {number}
          </div>
        </div>
      </div>
      
      {/* כותרת ותיאור */}
      <h3 className={`text-2xl font-bold mb-4 ${textColors[color]} text-center`}>{title}</h3>
      <p className="text-gray-600 max-w-xs mb-6 text-center">{description}</p>
      
      {/* כפתור */}
      <div className="mt-auto">
        <Link 
          to={linkTo} 
          className={`inline-flex items-center justify-center transition-all px-6 py-3 rounded-full font-medium text-white bg-gradient-to-r ${gradientColors[color]} shadow-md hover:shadow-lg transform hover:-translate-y-1`}
        >
          {linkText} <ArrowRight className="w-5 h-5 mr-2 mt-0.5" />
        </Link>
      </div>
    </motion.div>
  );
};

export default HowItWorksSection;
