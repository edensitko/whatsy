import React, { useState, useRef, useEffect } from 'react';
import { getOpenAIApiKey } from '@/services/apiKeyService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Building2, Clock, Phone, MessageSquare, Save, Plus, Trash2, Image, Upload, X } from 'lucide-react';
import { BusinessFormData } from '@/types';
import { Badge } from "@/components/ui/badge";
import { uploadFile, uploadMultipleFiles } from '@/services/storageService';

interface BusinessFormProps {
  initialData?: Partial<BusinessFormData>;
  onSubmit: (data: BusinessFormData) => void;
  isSubmitting?: boolean;
}

const BusinessForm = ({ initialData, onSubmit, isSubmitting = false }: BusinessFormProps) => {
  const [formData, setFormData] = useState<BusinessFormData>({
    id: initialData?.id || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    hours: initialData?.hours || '',
    faq: initialData?.faq || [''],
    whatsapp_number: initialData?.whatsapp_number || '',
    phone_number: initialData?.phone_number || initialData?.whatsapp_number || '',
    prompt_template: initialData?.prompt_template || '',
    bot_id: initialData?.bot_id || '',
    created_at: initialData?.created_at,
    updated_at: initialData?.updated_at,
    logo_url: initialData?.logo_url || '',
    hero_image_url: initialData?.hero_image_url || '',
    gallery_images: initialData?.gallery_images || []
  });
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo_url || null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(initialData?.hero_image_url || null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initialData?.gallery_images || []);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const [activeTab, setActiveTab] = useState("basic");

  // Fetch OpenAI API key on component mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const apiKey = await getOpenAIApiKey();
        if (apiKey && !formData.openai_api_key) {
          setFormData(prev => ({ ...prev, openai_api_key: apiKey }));
        }
      } catch (error) {
        console.error('Error fetching OpenAI API key:', error);
      }
    };
    
    fetchApiKey();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'logo' | 'hero' | 'gallery') => {
    if (imageType === 'gallery') {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        // Create preview URLs for the images
        const newPreviews: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const previewUrl = URL.createObjectURL(files[i]);
          newPreviews.push(previewUrl);
        }
        
        // Add the new previews to the existing ones
        const updatedPreviews = [...galleryPreviews, ...newPreviews];
        setGalleryPreviews(updatedPreviews);
        
        // Convert FileList to Array for easier handling
        const fileArray = Array.from(files);
        
        // If we have a business ID, upload the files to Firebase
        if (formData.id) {
          // Upload the files to Firebase Storage with progress tracking
          const businessId = formData.id;
          const uploadedUrls = await uploadMultipleFiles(
            fileArray, 
            `businesses/${businessId}/gallery`,
            (progress) => setUploadProgress(progress)
          );
          
          // Update the form data with the new gallery images
          const updatedGalleryImages = [...(formData.gallery_images || []), ...uploadedUrls];
          setFormData(prev => ({ ...prev, gallery_images: updatedGalleryImages }));
        } else {
          // If we don't have a business ID yet, we'll just store the files temporarily
          // and upload them when the form is submitted
          setFormData(prev => ({ 
            ...prev, 
            gallery_images: [...(prev.gallery_images || []), ...newPreviews] 
          }));
        }
      } catch (error) {
        console.error('Error uploading gallery images:', error);
        alert('שגיאה בהעלאת התמונות. אנא נסה שנית.');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        // Clear the input field to allow uploading the same files again
        if (galleryInputRef.current) galleryInputRef.current.value = '';
      }
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      
      // Set a temporary preview immediately for better UX
      if (imageType === 'logo') {
        setLogoPreview(previewUrl);
      } else {
        setHeroImagePreview(previewUrl);
      }
      
      // If we have a business ID, upload the file to Firebase
      if (formData.id) {
        const businessId = formData.id;
        const path = `businesses/${businessId}/${imageType === 'logo' ? 'logo' : 'hero'}`;
        
        // Upload with progress tracking
        const downloadURL = await uploadFile(
          file, 
          path, 
          (progress) => setUploadProgress(progress)
        );
        
        // Update with the actual download URL
        if (imageType === 'logo') {
          setLogoPreview(downloadURL);
          setFormData(prev => ({ ...prev, logo_url: downloadURL }));
        } else {
          setHeroImagePreview(downloadURL);
          setFormData(prev => ({ ...prev, hero_image_url: downloadURL }));
        }
      } else {
        // If we don't have a business ID yet, we'll just store the preview URL temporarily
        // and upload the file when the form is submitted
        if (imageType === 'logo') {
          setFormData(prev => ({ ...prev, logo_url: previewUrl }));
        } else {
          setFormData(prev => ({ ...prev, hero_image_url: previewUrl }));
        }
      }
    } catch (error) {
      console.error(`Error uploading ${imageType} image:`, error);
      alert(`שגיאה בהעלאת תמונת ${imageType === 'logo' ? 'הלוגו' : 'הרקע'}. אנא נסה שנית.`);
      
      // Clear the preview on error
      if (imageType === 'logo') {
        setLogoPreview(null);
        setFormData(prev => ({ ...prev, logo_url: '' }));
      } else {
        setHeroImagePreview(null);
        setFormData(prev => ({ ...prev, hero_image_url: '' }));
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Clear the input field to allow uploading the same file again
      if (imageType === 'logo' && logoInputRef.current) {
        logoInputRef.current.value = '';
      } else if (imageType === 'hero' && heroImageInputRef.current) {
        heroImageInputRef.current.value = '';
      }
    }
  };
  
  const removeGalleryImage = (index: number) => {
    // Show confirmation before removing
    if (!confirm('האם אתה בטוח שברצונך למחוק את התמונה?')) {
      return;
    }
    
    // Update the previews array
    const updatedPreviews = [...galleryPreviews];
    updatedPreviews.splice(index, 1);
    setGalleryPreviews(updatedPreviews);
    
    // Update the form data
    const updatedGalleryImages = [...(formData.gallery_images || [])];
    updatedGalleryImages.splice(index, 1);
    setFormData(prev => ({ ...prev, gallery_images: updatedGalleryImages }));
    
    // Show success message
    alert('התמונה הוסרה בהצלחה');
  };
  
  const handleFaqChange = (index: number, value: string) => {
    const newFaq = [...formData.faq];
    newFaq[index] = value;
    setFormData(prev => ({ ...prev, faq: newFaq }));
  };
  
  const addFaqField = () => {
    setFormData(prev => ({ ...prev, faq: [...prev.faq, ''] }));
  };
  
  const removeFaqField = (index: number) => {
    const newFaq = [...formData.faq];
    newFaq.splice(index, 1);
    setFormData(prev => ({ ...prev, faq: newFaq }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty FAQs
    const filteredData = {
      ...formData,
      faq: formData.faq.filter(item => item.trim() !== '')
    };
    
    // Log the data being submitted to help with debugging
    console.log('Submitting business data with ID:', filteredData.id);
    
    onSubmit(filteredData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>פרטי עסק</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span>תמונות</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span>גלריה</span>
            <Badge variant="secondary" className="ml-1">{galleryPreviews.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>פרטי קשר</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>שאלות נפוצות</span>
            <Badge variant="secondary" className="ml-1">{formData.faq.filter(f => f.trim() !== '').length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl">פרטי העסק הבסיסיים</CardTitle>
              <CardDescription className="rtl">
                הזן את המידע הבסיסי על העסק שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="rtl">שם העסק</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="rtl"
                  placeholder="הזן את שם העסק שלך"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="rtl">תיאור העסק</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="rtl min-h-[120px]"
                  placeholder="תאר את העסק שלך, השירותים שאתה מציע, ומה מייחד אותך"
                />
                <p className="text-xs text-muted-foreground rtl">
                  תיאור טוב יעזור לבוט להבין את העסק שלך ולספק מידע מדויק יותר ללקוחות.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hours" className="rtl flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  שעות פעילות
                </Label>
                <Textarea
                  id="hours"
                  name="hours"
                  value={formData.hours}
                  onChange={handleChange}
                  className="rtl"
                  rows={3}
                  placeholder="ראשון-חמישי: 9:00-18:00&#10;שישי: 9:00-14:00&#10;שבת: סגור"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl">תמונות העסק</CardTitle>
              <CardDescription className="rtl">
                העלה תמונת לוגו ותמונת רקע לעסק שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isUploading && (
                <div className="mb-4">
                  <p className="text-sm text-center mb-2">מעלה תמונה...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <Label htmlFor="logo_upload" className="rtl flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  לוגו העסק
                </Label>
                
                <div className="flex flex-col items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img 
                        src={logoPreview} 
                        alt="לוגו העסק" 
                        className="w-32 h-32 object-contain border rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                        onClick={() => {
                          setLogoPreview(null);
                          setFormData(prev => ({ ...prev, logo_url: '' }));
                          if (logoInputRef.current) logoInputRef.current.value = '';
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">לחץ להעלאת לוגו</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF עד 2MB</p>
                    </div>
                  )}
                  
                  <input
                    ref={logoInputRef}
                    type="file"
                    id="logo_upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                  />
                </div>
              </div>
              
              <div className="space-y-4 mt-8">
                <Label htmlFor="hero_image_upload" className="rtl flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  תמונת רקע (הירו)
                </Label>
                
                <div className="flex flex-col items-center gap-4">
                  {heroImagePreview ? (
                    <div className="relative">
                      <img 
                        src={heroImagePreview} 
                        alt="תמונת רקע" 
                        className="w-full h-40 object-cover border rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 rounded-full w-6 h-6 p-0"
                        onClick={() => {
                          setHeroImagePreview(null);
                          setFormData(prev => ({ ...prev, hero_image_url: '' }));
                          if (heroImageInputRef.current) heroImageInputRef.current.value = '';
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center w-full cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => heroImageInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">לחץ להעלאת תמונת רקע</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF עד 5MB</p>
                    </div>
                  )}
                  
                  <input
                    ref={heroImageInputRef}
                    type="file"
                    id="hero_image_upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'hero')}
                  />
                </div>
                <p className="text-xs text-muted-foreground rtl">
                  תמונת הרקע תוצג בראש דף הדשבורד של העסק שלך. מומלץ להשתמש בתמונה באיכות גבוהה וביחס רוחב-גובה של 3:1.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl">גלריית תמונות</CardTitle>
              <CardDescription className="rtl">
                העלה תמונות מרובות לגלריית העסק שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isUploading && (
                <div className="mb-4">
                  <p className="text-sm text-center mb-2">מעלה תמונות...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <Label htmlFor="gallery_upload" className="rtl flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  תמונות לגלריה
                </Label>
                
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center w-full cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">לחץ להעלאת תמונות לגלריה</p>
                  <p className="text-xs text-gray-400 mt-1">ניתן לבחור מספר תמונות</p>
                </div>
                
                <input
                  ref={galleryInputRef}
                  type="file"
                  id="gallery_upload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'gallery')}
                />
                
                {galleryPreviews.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4 rtl">תמונות הגלריה</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {galleryPreviews.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`תמונת גלריה ${index + 1}`} 
                            className="w-full h-32 object-cover rounded-md border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeGalleryImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl">פרטי קשר</CardTitle>
              <CardDescription className="rtl">
                הזן את פרטי הקשר של העסק שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="rtl mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  מספר הוואטסאפ ישמש לחיבור הבוט לחשבון העסק שלך בוואטסאפ.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number" className="rtl flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  מספר וואטסאפ
                </Label>
                <Input
                  id="whatsapp_number"
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  className="rtl"
                  placeholder="+972501234567"
                />
                <p className="text-xs text-muted-foreground rtl">
                  הזן את המספר בפורמט בינלאומי, כולל קידומת המדינה (לדוגמה: 972+)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_number" className="rtl flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  מספר טלפון
                </Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="rtl"
                  placeholder="03-1234567"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl">שאלות נפוצות</CardTitle>
              <CardDescription className="rtl">
                הוסף שאלות נפוצות שהבוט יוכל לענות עליהן
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={addFaqField}
                  variant="outline"
                  size="sm"
                  className="rtl flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  הוסף שאלה
                </Button>
              </div>
              
              <div className="border rounded-md p-4 space-y-3 max-h-[300px] overflow-y-auto">
                {formData.faq.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 rtl">
                    אין שאלות נפוצות. הוסף שאלות כדי לעזור ללקוחות שלך.
                  </div>
                ) : (
                  formData.faq.map((faq, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={faq}
                        onChange={(e) => handleFaqChange(index, e.target.value)}
                        className="rtl"
                        placeholder="שאלה נפוצה (לדוגמה: מה שעות הפעילות שלכם?)"
                      />
                      {formData.faq.length > 1 && (
                        <Button 
                          type="button" 
                          onClick={() => removeFaqField(index)}
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground rtl">
                הוסף שאלות נפוצות שלקוחות שואלים לעיתים קרובות. הבוט ישתמש במידע זה כדי לענות על שאלות דומות.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="rtl flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isSubmitting ? 'שומר שינויים...' : 'שמור שינויים'}
        </Button>
      </div>
    </form>
  );
};

export default BusinessForm;
