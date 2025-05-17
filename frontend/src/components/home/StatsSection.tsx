import React from 'react';
import { motion } from 'framer-motion';
import { Clock, BarChart, RefreshCw, DollarSign, ChevronDown } from 'lucide-react';

// Gradient text style
const gradientTextStyle = {
  backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent',
  display: 'inline-block'
};

const StatsSection: React.FC = () => {
  return (
    <section className="py-16 bg-white relative overflow-hidden mt-0 mb-0">
      {/* אלמנטים דקורטיביים */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* כותרת חדשנית במרכז */}
        <div className="relative max-w-4xl mx-auto mb-24 text-center flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.07 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="absolute -top-20 left-1/2 transform -translate-x-1/2 text-[200px] font-black text-blue-500 opacity-5 select-none pointer-events-none z-0 w-full text-center"
          >
            45%
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative z-10 mb-4"
          >
            <span className="inline-block py-1 px-3 text-xs font-semibold tracking-wider text-blue-600 bg-blue-100 rounded-full mb-3">השפעה עסקית מוכחת</span>
            <h2 className="text-4xl md:text-5xl font-extrabold rtl mb-6 leading-tight">
              <span style={gradientTextStyle}>המספרים</span> מדברים בעד עצמם
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '100px' }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-8"
            style={{ maxWidth: '100px' }}
          />
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-2xl mx-auto rtl mb-10"
          >
            הבוט החכם שלנו משנה את האופן שבו עסקים מתקשרים עם לקוחות ומשפר משמעותית את חווית השירות
          </motion.p>
        </div>
        
        <div className="flex justify-between gap-3 max-w-5xl mx-auto px-4 lg:px-0">
          {/* כרטיסים קטנים יותר בעיצוב חדשני */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="w-64 h-64 bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 transform origin-left transition-all duration-300 group-hover:h-2"></div>
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <BarChart className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-blue-600 mb-1">45%</h3>
            <p className="font-medium text-gray-800 mb-3">עלייה במעורבות לקוחות</p>
            <p className="text-xs text-gray-500 leading-tight">חיבור עם יותר לקוחות באמצעות תשובות מיידיות</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="w-64 h-64 bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600 transform origin-left transition-all duration-300 group-hover:h-2"></div>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <RefreshCw className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-3xl font-bold text-green-600 mb-1">24/7</h3>
            <p className="font-medium text-gray-800 mb-3">זמינות ללקוחות שלך</p>
            <p className="text-xs text-gray-500 leading-tight">העסק שלך לעולם לא ישן - ספק תמיכה ומידע</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="w-64 h-64 bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600 transform origin-left transition-all duration-300 group-hover:h-2"></div>
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-3xl font-bold text-purple-600 mb-1">3.5h</h3>
            <p className="font-medium text-gray-800 mb-3">הפחתת זמן תגובה</p>
            <p className="text-xs text-gray-500 leading-tight">לקוחות מקבלים תשובות מיד במקום להמתין</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="w-64 h-64 bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 transform origin-left transition-all duration-300 group-hover:h-2"></div>
            <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-3xl font-bold text-yellow-600 mb-1">60%</h3>
            <p className="font-medium text-gray-800 mb-3">עלייה בשיעור ההמרה</p>
            <p className="text-xs text-gray-500 leading-tight">הפוך פניות למכירות עם מידע מיידי ומדויק</p>
          </motion.div>
        </div>
      </div>
      
      {/* קישוטים נוספים */}
      <div className="absolute bottom-20 left-10 w-20 h-20 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
    </section>
  );
};

export default StatsSection;
