import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Business } from '@/types';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface BotLinkProps {
  business?: Business;
  botId?: string;
  whatsappNumber?: string;
}

const BotLink = ({ business, botId, whatsappNumber }: BotLinkProps) => {
  const [copied, setCopied] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // Use either the props directly or extract from business object
  const effectiveBotId = botId || (business?.bot_id || '');
  const effectiveWhatsappNumber = whatsappNumber || (business?.whatsapp_number || '14155238886'); // Default Twilio number as fallback
  
  const botLink = `https://api.whatsapp.com/send?phone=${effectiveWhatsappNumber}&text=botId=${effectiveBotId}`;
  
  useEffect(() => {
    // Check if the WhatsApp integration server is running
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/health', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        console.error('Error checking server status:', error);
        setServerStatus('offline');
      }
    };
    
    checkServerStatus();
  }, []);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(botLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };
  
  return (
    <div className="dashboard-card rtl">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">קישור לבוט</h3>
        <div className="flex items-center">
          {serverStatus === 'online' ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-xs">מחובר</span>
            </div>
          ) : serverStatus === 'offline' ? (
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span className="text-xs">לא מחובר</span>
            </div>
          ) : (
            <div className="flex items-center text-gray-600">
              <span className="text-xs">בודק...</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="relative">
        <div className="bg-gray-50 p-3 rounded-lg mb-2 text-sm overflow-x-auto whitespace-nowrap">
          {botLink}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={handleCopy}
        >
          {copied ? 'הקישור הועתק!' : 'העתק קישור'}
        </Button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>שתף קישור זה עם לקוחות כדי שיוכלו לדבר עם הבוט העסקי שלך בוואטסאפ</p>
      </div>
    </div>
  );
};

export default BotLink;
