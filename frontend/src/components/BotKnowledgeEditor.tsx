import React, { useState, useMemo, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Business, FaqItem, BusinessHours } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Plus, Trash2, Save, Wand2, FileQuestion, Building2, Code, FileText, Calendar, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getOpenAIResponse } from '@/services/openaiService';

// Function to format day name
const formatDayName = (day: string): string => {
  const dayNames: Record<string, string> = {
    sunday: 'יום ראשון',
    monday: 'יום שני',
    tuesday: 'יום שלישי',
    wednesday: 'יום רביעי',
    thursday: 'יום חמישי',
    friday: 'יום שישי',
    saturday: 'יום שבת'
  };
  return dayNames[day] || day;
};

interface BotKnowledgeEditorProps {
  business?: Business;
  initialValue?: string;
  onSave: (value: any) => void;
  isLoading?: boolean;
}

// Helper type for OpenAI response
interface OpenAIResponse {
  content: string;
}

// Define the BusinessHourEntry type
interface BusinessHourEntry {
  open: string;
  close: string;
  isOpen: boolean;
}

// Define our own BusinessHours type
interface BusinessHoursType {
  sunday: BusinessHourEntry;
  monday: BusinessHourEntry;
  tuesday: BusinessHourEntry;
  wednesday: BusinessHourEntry;
  thursday: BusinessHourEntry;
  friday: BusinessHourEntry;
  saturday: BusinessHourEntry;
  [key: string]: BusinessHourEntry;
}

// Define the BusinessData type
interface BusinessData {
  name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  services: string;
  policies: string;
  additionalInfo: string;
}

const BotKnowledgeEditor: React.FC<BotKnowledgeEditorProps> = ({
  business,
  initialValue = '',
  onSave,
  isLoading = false
}) => {
  // State for the knowledge text
  const [knowledgeText, setKnowledgeText] = useState(initialValue);
  const [viewMode, setViewMode] = useState<'text' | 'json'>('text');
  const [activeTab, setActiveTab] = useState('knowledge');
  const [isAIHelpDialogOpen, setIsAIHelpDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [faqItems, setFaqItems] = useState<string[]>([]);
  const [newFaqItem, setNewFaqItem] = useState('');

  // State for structured business information
  const [structuredInfo, setStructuredInfo] = useState<BusinessData>({
    name: business?.name || '',
    description: business?.description || '',
    phone: business?.phone_number || business?.whatsapp_number || '',
    email: '',
    website: '',
    location: '',
    services: '',
    policies: '',
    additionalInfo: ''
  });

  // State for business hours
  const [businessHours, setBusinessHours] = useState<BusinessHoursType>({
    sunday: { open: '09:00', close: '17:00', isOpen: true },
    monday: { open: '09:00', close: '17:00', isOpen: true },
    tuesday: { open: '09:00', close: '17:00', isOpen: true },
    wednesday: { open: '09:00', close: '17:00', isOpen: true },
    thursday: { open: '09:00', close: '17:00', isOpen: true },
    friday: { open: '09:00', close: '14:00', isOpen: true },
    saturday: { open: '', close: '', isOpen: false }
  });

  // Function to generate knowledge text from structured info
  const generateKnowledgeFromStructure = () => {
    let knowledge = '';
    
    // Add business name and description
    if (structuredInfo.name) {
      knowledge += `# ${structuredInfo.name}\n\n`;
    }
    
    if (structuredInfo.description) {
      knowledge += `${structuredInfo.description}\n\n`;
    }
    
    // Add contact information
    const contactInfo = [];
    if (structuredInfo.phone) contactInfo.push(`**טלפון**: ${structuredInfo.phone}`);
    if (structuredInfo.email) contactInfo.push(`**אימייל**: ${structuredInfo.email}`);
    if (structuredInfo.website) contactInfo.push(`**אתר**: ${structuredInfo.website}`);
    if (structuredInfo.location) contactInfo.push(`**כתובת**: ${structuredInfo.location}`);
    
    if (contactInfo.length > 0) {
      knowledge += `## פרטי התקשרות\n${contactInfo.join('\n')}\n\n`;
    }
    
    // Add business hours
    const businessHoursText = Object.entries(businessHours).map(([day, hours]) => {
      if (!hours.isOpen) return `- **${formatDayName(day)}**: סגור`;
      return `- **${formatDayName(day)}**: ${hours.open} - ${hours.close}`;
    }).join('\n');
    
    if (businessHoursText) {
      knowledge += `## שעות פעילות\n${businessHoursText}\n\n`;
    }
    
    // Add services
    if (structuredInfo.services) {
      knowledge += `## שירותים\n${structuredInfo.services}\n\n`;
    }
    
    // Add policies
    if (structuredInfo.policies) {
      knowledge += `## מדיניות\n${structuredInfo.policies}\n\n`;
    }
    
    // Add additional info
    if (structuredInfo.additionalInfo) {
      knowledge += `## מידע נוסף\n${structuredInfo.additionalInfo}\n\n`;
    }
    
    // Add FAQ
    if (faqItems.length > 0) {
      knowledge += `## שאלות נפוצות\n`;
      faqItems.forEach((faq, index) => {
        knowledge += `### שאלה ${index + 1}: ${faq}\n`;
      });
    }
    
    return knowledge;
  };

  // Function to generate complete business JSON data
  const generateFullBusinessJson = () => {
    // Format business hours in a more structured way
    const formattedHours = {};
    Object.entries(businessHours).forEach(([day, hours]) => {
      formattedHours[day] = hours.isOpen 
        ? { open: hours.open, close: hours.close, isOpen: true }
        : { open: '', close: '', isOpen: false };
    });
    
    // Create a complete business data object
    return {
      basic: {
        name: structuredInfo.name || (business?.name || ''),
        description: structuredInfo.description || (business?.description || ''),
        phone: structuredInfo.phone || (business?.phone_number || business?.whatsapp_number || ''),
        whatsapp: business?.whatsapp_number || '',
      },
      contact: {
        email: structuredInfo.email || '',
        website: structuredInfo.website || '',
        location: structuredInfo.location || '',
      },
      details: {
        services: structuredInfo.services || '',
        policies: structuredInfo.policies || '',
        additionalInfo: structuredInfo.additionalInfo || '',
      },
      hours: formattedHours,
      faq: faqItems.map(item => {
        if (typeof item === 'string') {
          return { question: item, answer: '' };
        }
        return item;
      }),
      // Include any additional data from the business object
      ...(business?.business_data ? { existingData: business.business_data } : {}),
    };
  };
  
  // Function to copy JSON to clipboard
  const copyJsonToClipboard = () => {
    const fullBusinessData = generateFullBusinessJson();
    const jsonString = JSON.stringify(fullBusinessData, null, 2);
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        toast({
          title: 'הצלחה',
          description: 'ה-JSON הועתק ללוח',
          variant: 'default',
        });
      })
      .catch((error) => {
        console.error('Failed to copy JSON:', error);
        toast({
          title: 'שגיאה',
          description: 'לא ניתן להעתיק ללוח',
          variant: 'destructive',
        });
      });
  };

  // Function to generate JSON from structured info
  const generateJsonFromStructure = () => {
    // Use the comprehensive business data generator
    const fullBusinessData = generateFullBusinessJson();
    
    // Return the JSON string representation with pretty formatting
    return JSON.stringify(fullBusinessData, null, 2);
  };

  // Function to update structured info
  const handleStructuredInfoChange = (field: string, value: string) => {
    setStructuredInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to update business hours
  const handleHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  // Function to toggle business hours open/closed
  const toggleHoursOpen = (day: string, isOpen: boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen
      }
    }));
  };

  // Function to format FAQ for prompt
  const formatFaqForPrompt = (faqItems: string[]) => {
    if (!faqItems.length) return '';
    return faqItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
  };

  // Function to merge knowledge
  const mergeKnowledge = (existingKnowledge: string, newKnowledge: string) => {
    // Simple merge for now - could be enhanced with more sophisticated merging logic
    if (!existingKnowledge) return newKnowledge;
    return `${existingKnowledge}\n\n${newKnowledge}`;
  };

  // Function to handle AI generation
  const handleAIGenerate = async () => {
    try {
      setIsGenerating(true);
      
      // Prepare business info for the API
      const businessInfo = structuredInfo.name ? {
        name: structuredInfo.name,
        description: structuredInfo.description,
        hours: Object.entries(businessHours).map(([day, hours]) => {
          if (!hours.isOpen) return `${formatDayName(day)}: סגור`;
          return `${formatDayName(day)}: ${hours.open} - ${hours.close}`;
        }).join(', '),
        faq: faqItems // Keep as array for API compatibility
      } : {};
      
      // Add the formatted FAQ to the prompt itself
      const formattedFaqText = formatFaqForPrompt(faqItems);
      const enhancedPrompt = `${aiPrompt}\n\nHere are the FAQs for reference:\n${formattedFaqText}`;
      
      const response = await getOpenAIResponse({
        prompt: enhancedPrompt,
        businessInfo
      });
      
      if (response) {
        // Check if response is a string or an object with content property
        let newContent = '';
        if (typeof response === 'string') {
          newContent = response;
        } else if (typeof response === 'object' && response !== null && 'content' in response) {
          newContent = (response as OpenAIResponse).content;
        }
        
        // Check for duplications and merge with existing knowledge
        if (newContent) {
          setKnowledgeText(prevKnowledge => mergeKnowledge(prevKnowledge, newContent));
        }
        
        setIsAIHelpDialogOpen(false);
      }
    } catch (error) {
      console.error('Error generating with AI:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  const addFaqItem = () => {
    if (newFaqItem.trim()) {
      setFaqItems([...faqItems, newFaqItem.trim()]);
      setNewFaqItem('');
    }
  };
  
  const removeFaqItem = (index: number) => {
    const newItems = [...faqItems];
    newItems.splice(index, 1);
    setFaqItems(newItems);
  };

  // Update knowledge text when structured info changes
  useEffect(() => {
    if (viewMode === 'text') {
      setKnowledgeText(generateKnowledgeFromStructure());
    } else {
      setKnowledgeText(generateJsonFromStructure());
    }
  }, [structuredInfo, faqItems, viewMode, businessHours]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="knowledge" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>ידע הבוט</span>
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>מבנה מידע</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>שעות פעילות</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            <span>שאלות נפוצות</span>
            <Badge variant="secondary" className="ml-1">{faqItems.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl">ידע הבוט</CardTitle>
              <div className="text-sm text-muted-foreground rtl">
                הזן את המידע שהבוט ישתמש בו כדי לענות על שאלות לקוחות
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'text' ? 'json' : 'text')}
                  className="flex items-center gap-1"
                >
                  <Code className="h-4 w-4" />
                  {viewMode === 'text' ? 'הצג כ-JSON' : 'הצג כטקסט'}
                </Button>
              </div>
              <Textarea
                value={knowledgeText}
                onChange={(e) => setKnowledgeText(e.target.value)}
                className="min-h-[400px] font-mono text-sm rtl"
                dir="rtl"
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setIsAIHelpDialogOpen(true)}>
                <Wand2 className="mr-2 h-4 w-4" />
                צור עם AI
              </Button>
              <Button onClick={() => onSave(knowledgeText)} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                שמור
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl">מבנה מידע העסק</CardTitle>
              <div className="text-sm text-muted-foreground rtl">
                הזן את פרטי העסק בצורה מובנית ליצירת ידע מאורגן לבוט
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name" className="rtl">שם העסק</Label>
                    <Input
                      id="business-name"
                      value={structuredInfo.name}
                      onChange={(e) => handleStructuredInfoChange('name', e.target.value)}
                      className="rtl"
                      placeholder="הזן את שם העסק"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business-phone" className="rtl">טלפון</Label>
                    <Input
                      id="business-phone"
                      value={structuredInfo.phone}
                      onChange={(e) => handleStructuredInfoChange('phone', e.target.value)}
                      className="rtl"
                      placeholder="הזן את מספר הטלפון של העסק"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business-description" className="rtl">תיאור העסק</Label>
                  <Textarea
                    id="business-description"
                    value={structuredInfo.description}
                    onChange={(e) => handleStructuredInfoChange('description', e.target.value)}
                    className="min-h-[100px] rtl"
                    placeholder="הזן תיאור קצר של העסק"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business-services" className="rtl">שירותים</Label>
                  <Textarea
                    id="business-services"
                    value={structuredInfo.services}
                    onChange={(e) => handleStructuredInfoChange('services', e.target.value)}
                    className="min-h-[100px] rtl"
                    placeholder="פרט את השירותים שהעסק מציע"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-location" className="rtl">מיקום</Label>
                    <Input
                      id="business-location"
                      value={structuredInfo.location}
                      onChange={(e) => handleStructuredInfoChange('location', e.target.value)}
                      className="rtl"
                      placeholder="הזן את כתובת העסק"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business-email" className="rtl">אימייל</Label>
                    <Input
                      id="business-email"
                      value={structuredInfo.email}
                      onChange={(e) => handleStructuredInfoChange('email', e.target.value)}
                      className="rtl"
                      placeholder="הזן את כתובת האימייל של העסק"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business-website" className="rtl">אתר אינטרנט</Label>
                  <Input
                    id="business-website"
                    value={structuredInfo.website}
                    onChange={(e) => handleStructuredInfoChange('website', e.target.value)}
                    className="rtl"
                    placeholder="הזן את כתובת האתר של העסק"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business-policies" className="rtl">מדיניות</Label>
                  <Textarea
                    id="business-policies"
                    value={structuredInfo.policies}
                    onChange={(e) => handleStructuredInfoChange('policies', e.target.value)}
                    className="min-h-[100px] rtl"
                    placeholder="פרט את מדיניות העסק (החזרים, ביטולים וכו')"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business-additional" className="rtl">מידע נוסף</Label>
                  <Textarea
                    id="business-additional"
                    value={structuredInfo.additionalInfo}
                    onChange={(e) => handleStructuredInfoChange('additionalInfo', e.target.value)}
                    className="min-h-[100px] rtl"
                    placeholder="הוסף כל מידע נוסף שיכול להיות רלוונטי"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl">שעות פעילות</CardTitle>
              <div className="text-sm text-muted-foreground rtl">
                הגדר את שעות הפעילות של העסק
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4">
                  {/* שעות פעילות מהירות */}
                  <div className="border p-4 rounded-lg bg-muted/30">
                    <h3 className="text-md font-semibold mb-3 rtl">הגדרה מהירה</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="rtl mb-2 block">שעת פתיחה לכל הימים</Label>
                        <Input 
                          type="time" 
                          className="w-full" 
                          onChange={(e) => {
                            const newTime = e.target.value;
                            setBusinessHours(prev => {
                              const updated = {...prev};
                              Object.keys(updated).forEach(day => {
                                if (updated[day].isOpen) {
                                  updated[day].open = newTime;
                                }
                              });
                              return updated;
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="rtl mb-2 block">שעת סגירה לכל הימים</Label>
                        <Input 
                          type="time" 
                          className="w-full" 
                          onChange={(e) => {
                            const newTime = e.target.value;
                            setBusinessHours(prev => {
                              const updated = {...prev};
                              Object.keys(updated).forEach(day => {
                                if (updated[day].isOpen) {
                                  updated[day].close = newTime;
                                }
                              });
                              return updated;
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setBusinessHours(prev => {
                            const updated = {...prev};
                            Object.keys(updated).forEach(day => {
                              if (day !== 'saturday' && day !== 'friday') {
                                updated[day].isOpen = true;
                                updated[day].open = '09:00';
                                updated[day].close = '17:00';
                              } else if (day === 'friday') {
                                updated[day].isOpen = true;
                                updated[day].open = '09:00';
                                updated[day].close = '14:00';
                              } else {
                                updated[day].isOpen = false;
                              }
                            });
                            return updated;
                          });
                        }}
                      >
                        הגדר שעות רגילות
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setBusinessHours(prev => {
                            const updated = {...prev};
                            Object.keys(updated).forEach(day => {
                              updated[day].isOpen = true;
                              updated[day].open = '00:00';
                              updated[day].close = '23:59';
                            });
                            return updated;
                          });
                        }}
                      >
                        פתוח 24/7
                      </Button>
                    </div>
                  </div>
                  
                  {/* טבלת שעות מפורטת */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-right rtl font-medium">יום</th>
                          <th className="p-3 text-center rtl font-medium">פתוח</th>
                          <th className="p-3 text-center rtl font-medium">שעת פתיחה</th>
                          <th className="p-3 text-center rtl font-medium">שעת סגירה</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(businessHours).map(([day, hours]) => (
                          <tr key={day} className="border-t hover:bg-muted/20 transition-colors">
                            <td className="p-3 text-right rtl font-medium">{formatDayName(day)}</td>
                            <td className="p-3 text-center rtl">
                              <div className="flex justify-center">
                                <input
                                  type="checkbox"
                                  checked={hours.isOpen}
                                  onChange={(e) => toggleHoursOpen(day, e.target.checked)}
                                  className="h-5 w-5"
                                />
                              </div>
                            </td>
                            <td className="p-3 text-center rtl">
                              <Input
                                type="time"
                                value={hours.open}
                                onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                disabled={!hours.isOpen}
                                className={`w-full ${!hours.isOpen ? 'opacity-50' : ''}`}
                              />
                            </td>
                            <td className="p-3 text-center rtl">
                              <Input
                                type="time"
                                value={hours.close}
                                onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                disabled={!hours.isOpen}
                                className={`w-full ${!hours.isOpen ? 'opacity-50' : ''}`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg rtl">שאלות נפוצות</CardTitle>
              <div className="text-sm text-muted-foreground rtl">
                הוסף שאלות נפוצות שלקוחות שואלים על העסק
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newFaqItem}
                    onChange={(e) => setNewFaqItem(e.target.value)}
                    placeholder="הוסף שאלה נפוצה"
                    className="flex-1 rtl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addFaqItem();
                      }
                    }}
                  />
                  <Button onClick={addFaqItem} disabled={!newFaqItem.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {faqItems.length === 0 ? (
                    <div className="text-center text-muted-foreground p-4 border rounded-md rtl">
                      אין שאלות נפוצות. הוסף שאלות כדי לעזור לבוט לענות על שאלות נפוצות.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {faqItems.map((faq, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md rtl">
                          <div className="flex-1">{faq}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFaqItem(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* AI Help Dialog */}
      <Dialog open={isAIHelpDialogOpen} onOpenChange={setIsAIHelpDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="rtl">צור ידע עם AI</DialogTitle>
            <DialogDescription className="rtl">
              תאר את המידע שתרצה שה-AI ייצר עבורך
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="לדוגמה: צור מידע על מסעדה איטלקית שמתמחה בפיצות ופסטות ביתיות"
              className="min-h-[100px] rtl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIHelpDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleAIGenerate} disabled={!aiPrompt.trim() || isGenerating}>
              {isGenerating ? 'מייצר...' : 'צור ידע'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BotKnowledgeEditor;
