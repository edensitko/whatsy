import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mail, Sparkles, ArrowRight } from 'lucide-react';

const CtaSection: React.FC = () => {

  return (
    <section className="py-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden scroll-animation mt-0 mb-0">
      {/* אלמנטים דקורטיביים */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        <div className="absolute top-40 left-10 w-20 h-20 bg-yellow-400 rounded-full mix-blend-overlay filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-40 right-10 w-16 h-16 bg-blue-300 rounded-full mix-blend-overlay filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <span className="inline-block px-5 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-4 shadow-lg backdrop-blur-sm border border-white/20">
            <Sparkles className="w-4 h-4 inline-block mr-2" /> הצטרפו למהפכה
          </span>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center mx-auto w-full">מוכנים להתחיל את המסע?</h2>
          
          <div className="w-32 h-1.5 bg-gradient-to-r from-yellow-400 to-yellow-300 mx-auto my-5 rounded-full"></div>
          
          <p className="text-xl opacity-90 mb-10 text-center max-w-2xl mx-auto">הצטרפו לאלפי עסקים שכבר משתמשים בבוט החכם שלנו ושפרו את חווית הלקוחות שלכם</p>
          
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <Link to="/register">
              <Button size="lg" className="rounded-full px-8 py-6 bg-white text-blue-700 hover:bg-yellow-300 hover:text-blue-800 transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg font-bold">
                התחל עכשיו - בחינם <ArrowRight className="w-5 h-5 mr-2 inline-block" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="rounded-full px-8 py-6 border-2 border-white/40 text-white bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg font-bold">
                <Mail className="w-5 h-5 ml-2" /> צור קשר
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 text-white/70 text-sm">
            ללא התחייבות • התחל בחינם • שדרג בכל עת
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
