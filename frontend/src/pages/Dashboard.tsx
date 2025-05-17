import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import BotLink from '@/components/BotLink';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Building2, Image as ImageIcon, MessageCircle, Phone, Clock, X, Upload, Camera, Edit, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { businessApi } from '@/services/apiService';
import { Business, AppointmentRequest, BusinessFormData } from '@/types';
import BusinessForm from '@/components/BusinessForm';
import AppointmentList from '@/components/AppointmentList';
import BotKnowledgeEditor from '@/components/BotKnowledgeEditor';
import WhatsAppPhoneChat from '@/components/WhatsAppPhoneChat';
import { uploadFile } from '@/services/storageService';
import { getOpenAIResponse } from '@/services/openaiService';
import { getValidFaqItems } from '@/utils/faqHelpers';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'botKnowledge' | 'whatsappChat' | 'gallery'>('whatsappChat');
  const [isEditBusinessOpen, setIsEditBusinessOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // State for gallery modal
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  
  // State for image upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Check if user is logged in and fetch business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      // Check if user is logged in
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      // Get the selected business ID from localStorage
      const selectedBusinessId = localStorage.getItem('selectedBusinessId');

      // If no business is selected, redirect to business list
      if (!selectedBusinessId) {
        navigate('/businesses');
        return;
      }

      try {
        setLoading(true);

        // Fetch business data from the backend using the API service
        const businessData = await businessApi.getById(selectedBusinessId) as Business;
        setBusiness(businessData);

        // Fetch appointments (in a real app)
        // For now, use an empty array since we don't have appointment data yet
        // TODO: Implement appointment API and fetch real data
        setAppointments([]);
        setPendingCount(0);
      } catch (err: any) {
        console.error('Error fetching business data:', err);
        setError(err.message || 'Failed to load business data');
        
        // Don't use mock data, just show the error
        toast({
          variant: 'destructive',
          title: 'שגיאה בטעינת נתוני העסק',
          description: 'אנא נסה שוב מאוחר יותר או צור קשר עם התמיכה',
        });
        
        // Redirect to business list if we can't load the business
        navigate('/businesses');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [navigate, toast]);

  const handleLogout = () => {
    logout();
    navigate('/login');

    toast({
      title: 'התנתקת בהצלחה',
      description: 'להתראות!',
    });
  };

  const handleUpdateAppointment = (appointmentId: string, status: 'pending' | 'approved' | 'rejected') => {
    // Update appointment status
    const updatedAppointments = appointments.map(appointment => {
      if (appointment.id === appointmentId) {
        return { ...appointment, status };
      }
      return appointment;
    });

    setAppointments(updatedAppointments);
    setPendingCount(updatedAppointments.filter(a => a.status === 'pending').length);

    // Show toast notification
    const statusText = status === 'approved' ? 'אושר' : status === 'rejected' ? 'נדחה' : 'ממתין';
    toast({
      title: `התור ${statusText}`,
      description: `סטטוס התור עודכן ל${statusText}`,
    });
    
    // TODO: Implement API call to update appointment status in the database
  };

  const handleUpdateBusiness = async (formData: BusinessFormData) => {
    if (!business) return;

    try {
      setLoading(true);

      // Convert business hours if needed
      let updatedFormData = { ...formData };
      
      // If business.hours is an object, convert it to string for the form
      if (business.hours && typeof business.hours !== 'string') {
        let hoursString = '';
        const hours = business.hours;
        if (hours.monday) hoursString += `Monday: ${hours.monday}\n`;
        if (hours.tuesday) hoursString += `Tuesday: ${hours.tuesday}\n`;
        if (hours.wednesday) hoursString += `Wednesday: ${hours.wednesday}\n`;
        if (hours.thursday) hoursString += `Thursday: ${hours.thursday}\n`;
        if (hours.friday) hoursString += `Friday: ${hours.friday}\n`;
        if (hours.saturday) hoursString += `Saturday: ${hours.saturday}\n`;
        if (hours.sunday) hoursString += `Sunday: ${hours.sunday}\n`;
        
        updatedFormData.hours = hoursString.trim();
      }

      // Update business on the backend using the API service
      const updatedBusiness = await businessApi.update(business.id, updatedFormData) as Business;
      setBusiness(updatedBusiness);
      setIsEditBusinessOpen(false);

      toast({
        title: 'העסק עודכן בהצלחה',
        description: 'פרטי העסק עודכנו בהצלחה',
      });
    } catch (err: any) {
      console.error('Error updating business:', err);

      toast({
        variant: 'destructive',
        title: 'שגיאה בעדכון העסק',
        description: err.message || 'לא ניתן לעדכן את העסק, אנא נסה שוב',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBotKnowledge = async (updatedKnowledge: string | Business) => {
    if (!business) return;
    
    // הצג הודעת טעינה
    const { dismiss: dismissLoadingToast, id: loadingToastId } = toast({
      title: 'מעדכן את ידע הבוט...',
      description: 'אנא המתן בזמן שאנו מעדכנים את המידע',
    });

    try {
      setLoading(true);

      let updatedBusiness: Business;
      
      if (typeof updatedKnowledge === 'string') {
        // If we just got a string, update the prompt_template
        updatedBusiness = await businessApi.update(business.id, {
          prompt_template: updatedKnowledge
        }) as Business;
      } else {
        // If we got a business object, update with that
        console.log('Updating business with structured data:', updatedKnowledge);
        
        // Make sure we're sending a clean object to Firebase
        // נקה את האובייקט מערכים לא תקינים ושדות undefined
        const businessToUpdate: Record<string, any> = {};
        
        // העתק רק את השדות הבסיסיים שאנחנו יודעים שהשרת יכול לטפל בהם
        if (updatedKnowledge.name) businessToUpdate.name = updatedKnowledge.name;
        if (updatedKnowledge.description) businessToUpdate.description = updatedKnowledge.description;
        if (updatedKnowledge.phone_number) businessToUpdate.phone_number = updatedKnowledge.phone_number;
        if (updatedKnowledge.whatsapp_number) businessToUpdate.whatsapp_number = updatedKnowledge.whatsapp_number;
        if (updatedKnowledge.prompt_template) businessToUpdate.prompt_template = updatedKnowledge.prompt_template;
        
        // טיפול מיוחד בשעות פעילות
        if (updatedKnowledge.hours) {
          // בדוק אם זה אובייקט או מחרוזת
          if (typeof updatedKnowledge.hours === 'string') {
            businessToUpdate.hours = updatedKnowledge.hours;
          } else if (typeof updatedKnowledge.hours === 'object') {
            // ודא שהאובייקט תקין
            const cleanHours: Record<string, any> = {};
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            
            days.forEach(day => {
              if (updatedKnowledge.hours[day]) {
                cleanHours[day] = updatedKnowledge.hours[day];
              } else {
                // הוסף ערך ריק כברירת מחדל
                cleanHours[day] = '';
              }
            });
            
            businessToUpdate.hours = cleanHours;
          }
        }
        
        // טיפול בשאלות נפוצות
        if (updatedKnowledge.faq && Array.isArray(updatedKnowledge.faq)) {
          // ודא שכל פריט ב-FAQ הוא מחרוזת או אובייקט תקין
          const cleanFaq = updatedKnowledge.faq
            .filter(item => {
              return item !== null && (
                typeof item === 'string' || 
                (typeof item === 'object' && 'question' in item)
              );
            })
            .map(item => {
              if (typeof item === 'string') {
                return { question: item, answer: 'אין תשובה זמינה' };
              } else if (typeof item === 'object' && 'question' in item) {
                return {
                  question: item.question || '',
                  answer: item.answer || 'אין תשובה זמינה'
                };
              }
              return null;
            })
            .filter(Boolean);
          
          businessToUpdate.faq = cleanFaq;
        }
        
        // טיפול בנתוני עסק נוספים
        if (updatedKnowledge.business_data && typeof updatedKnowledge.business_data === 'object') {
          businessToUpdate.business_data = updatedKnowledge.business_data;
        }
        
        console.log('Clean business object to update:', businessToUpdate);
        
        try {
          updatedBusiness = await businessApi.update(business.id, businessToUpdate) as Business;
        } catch (updateError: any) {
          console.error('Failed to update business via API:', updateError);
          
          // נסה לעדכן רק את שדות הליבה אם העדכון המלא נכשל
          const coreFields = {
            name: businessToUpdate.name,
            description: businessToUpdate.description,
            prompt_template: businessToUpdate.prompt_template
          };
          
          console.log('Retrying with core fields only:', coreFields);
          updatedBusiness = await businessApi.update(business.id, coreFields) as Business;
          
          // הצג הודעה שרק חלק מהשדות עודכנו
          toast({
            // 'warning' אינו חלק מהסוגים המוגדרים, נשתמש ב-'default' עם אייקון אזהרה
            variant: 'default',
            title: '⚠️ עדכון חלקי',
            description: 'רק שדות הליבה עודכנו. חלק מהמידע לא נשמר בגלל שגיאה.',
          });
        }
      }
      
      // הסר את הודעת הטעינה
      dismissLoadingToast();
      
      // עדכן את המצב המקומי רק אם העדכון הצליח
      if (updatedBusiness) {
        setBusiness(updatedBusiness);

        toast({
          title: 'ידע הבוט עודכן בהצלחה',
          description: 'הבוט יתחיל להשתמש בידע החדש בשיחות הבאות',
        });
      }
    } catch (err: any) {
      console.error('Error updating bot knowledge:', err);
      
      // הסר את הודעת הטעינה גם במקרה של שגיאה
      dismissLoadingToast();

      // הצג הודעת שגיאה מפורטת יותר
      let errorMessage = 'לא ניתן לעדכן את ידע הבוט, אנא נסה שוב';
      
      if (err.message) {
        if (err.message.includes('Failed to fetch')) {
          errorMessage = 'לא ניתן להתחבר לשרת. בדוק את חיבור האינטרנט שלך ונסה שוב.';
        } else if (err.message.includes('500')) {
          errorMessage = 'שגיאה בשרת. צוות הפיתוח קיבל התראה על הבעיה ויטפל בה בהקדם.';
        } else {
          errorMessage = `שגיאה: ${err.message}`;
        }
      }

      toast({
        variant: 'destructive',
        title: 'שגיאה בעדכון ידע הבוט',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToBusinessList = () => {
    navigate('/businesses');
  };

  // Handle sending a message to the WhatsApp chat
  const handleSendMessage = async (message: string): Promise<string> => {
    try {
      // Check if we have a business
      if (!business) {
        return "מצטער, לא הצלחתי למצוא מידע על העסק הזה.";
      }

      // בדיקה אם זו הודעת שלום פשוטה
      const lowerMessage = message.toLowerCase();
      if (lowerMessage === 'שלום' || lowerMessage === 'hi' || lowerMessage === 'hello') {
        return `שלום! אני העוזר הוירטואלי של ${business.name}. איך אוכל לעזור לך היום?`;
      }
      
      // בדיקה אם זו שאלה על שעות פעילות
      if (lowerMessage.includes('שעות') || lowerMessage.includes('פתוח')) {
        // הכן את שעות הפעילות מנתוני העסק האמיתיים
        let hoursText = '';
        let hoursFound = false;
        
        // בדוק אם יש שעות פעילות בשדה hours
        if (business.hours) {
          if (typeof business.hours === 'string') {
            hoursText = business.hours;
            hoursFound = true;
          } else {
            if (business.hours.sunday || business.hours.monday || business.hours.tuesday || 
                business.hours.wednesday || business.hours.thursday || business.hours.friday || 
                business.hours.saturday) {
              
              if (business.hours.sunday) hoursText += `יום ראשון: ${business.hours.sunday}\n`;
              if (business.hours.monday) hoursText += `יום שני: ${business.hours.monday}\n`;
              if (business.hours.tuesday) hoursText += `יום שלישי: ${business.hours.tuesday}\n`;
              if (business.hours.wednesday) hoursText += `יום רביעי: ${business.hours.wednesday}\n`;
              if (business.hours.thursday) hoursText += `יום חמישי: ${business.hours.thursday}\n`;
              if (business.hours.friday) hoursText += `יום שישי: ${business.hours.friday}\n`;
              if (business.hours.saturday) hoursText += `יום שבת: ${business.hours.saturday}\n`;
              hoursFound = true;
            }
          }
        }
        
        // אם לא מצאנו שעות פעילות בשדה hours, נסה לחפש ב-prompt_template
        if (!hoursFound && business.prompt_template) {
          const promptTemplate = business.prompt_template;
          
          // חפש את השעות ב-prompt_template
          if (promptTemplate.includes('שעות פעילות')) {
            // נסה לחלץ את שעות הפעילות מה-prompt_template
            const hoursSection = promptTemplate.split('שעות פעילות')[1];
            if (hoursSection) {
              // נסה לחלץ את השעות מהקטע
              const hourLines = hoursSection.split('\n')
                .filter(line => line.includes('יום') && (line.includes(':') || line.includes('-')))
                .slice(0, 7); // קח רק את 7 השורות הראשונות שמכילות ימים
              
              if (hourLines.length > 0) {
                hoursText = hourLines.join('\n');
                hoursFound = true;
              }
            }
          }
        }
        
        // אם עדיין לא מצאנו שעות פעילות, השתמש בהודעת ברירת מחדל
        if (!hoursFound) {
          hoursText = 'מידע על שעות פעילות אינו זמין כרגע.';
        }
        
        // אם מצאנו שעות פעילות, נשתמש ב-OpenAI לקבלת תשובה מפורטת
        if (hoursFound) {
          try {
            const systemPrompt = `אתה עוזר וירטואלי של ${business.name}. הנה שעות הפעילות של העסק:

${hoursText}

חשוב: ענה רק על הימים שנשאלת עליהם בצורה ממוקדת וקצרה. אם נשאלת על יום ספציפי, ענה רק על אותו יום. אם נשאלת על כל השעות, תן את המידע המלא.`;
            
            const response = await getOpenAIResponse(systemPrompt, message);
            return response;
          } catch (error) {
            console.error('Error getting hours response from OpenAI:', error);
            return `שעות הפעילות של ${business.name}:\n${hoursText}`;
          }
        } else {
          // אם לא מצאנו שעות פעילות, נשתמש ב-OpenAI לקבלת תשובה כללית
          try {
            // הכן את המידע על העסק
            const businessInfo: any = {
              name: business.name,
              description: business.description || ''
            };
            
            // הוסף מידע נוסף מה-business_data אם קיים
            if (business.business_data) {
              businessInfo.additionalInfo = business.business_data.additionalInfo || '';
            }
            
            const systemPrompt = `אתה עוזר וירטואלי של ${business.name}. הנה מידע על העסק:

${business.description}

המשתמש שאל על שעות הפעילות של העסק, אבל אין לנו מידע מדויק על שעות הפעילות. הצע למשתמש ליצור קשר ישיר עם העסק כדי לקבל מידע מדויק.`;
            
            const response = await getOpenAIResponse(systemPrompt, message);
            return response;
          } catch (error) {
            console.error('Error getting general response from OpenAI:', error);
            return `מצטער, אין לי מידע מדויק על שעות הפעילות של ${business.name}. אני ממליץ ליצור קשר ישיר עם העסק כדי לקבל את המידע המדויק ביותר.`;
          }
        }
      }
      
      // בדיקה אם השאלה מתאימה לאחת השאלות הנפוצות
      if (business.faq) {
        // השתמש בפונקציית העזר לקבלת שאלות נפוצות תקינות
        const validFaqItems = getValidFaqItems(business.faq);
        
        console.log('Valid FAQ items:', validFaqItems);
        
        if (validFaqItems && validFaqItems.length > 0) {
          // חפש התאמה מדויקת יותר בין השאלה לשאלות הנפוצות
          // נשתמש במערך של מילות מפתח מהשאלה
          const messageKeywords = lowerMessage.split(/\s+/).filter(word => word.length > 3);
          
          // דירוג התאמות לפי מספר מילות מפתח שמופיעות
          const matches = validFaqItems.map(faqItem => {
            const questionLower = faqItem.question.toLowerCase();
            const matchCount = messageKeywords.filter(keyword => 
              questionLower.includes(keyword)
            ).length;
            return { faqItem, matchCount };
          }).filter(match => match.matchCount > 0);
          
          // מיון לפי מספר התאמות בסדר יורד
          matches.sort((a, b) => b.matchCount - a.matchCount);
          
          // אם יש התאמה טובה, החזר את התשובה
          if (matches.length > 0 && matches[0].matchCount >= 2) {
            console.log(`FAQ match found: ${matches[0].faqItem.question} (score: ${matches[0].matchCount})`);
            return matches[0].faqItem.answer;
          }
        }
      }
      
      // השתמש ב-OpenAI API לקבלת תשובה
      try {
        // הכן את המידע על העסק מהנתונים האמיתיים ב-Firebase
        const businessInfo: any = {
          name: business.name,
          description: business.description || '',
          phone: business.phone_number || '',
          whatsapp: business.whatsapp_number || '',
        };
        
        // הוסף מידע נוסף מה-business_data אם קיים
        if (business.business_data) {
          if (business.business_data.location) businessInfo.address = business.business_data.location;
          if (business.business_data.email) businessInfo.email = business.business_data.email;
          if (business.business_data.website) businessInfo.website = business.business_data.website;
          if (business.business_data.services) businessInfo.services = business.business_data.services;
          if (business.business_data.policies) businessInfo.policies = business.business_data.policies;
          if (business.business_data.additionalInfo) businessInfo.additionalInfo = business.business_data.additionalInfo;
        }
        
        // הוסף שעות פעילות אם קיימות
        if (business.hours) {
          if (typeof business.hours === 'string') {
            businessInfo.hours = business.hours;
          } else {
            let hoursText = '';
            if (business.hours.sunday) hoursText += `יום ראשון: ${business.hours.sunday}\n`;
            if (business.hours.monday) hoursText += `יום שני: ${business.hours.monday}\n`;
            if (business.hours.tuesday) hoursText += `יום שלישי: ${business.hours.tuesday}\n`;
            if (business.hours.wednesday) hoursText += `יום רביעי: ${business.hours.wednesday}\n`;
            if (business.hours.thursday) hoursText += `יום חמישי: ${business.hours.thursday}\n`;
            if (business.hours.friday) hoursText += `יום שישי: ${business.hours.friday}\n`;
            if (business.hours.saturday) hoursText += `יום שבת: ${business.hours.saturday}\n`;
            businessInfo.hours = hoursText.trim();
          }
        }
        
        // הוסף שאלות נפוצות אם קיימות
        if (business.faq) {
          const validFaqItems = getValidFaqItems(business.faq);
          if (validFaqItems && validFaqItems.length > 0) {
            businessInfo.faq = validFaqItems.map(item => `שאלה: ${item.question}\nתשובה: ${item.answer}`);
            console.log(`Added ${validFaqItems.length} FAQ items to the prompt`);
          }
        }
        
        // הוסף מידע נוסף על העסק אם קיים
        if (business.business_data) {
          businessInfo.additional_data = business.business_data;
          console.log('Added additional business data to the prompt');
        }
        
        // הוסף תבנית prompt מותאמת אם קיימת
        if (business.prompt_template && business.prompt_template.trim() !== '') {
          businessInfo.prompt_template = business.prompt_template;
          console.log('Using custom prompt template from business data');
        }
        
        // הכן את השאלה למודל
        let prompt = message;
        
        // אם יש תבנית prompt מותאמת, השתמש בה כחלק מהשאלה
        if (businessInfo.prompt_template) {
          prompt = `${message}\n\nהערה למודל: השתמש בהנחיות הבאות בעת מתן תשובה:\n${businessInfo.prompt_template}`;
        } else {
          // הוסף הנחיות ברירת מחדל
          prompt = `${message}\n\nהערה למודל: ענה בעברית בצורה מנומסת וקצרה. אל תמציא מידע שלא סופק לך. אם אתה לא יודע את התשובה, אמור זאת בפשטות.`;
        }
        
        console.log('Sending request to OpenAI with business info:', businessInfo);
        
        // קבל תשובה מ-OpenAI עם כל המידע על העסק
        const response = await getOpenAIResponse({
          prompt: prompt,
          businessInfo: businessInfo
        });
        
        return response;
      } catch (error) {
        console.error('Error getting response from OpenAI:', error);
        
        // בדוק אם השגיאה קשורה למפתח API
        if (error instanceof Error) {
          if (error.message.includes('API key')) {
            toast({
              variant: 'destructive',
              title: 'שגיאת מפתח API',
              description: 'יש בעיה עם מפתח ה-API של OpenAI. אנא בדוק את ההגדרות.',
            });
            return `שגיאת מפתח API: לא ניתן להתחבר ל-OpenAI. אנא פנה למנהל המערכת.`;
          } else if (error.message.includes('timeout') || error.message.includes('network')) {
            toast({
              variant: 'destructive',
              title: 'שגיאת תקשורת',
              description: 'יש בעיה בהתחברות לשרת. אנא נסה שוב מאוחר יותר.',
            });
            return `יש בעיה בהתחברות לשרת. אני העוזר הווירטואלי של ${business.name}. אשמח לענות על שאלות נפוצות או לתת מידע בסיסי על העסק.`;
          } else if (error.message.includes('rate limit')) {
            toast({
              variant: 'destructive',
              title: 'חריגת מגבלת שימוש',
              description: 'חרגנו ממגבלת השימוש ב-API. אנא נסה שוב מאוחר יותר.',
            });
            return `חרגנו ממגבלת השימוש בשירות. אנא נסה שוב מאוחר יותר.`;
          }
        }
        
        // נסה להשתמש במידע הקיים על העסק כדי לתת תשובה בסיסית
        let fallbackResponse = `תודה על הודעתך. אני העוזר הווירטואלי של ${business.name}.`;
        
        // בדוק אם השאלה מתייחסת למידע שיש לנו
        if (lowerMessage.includes('שעות')) {
          let hoursInfo = '';
          let hoursFound = false;
          
          // בדוק אם יש שעות פעילות בשדה hours
          if (business.hours) {
            if (typeof business.hours === 'string') {
              hoursInfo = business.hours;
              hoursFound = true;
            } else {
              if (business.hours.sunday || business.hours.monday || business.hours.tuesday || 
                  business.hours.wednesday || business.hours.thursday || business.hours.friday || 
                  business.hours.saturday) {
                
                if (business.hours.sunday) hoursInfo += `יום ראשון: ${business.hours.sunday}\n`;
                if (business.hours.monday) hoursInfo += `יום שני: ${business.hours.monday}\n`;
                if (business.hours.tuesday) hoursInfo += `יום שלישי: ${business.hours.tuesday}\n`;
                if (business.hours.wednesday) hoursInfo += `יום רביעי: ${business.hours.wednesday}\n`;
                if (business.hours.thursday) hoursInfo += `יום חמישי: ${business.hours.thursday}\n`;
                if (business.hours.friday) hoursInfo += `יום שישי: ${business.hours.friday}\n`;
                if (business.hours.saturday) hoursInfo += `יום שבת: ${business.hours.saturday}\n`;
                hoursFound = true;
              }
            }
          }
          
          // אם לא מצאנו שעות פעילות בשדה hours, נסה לחפש ב-prompt_template
          if (!hoursFound && business.prompt_template) {
            const promptTemplate = business.prompt_template;
            
            // חפש את השעות ב-prompt_template במספר פורמטים שונים
            const hoursKeywords = ['שעות פעילות', 'Business Hours', 'Opening Hours', 'שעות'];
            
            // נסה למצוא את הקטע עם שעות הפעילות
            let hoursSection = '';
            for (const keyword of hoursKeywords) {
              if (promptTemplate.includes(keyword)) {
                const sections = promptTemplate.split(keyword);
                if (sections.length > 1) {
                  hoursSection = sections[1].split('##')[0]; // קח את החלק עד הכותרת הבאה
                  if (hoursSection) break;
                }
              }
            }
            
            if (hoursSection) {
              // נסה לחלץ את השעות מהקטע
              const allLines = hoursSection.split('\n');
              
              // חפש שורות שמכילות ימים ושעות
              const hourLines = allLines
                .filter(line => {
                  // בדוק אם השורה מכילה יום בשבוע ומספרים שנראים כמו שעות
                  return (line.includes('יום') || 
                          line.includes('Sunday') || line.includes('Monday') || 
                          line.includes('Tuesday') || line.includes('Wednesday') || 
                          line.includes('Thursday') || line.includes('Friday') || 
                          line.includes('Saturday')) && 
                         (line.includes(':') || line.includes('-') || /\d{1,2}[:.][0-9]{2}/.test(line));
                })
                .map(line => line.trim())
                .filter(line => line.length > 5) // הסר שורות קצרות מדי
                .slice(0, 7); // קח רק את 7 השורות הראשונות שמכילות ימים
              
              console.log('Found hour lines in prompt_template:', hourLines);
              
              if (hourLines.length > 0) {
                hoursInfo = hourLines.join('\n');
                hoursFound = true;
              }
            }
          }
          
          if (hoursFound) {
            fallbackResponse += `\n\nשעות הפעילות שלנו:\n${hoursInfo}`;
          } else {
            fallbackResponse += `\n\nמידע על שעות פעילות אינו זמין כרגע.`;
          }
        } else if (lowerMessage.includes('טלפון') && business.phone_number) {
          fallbackResponse += `\n\nהטלפון שלנו: ${business.phone_number}`;
        } else if (lowerMessage.includes('כתובת') && business.business_data?.location) {
          fallbackResponse += `\n\nהכתובת שלנו: ${business.business_data.location}`;
        }
        
        fallbackResponse += `\n\nאיך אוכל לסייע לך היום?`;
        return fallbackResponse;
      }
    } catch (error) {
      console.error('Error in handleChatMessage:', error);
      toast({
        variant: 'destructive',
        title: 'שגיאה בעיבוד ההודעה',
        description: 'אירעה שגיאה בעיבוד ההודעה שלך. אנא נסה שוב.',
      });
      return "מצטער, אירעה שגיאה בעיבוד ההודעה שלך. אנא נסה שוב מאוחר יותר.";
    }
  };

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLogout={handleLogout} />
        <main className="flex-1 container mx-auto p-4 py-8">
          <div className="flex justify-center items-center h-full">
            {loading ? (
              <p className="text-xl">טוען נתוני עסק...</p>
            ) : (
              <div className="text-center">
                <p className="text-xl mb-4">לא נמצא עסק</p>
                <Button onClick={handleBackToBusinessList}>חזרה לרשימת העסקים</Button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Function to handle opening the gallery modal
  const openGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  // Function to navigate through gallery images
  const navigateGallery = (direction: 'next' | 'prev') => {
    if (!business.gallery_images || business.gallery_images.length === 0) return;
    
    if (direction === 'next') {
      setSelectedImageIndex((prev) => 
        prev === business.gallery_images!.length - 1 ? 0 : prev + 1
      );
    } else {
      setSelectedImageIndex((prev) => 
        prev === 0 ? business.gallery_images!.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLogout={handleLogout} />

      {/* Hero Section with Business Logo and Background */}
      <div className="relative w-full">
        <div 
          className="w-full h-72 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden"
          style={business.hero_image_url ? { 
            backgroundImage: `url(${business.hero_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="container mx-auto h-full relative z-10 flex items-center justify-center px-4">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white">{business.name}</h1>
              <p className="text-white text-opacity-90 mt-4 max-w-2xl mx-auto">{business.description}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto p-4 pb-8">
        <div className="flex justify-between items-center my-8 rtl">
          <div className="hidden sm:block">
            <h2 className="text-xl font-semibold">ניהול העסק</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditBusinessOpen(true)}>
              ערוך עסק
            </Button>
            <Button variant="outline" onClick={handleBackToBusinessList}>
              חזרה לרשימת העסקים
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              התנתק
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 rtl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md rtl">
            <h2 className="text-lg font-semibold mb-2">קישור לבוט</h2>
            <p className="text-gray-600 mb-4">שתף את הקישור הזה עם לקוחות כדי שיוכלו לדבר עם הבוט שלך</p>
            <BotLink botId={business.bot_id} whatsappNumber={business.whatsapp_number} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md rtl">
            <h2 className="text-lg font-semibold mb-2">תורים ממתינים</h2>
            <p className="text-gray-600 mb-4">יש לך {pendingCount} תורים ממתינים לאישור</p>
            <Button 
              variant={activeTab === 'appointments' ? 'default' : 'outline'}
              onClick={() => setActiveTab('appointments')}
              className="w-full"
            >
              צפה בתורים
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md rtl">
            <h2 className="text-lg font-semibold mb-2">ידע הבוט</h2>
            <p className="text-gray-600 mb-4">ערוך את הידע והיכולות של הבוט שלך</p>
            <Button 
              variant={activeTab === 'botKnowledge' ? 'default' : 'outline'}
              onClick={() => setActiveTab('botKnowledge')}
              className="w-full"
            >
              ערוך ידע
            </Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md rtl">
            <h2 className="text-lg font-semibold mb-2">צ'אט WhatsApp</h2>
            <p className="text-gray-600 mb-4">בדוק איך הבוט שלך מגיב להודעות</p>
            <Button 
              variant={activeTab === 'whatsappChat' ? 'default' : 'outline'}
              onClick={() => setActiveTab('whatsappChat')}
              className="w-full"
            >
              פתח צ'אט
            </Button>
          </div>
          
          {business.gallery_images && business.gallery_images.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md rtl">
              <h2 className="text-lg font-semibold mb-2">גלריית תמונות</h2>
              <p className="text-gray-600 mb-4">הצג את גלריית התמונות של העסק</p>
              <Button 
                variant={activeTab === 'gallery' ? 'default' : 'outline'}
                onClick={() => setActiveTab('gallery')}
                className="w-full"
              >
                הצג גלריה
              </Button>
            </div>
          )}
        </div>

        {activeTab === 'appointments' ? (
          <div className="bg-white p-6 rounded-lg shadow-md rtl">
            <h2 className="text-xl font-semibold mb-4">ניהול תורים</h2>
            <AppointmentList 
              appointments={appointments} 
              onUpdateStatus={handleUpdateAppointment} 
            />
          </div>
        ) : activeTab === 'botKnowledge' ? (
          <div className="bg-white p-6 rounded-lg shadow-md rtl">
            <h2 className="text-xl font-semibold mb-4">עריכת ידע הבוט</h2>
            <BotKnowledgeEditor 
              business={business}
              onSave={handleUpdateBotKnowledge}
              isLoading={loading}
            />
          </div>
        ) : activeTab === 'gallery' && business.gallery_images && business.gallery_images.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 rtl">גלריית תמונות</h2>
            <p className="text-gray-600 mb-6 rtl">
              התמונות הבאות מציגות את העסק והשירותים שלך. לחץ על תמונה כדי להגדיל אותה.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
              {business.gallery_images.map((imageUrl, index) => (
                <div 
                  key={index} 
                  className="relative cursor-pointer overflow-hidden rounded-md border border-gray-200 aspect-square group"
                  onClick={() => openGallery(index)}
                >
                  <img 
                    src={imageUrl} 
                    alt={`תמונת גלריה ${index + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 rtl">צ'אט WhatsApp</h2>
            <p className="text-gray-600 mb-6 rtl">
              זהו סימולטור של הבוט שלך. נסה לשלוח הודעות שונות כדי לראות איך הבוט מגיב.
            </p>
            <div className="flex justify-center">
              <WhatsAppPhoneChat
                businessName={business.name}
                botAvatar="/bot-avatar.png"
                onSendMessage={handleSendMessage}
                initialMessages={[
                  {
                    id: 'welcome',
                    text: `שלום! אני הבוט של ${business.name}. איך אוכל לעזור לך היום?`,
                    sender: 'bot',
                    timestamp: new Date(),
                  },
                ]}
                className="shadow-xl max-w-md w-full"
              />
            </div>
          </div>
        )}
      </main>

      {/* Gallery Modal */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black">
          <div className="relative h-[80vh] flex items-center justify-center">
            {/* Close button */}
            <button 
              onClick={() => setIsGalleryOpen(false)}
              className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Navigation buttons */}
            {business.gallery_images && business.gallery_images.length > 1 && (
              <>
                <button 
                  onClick={() => navigateGallery('prev')}
                  className="absolute left-4 z-40 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => navigateGallery('next')}
                  className="absolute right-4 z-40 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Image */}
            {business.gallery_images && business.gallery_images.length > 0 && (
              <img 
                src={business.gallery_images[selectedImageIndex]} 
                alt={`תמונת גלריה ${selectedImageIndex + 1}`} 
                className="max-h-full max-w-full object-contain"
              />
            )}
            
            {/* Image counter */}
            {business.gallery_images && business.gallery_images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {selectedImageIndex + 1} / {business.gallery_images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditBusinessOpen} onOpenChange={setIsEditBusinessOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center rtl">ערוך פרטי עסק</DialogTitle>
          </DialogHeader>
          <BusinessForm 
            onSubmit={handleUpdateBusiness} 
            isSubmitting={loading}
            initialData={convertBusinessToFormData(business)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to convert Business to BusinessFormData
const convertBusinessToFormData = (business: Business): BusinessFormData => {
  // Convert hours from BusinessHours to string if needed
  let hoursString = '';
  if (business.hours && typeof business.hours !== 'string') {
    const hours = business.hours;
    if (hours.monday) hoursString += `Monday: ${hours.monday}\n`;
    if (hours.tuesday) hoursString += `Tuesday: ${hours.tuesday}\n`;
    if (hours.wednesday) hoursString += `Wednesday: ${hours.wednesday}\n`;
    if (hours.thursday) hoursString += `Thursday: ${hours.thursday}\n`;
    if (hours.friday) hoursString += `Friday: ${hours.friday}\n`;
    if (hours.saturday) hoursString += `Saturday: ${hours.saturday}\n`;
    if (hours.sunday) hoursString += `Sunday: ${hours.sunday}\n`;
  } else if (typeof business.hours === 'string') {
    hoursString = business.hours;
  }

  // Convert faq from FaqItem[] to string[] if needed
  let faqStrings: string[] = [];
  if (business.faq && business.faq.length > 0) {
    if (business.faq.length > 0 && typeof business.faq[0] !== 'string') {
      // It's an array of FaqItem objects
      faqStrings = business.faq.map(item => {
        if (typeof item === 'object' && item !== null && 
            'question' in item && 'answer' in item) {
          return item.question;
        }
        return '';
      }).filter(q => q !== '');
    } else {
      // It's already an array of strings
      faqStrings = business.faq as string[];
    }
  }

  return {
    id: business.id,
    name: business.name,
    description: business.description,
    hours: hoursString.trim(),
    faq: faqStrings,
    whatsapp_number: business.whatsapp_number,
    phone_number: business.phone_number,
    bot_id: business.bot_id,
    prompt_template: business.prompt_template,
    openai_api_key: business.openai_api_key
  };
};

export default Dashboard;
