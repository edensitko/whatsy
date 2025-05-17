import React, { useState } from 'react';
import WhatsAppChat from '@/components/WhatsAppChat';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ChatDemo = () => {
  const [businessName, setBusinessName] = useState('Smart Business Bot');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Simulate sending a message to the bot and getting a response
  const handleSendMessage = async (message: string): Promise<string> => {
    // In a real app, you would call your API here
    // For demo purposes, we'll just simulate a delay and return a response
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a contextual response based on the message
        let response = '';
        
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
          response = `Hello! I'm the virtual assistant for ${businessName}. How can I help you today?`;
        } else if (lowerMessage.includes('hour') || lowerMessage.includes('open')) {
          response = `${businessName} is open Monday to Friday from 9 AM to 6 PM, and Saturday from 10 AM to 4 PM. We're closed on Sundays.`;
        } else if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
          response = `${businessName} is located at 123 Main Street, Downtown. You can find us on Google Maps!`;
        } else if (lowerMessage.includes('service') || lowerMessage.includes('product')) {
          response = `${businessName} offers a wide range of services including consultations, product sales, and support. Would you like to know more about any specific service?`;
        } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
          response = `Our prices vary depending on the service. Basic consultations start at $50. Would you like a detailed price list?`;
        } else if (lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
          response = `I'd be happy to help you book an appointment! Please provide your preferred date and time, and I'll check availability.`;
        } else if (lowerMessage.includes('thank')) {
          response = `You're welcome! Is there anything else I can help you with?`;
        } else if (customPrompt) {
          // Use the custom prompt if available
          response = `${customPrompt} (In response to: "${message}")`;
        } else {
          response = `Thank you for your message. A representative from ${businessName} will get back to you soon. Is there anything specific you'd like to know in the meantime?`;
        }
        
        resolve(response);
      }, 1500); // Simulate network delay
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Header />
      
      <div className="max-w-4xl mx-auto mt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">WhatsApp Chat Demo</h1>
          <Button 
            variant="outline"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
          >
            {isConfigOpen ? 'Hide Config' : 'Show Config'}
          </Button>
        </div>
        
        {isConfigOpen && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Chat Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="custom-prompt">Custom Response Prompt</Label>
                  <Input
                    id="custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter a custom prompt for all responses"
                  />
                  <p className="text-sm text-gray-500">
                    If set, this text will be used for all responses. Leave empty to use the default contextual responses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-center">
          <WhatsAppChat
            businessName={businessName}
            botAvatar="/bot-avatar.png"
            onSendMessage={handleSendMessage}
            initialMessages={[
              {
                id: 'welcome',
                text: `Welcome to ${businessName}! How can I assist you today?`,
                sender: 'bot',
                timestamp: new Date(),
              },
            ]}
            className="shadow-xl"
          />
        </div>
        
        <div className="mt-8 text-center text-gray-500">
          <p>Try asking about business hours, location, services, or booking an appointment.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatDemo;
