export interface User {
  id: string;
  email: string;
}

export interface BusinessHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BusinessHourEntry {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface BusinessHoursType {
  sunday: BusinessHourEntry;
  monday: BusinessHourEntry;
  tuesday: BusinessHourEntry;
  wednesday: BusinessHourEntry;
  thursday: BusinessHourEntry;
  friday: BusinessHourEntry;
  saturday: BusinessHourEntry;
  [key: string]: BusinessHourEntry;
}

export interface BusinessData {
  services?: string;
  location?: string;
  email?: string;
  website?: string;
  policies?: string;
  additionalInfo?: string;
  businessHours?: BusinessHoursType;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  hours: BusinessHours | string;
  faq: FaqItem[] | string[];
  bot_id: string;
  whatsapp_number: string;
  phone_number?: string;
  created_at: Date | string;
  updated_at?: Date | string;
  prompt_template?: string;
  openai_api_key?: string; // Added for storing OpenAI API key
  owner_id?: string; // ID of the business owner
  business_data?: BusinessData; // Added for storing structured business information
  logo_url?: string; // URL to the business logo image
  hero_image_url?: string; // URL to the business hero/background image
  gallery_images?: string[]; // Array of URLs to gallery images
}

export interface AppointmentRequest {
  id: string;
  business_id: string;
  customer_phone: string;
  requested_time: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData extends LoginFormData {
  confirmPassword: string;
}

export interface BusinessFormData {
  id?: string;
  name: string;
  description: string;
  hours: string;
  faq: string[];
  whatsapp_number: string;
  phone_number?: string;
  bot_id?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  prompt_template?: string;
  openai_api_key?: string; // Added for storing OpenAI API key
  logo_url?: string; // URL to the business logo image
  hero_image_url?: string; // URL to the business hero/background image
  gallery_images?: string[]; // Array of URLs to gallery images
}
