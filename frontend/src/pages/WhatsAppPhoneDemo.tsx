import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const WhatsAppPhoneDemo = () => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Add initial messages for demo
  useEffect(() => {
    setMessages([
      {
        id: "bot-1",
        text: "שלום! אני העוזר הוירטואלי של רדאפ מערכות . איך אוכל לעזור לך היום?",
        sender: "bot",
        timestamp: new Date(Date.now() - 60000)
      }
    ]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponses = [
        "אשמח לעזור לך! האם תוכל לפרט יותר?",
        "תודה על פנייתך. אני יכול לספק לך מידע על השירותים שלנו.",
        "שעות הפעילות שלנו הן 9:00-18:00 בימים א'-ה'.",
        "אנחנו נמצאים ברחוב הרצל 123, תל אביב.",
        "אשמח לקבוע עבורך תור. מתי נוח לך?",
        "האם יש לך שאלות נוספות שאוכל לענות עליהן?",
        "ניתן ליצור איתנו קשר גם בטלפון 03-1234567."
      ];
      
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const botMessage: Message = {
        id: Date.now().toString(),
        text: randomResponse,
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto py-8 flex justify-center">
      <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
        {/* Phone frame elements */}
        <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -right-[17px] top-[124px] rounded-r-lg"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -right-[17px] top-[178px] rounded-r-lg"></div>
        <div className="h-[64px] w-[3px] bg-gray-800 absolute -left-[17px] top-[142px] rounded-l-lg"></div>
        
        {/* Phone screen */}
        <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
          <div className="flex flex-col h-full">
            {/* Status bar */}
            <div className="bg-gray-900 h-6 w-full flex items-center justify-between px-4">
              <div className="text-white text-xs">9:41</div>
              <div className="flex space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            
            {/* WhatsApp header */}
            <div className="bg-green-600 text-white p-2 flex items-center">
              <button className="mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center overflow-hidden">
                  <img src="/bot-avatar.png" alt="Bot" className="w-full h-full object-cover" onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='2' width='20' height='20' rx='5' ry='5'%3E%3C/rect%3E%3Cpath d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'%3E%3C/path%3E%3Cline x1='17.5' y1='6.5' x2='17.51' y2='6.5'%3E%3C/line%3E%3C/svg%3E";
                  }} />
                </div>
                <div>
                  <div className="font-semibold text-sm">רדאפ מערכות</div>
                  <div className="text-xs opacity-80">
                    {isLoading ? 'מקליד...' : 'מחובר'}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat area with scrollable content */}
            <div className="flex-1 bg-[#e5ddd5] bg-opacity-80 bg-[url('/whatsapp-bg.png')] bg-repeat overflow-hidden">
              <ScrollArea className="h-full px-2 py-2">
                <div className="space-y-2 pb-2 min-h-full">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-2 text-xs ${
                          msg.sender === "user"
                            ? "bg-[#dcf8c6] text-black"
                            : "bg-white text-black"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        <p className="text-[10px] text-gray-500 text-right mt-1">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg p-2 max-w-[75%]">
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

            {/* Input area */}
            <div className="bg-gray-100 p-2 flex items-center">
              <button className="text-gray-500 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="הקלד הודעה"
                className="mx-2 h-8 text-xs"
                dir="rtl"
              />
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
                className="bg-green-600 text-white rounded-full p-1.5"
              >
                {message.trim() ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPhoneDemo;
