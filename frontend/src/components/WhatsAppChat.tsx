import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Message interface
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface WhatsAppChatProps {
  businessName?: string;
  botAvatar?: string;
  onSendMessage?: (message: string) => Promise<string>;
  initialMessages?: Message[];
  className?: string;
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  businessName = 'Business Bot',
  botAvatar = '/bot-avatar.png',
  onSendMessage,
  initialMessages = [],
  className = '',
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Focus back on input
    inputRef.current?.focus();

    if (onSendMessage) {
      try {
        // Get bot response
        const response = await onSendMessage(inputValue);
        
        // Add bot message
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          text: response,
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error('Error getting bot response:', error);
        
        // Add error message
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          text: 'Sorry, I couldn\'t process your message. Please try again.',
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    } else {
      // Demo mode - add mock response after delay
      setTimeout(() => {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          text: 'This is a demo response. Connect a real bot by providing the onSendMessage prop.',
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Format time as HH:MM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className={`flex flex-col h-[400px] w-full max-w-[350px] mx-auto shadow-md ${className}`}>
      {/* Chat header */}
      <div className="flex items-center p-2 bg-green-600 text-white rounded-t-lg">
        <Avatar className="h-8 w-8 mr-2">
          <img src={botAvatar} alt={businessName} className="rounded-full" />
        </Avatar>
        <div>
          <h3 className="font-semibold text-sm">{businessName}</h3>
          <p className="text-xs opacity-80">
            {isTyping ? 'typing...' : 'online'}
          </p>
        </div>
      </div>
      
      {/* Chat background */}
      <div className="flex-1 bg-[#e5ddd5] bg-opacity-80 bg-[url('/whatsapp-bg.png')] bg-repeat">
        <ScrollArea className="h-full p-2">
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-2 text-sm ${
                    message.sender === 'user'
                      ? 'bg-[#dcf8c6] text-black'
                      : 'bg-white text-black'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <p className="text-[10px] text-gray-500 text-right mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg p-2 max-w-[85%]">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      
      {/* Chat input */}
      <div className="p-2 bg-gray-100 rounded-b-lg flex items-center gap-1">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          className="flex-1 h-8 text-sm"
        />
        <Button 
          onClick={handleSendMessage}
          className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
          disabled={!inputValue.trim() || isTyping}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </Button>
      </div>
    </Card>
  );
};

export default WhatsAppChat;
