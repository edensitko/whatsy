import { Business, AppointmentRequest } from '../types';

export const mockBusiness: Business = {
  id: 'biz-123',
  name: 'סלון יופי אלגנט',
  description: 'סלון יופי מקצועי המציע שירותי תספורת, צביעה, טיפולי פנים ומניקור',
  hours: 'ראשון-חמישי: 9:00-20:00\nשישי: 9:00-14:00\nשבת: סגור',
  faq: [
    'האם צריך לקבוע תור מראש? כן, רצוי לקבוע תור לפחות יום מראש',
    'האם יש חניה באזור? כן, יש חניון ציבורי במרחק 2 דקות הליכה',
    'האם מקבלים כרטיסי אשראי? כן, מקבלים את כל סוגי כרטיסי האשראי',
  ],
  bot_id: 'e1b2c3',
  whatsapp_number: '14155238886',
  created_at: new Date().toISOString(),
  prompt_template: 'אתה בוט עוזר לסלון יופי אלגנט. הנה מידע על העסק:\n\nתיאור: סלון יופי מקצועי המציע שירותי תספורת, צביעה, טיפולי פנים ומניקור\n\nשעות פעילות: ראשון-חמישי: 9:00-20:00\nשישי: 9:00-14:00\nשבת: סגור\n\nשאלות נפוצות:\n1. האם צריך לקבוע תור מראש? כן, רצוי לקבוע תור לפחות יום מראש\n2. האם יש חניה באזור? כן, יש חניון ציבורי במרחק 2 דקות הליכה\n3. האם מקבלים כרטיסי אשראי? כן, מקבלים את כל סוגי כרטיסי האשראי\n\nכשמבקשים ממך לקבוע תור, בקש את השם, מספר טלפון והזמן המבוקש.',
  openai_api_key: '',
};

export const mockAppointments: AppointmentRequest[] = [
  {
    id: 'app-1',
    business_id: 'biz-123',
    customer_phone: '972507654321',
    requested_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: 'app-2',
    business_id: 'biz-123',
    customer_phone: '972509876543',
    requested_time: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    status: 'approved',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
  {
    id: 'app-3',
    business_id: 'biz-123',
    customer_phone: '972501122334',
    requested_time: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
    status: 'rejected',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
];
