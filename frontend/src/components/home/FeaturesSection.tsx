import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Calendar, Bot, Lightbulb, Star, Check, Zap } from 'lucide-react';

// Gradient text style
const gradientTextStyle = {
  backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent',
  display: 'inline-block'
};

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 bg-gray-100 relative overflow-hidden mt-0 mb-0">
      {/* אלמנטים דקורטיביים */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* כותרת חדשנית במרכז */}
        <div className="relative max-w-4xl mx-auto mb-24 text-center flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.07 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="absolute -top-20 left-1/2 transform -translate-x-1/2 text-[200px] font-black text-purple-500 opacity-5 select-none pointer-events-none z-0 w-full text-center"
          >
            תכונות
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative z-10 mb-4"
          >
            <span className="inline-block py-1 px-3 text-xs font-semibold tracking-wider text-purple-600 bg-purple-100 rounded-full mb-3">יתרונות המערכת</span>
            <h2 className="text-4xl md:text-5xl font-extrabold rtl mb-6 leading-tight">
              למה <span style={gradientTextStyle}>לבחור</span> במערכת הצ'אט העסקית שלנו?
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '100px' }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="h-1 bg-gradient-to-r from-purple-500 to-blue-600 mx-auto mb-8"
            style={{ maxWidth: '100px' }}
          />
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-2xl mx-auto rtl mb-10"
          >
            המערכת שלנו מספקת פתרון מקיף לניהול תקשורת עם לקוחות באמצעות WhatsApp
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 lg:px-0">
          {/* כרטיס 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group h-full"
          >
            <div className="absolute inset-0 bg-white opacity-90 group-hover:opacity-85 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <Phone className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">WhatsApp אוטומטי</h3>
              <p className="text-gray-600 text-sm leading-relaxed">מענה אוטומטי ללקוחות ב-WhatsApp ללא צורך בידע טכני. הבוט פועל 24/7 ומספק מענה מיידי לכל פנייה.</p>
            </div>
          </motion.div>
          
          {/* כרטיס 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group h-full"
          >
            <div className="absolute inset-0 bg-white opacity-90 group-hover:opacity-85 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <Calendar className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">קביעת תורים אוטומטית</h3>
              <p className="text-gray-600 text-sm leading-relaxed">לקוחות יכולים לקבוע תורים בצורה קלה ופשוטה, לבטל או לשנות תורים קיימים, ולקבל תזכורות אוטומטיות.</p>
            </div>
          </motion.div>
          
          {/* כרטיס 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group h-full"
          >
            <div className="absolute inset-0 bg-white opacity-90 group-hover:opacity-85 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <Bot className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">AI חכם</h3>
              <p className="text-gray-600 text-sm leading-relaxed">הבוט לומד את העסק שלך ועונה על שאלות הלקוחות בצורה טבעית ומדויקת, כולל מידע על מחירים, שעות פעילות ושירותים.</p>
            </div>
          </motion.div>
          
          {/* כרטיס 4 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group h-full"
          >
            <div className="absolute inset-0 bg-white opacity-90 group-hover:opacity-85 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-yellow-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <Lightbulb className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">התאמה אישית מלאה</h3>
              <p className="text-gray-600 text-sm leading-relaxed">התאם את הבוט לצרכים הספציפיים של העסק שלך, כולל סגנון תקשורת, לוגו, ושפה.</p>
            </div>
          </motion.div>
          
          {/* כרטיס 5 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group h-full"
          >
            <div className="absolute inset-0 bg-white opacity-90 group-hover:opacity-85 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-red-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <Star className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">חוויית לקוח משופרת</h3>
              <p className="text-gray-600 text-sm leading-relaxed">שפר את חוויית הלקוח עם מענה מהיר, אישי ומקצועי שמגביר את שביעות הרצון ואת הנאמנות לעסק.</p>
            </div>
          </motion.div>
          
          {/* כרטיס 6 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group h-full"
          >
            <div className="absolute inset-0 bg-white opacity-90 group-hover:opacity-85 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <Zap className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">אינטגרציה מלאה</h3>
              <p className="text-gray-600 text-sm leading-relaxed">התממשק עם מערכות קיימות כמו יומנים, מערכות CRM, ומערכות ניהול מלאי לחוויה חלקה ואחידה.</p>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* קישוטים נוספים */}
      <div className="absolute bottom-20 left-10 w-20 h-20 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo';
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, delay }) => {
  const colorClasses = {
    blue: {
      iconBg: 'bg-blue-100',
      hoverBorder: 'hover:border-blue-500',
      hoverShadow: 'hover:shadow-blue-500/10'
    },
    green: {
      iconBg: 'bg-green-100',
      hoverBorder: 'hover:border-green-500',
      hoverShadow: 'hover:shadow-green-500/10'
    },
    purple: {
      iconBg: 'bg-purple-100',
      hoverBorder: 'hover:border-purple-500',
      hoverShadow: 'hover:shadow-purple-500/10'
    },
    yellow: {
      iconBg: 'bg-yellow-100',
      hoverBorder: 'hover:border-yellow-500',
      hoverShadow: 'hover:shadow-yellow-500/10'
    },
    red: {
      iconBg: 'bg-red-100',
      hoverBorder: 'hover:border-red-500',
      hoverShadow: 'hover:shadow-red-500/10'
    },
    indigo: {
      iconBg: 'bg-indigo-100',
      hoverBorder: 'hover:border-indigo-500',
      hoverShadow: 'hover:shadow-indigo-500/10'
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className={`business-card bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent ${colorClasses[color].hoverBorder} ${colorClasses[color].hoverShadow}`}
    >
      <div className={`w-14 h-14 mb-5 rounded-full ${colorClasses[color].iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

export default FeaturesSection;
