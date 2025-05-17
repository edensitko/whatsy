import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

// Gradient text style
const gradientTextStyle = {
  backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent',
  display: 'inline-block'
};

const TestimonialsSection: React.FC = () => {
  // מונע כפילות של הרכיב בדף
  React.useEffect(() => {
    const sections = document.querySelectorAll('.testimonials-section');
    if (sections.length > 1) {
      // אם יש יותר מאחד, מסיר את הכפילות
      sections.forEach((section, index) => {
        if (index > 0) section.remove();
      });
    }
  }, []);

  return (
    <section className="py-16 bg-gray-50 scroll-animation mt-0 mb-0 testimonials-section">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-3">המלצות לקוחות</span>
          <h2 className="text-3xl md:text-4xl font-bold text-center mx-auto w-full">
            מה <span style={gradientTextStyle}>הלקוחות שלנו</span> אומרים
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto text-center">עסקים רבים כבר נהנים מהיתרונות של הבוט החכם שלנו</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 rtl">
          <TestimonialCard 
            quote="הבוט החכם שינה לחלוטין את האופן שבו העסק שלי מתקשר עם לקוחות. הוא חוסך לי שעות רבות ביום ומאפשר לי להתמקד בצמיחת העסק."
            name="רונית כהן"
            company="סלון יופי רונית"
            initial="ר"
            color="blue"
            delay={0.1}
          />
          
          <TestimonialCard 
            quote="הלקוחות שלי מתלהבים מהיכולת לקבוע תורים בכל שעה, גם כשהמספרה סגורה. ההכנסות שלי עלו ב-30% מאז שהתחלתי להשתמש בבוט."
            name="יוסי לוי"
            company="מספרת יוסי"
            initial="י"
            color="green"
            delay={0.2}
          />
          
          <TestimonialCard 
            quote="ההשקעה בבוט החכם החזירה את עצמה תוך חודש. הבוט מטפל בשאלות נפוצות, מספק מידע על שירותים ומחירים, ומאפשר קביעת תורים ללא מאמץ."
            name="דנה אברהם"
            company="קליניקת טיפולים"
            initial="ד"
            color="purple"
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
};

interface TestimonialCardProps {
  quote: string;
  name: string;
  company: string;
  initial: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  delay: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, company, initial, color, delay }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-700'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-700'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-700'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-700'
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center mb-4">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
          ))}
        </div>
      </div>
      <p className="text-gray-700 mb-6">"{quote}"</p>
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full ${colorClasses[color].bg} flex items-center justify-center ${colorClasses[color].text} font-semibold`}>{initial}</div>
        <div className="mr-3">
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-gray-500">{company}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialsSection;
