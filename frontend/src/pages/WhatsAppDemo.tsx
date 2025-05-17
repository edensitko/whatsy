import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface Business {
  id: string;
  botId: string;
  name: string;
}

const WhatsAppDemo = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch businesses on component mount
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/business");
        if (response.ok) {
          const data = await response.json();
          setBusinesses(data);
        } else {
          console.error("Failed to fetch businesses");
        }
      } catch (error) {
        console.error("Error fetching businesses:", error);
      }
    };

    fetchBusinesses();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    // Prepare the message with bot ID if needed
    let fullMessage = message;
    if (selectedBusiness && !message.startsWith("#bot:")) {
      fullMessage = `#bot:${selectedBusiness} ${message}`;
    }

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

    try {
      // Send message to server
      const response = await fetch("http://localhost:3000/api/whatsapp/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          Body: fullMessage,
          From: `whatsapp:${phoneNumber}`,
          To: "whatsapp:+14155238886",
        }),
      });

      if (response.ok) {
        // Since we're in mock mode, we need to fetch the response from the server logs
        // We'll add a small delay to allow the server to process the message
        setTimeout(async () => {
          try {
            const logsResponse = await fetch("http://localhost:3000/api/logs/latest");
            if (logsResponse.ok) {
              const logsData = await logsResponse.json();
              if (logsData && logsData.mockMessage) {
                // Add bot response to chat
                const botMessage: Message = {
                  id: Date.now().toString(),
                  text: logsData.mockMessage,
                  sender: "bot",
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMessage]);
              } else {
                toast({
                  title: "Info",
                  description: "Message sent to server. No response received.",
                });
              }
            } else {
              toast({
                title: "Error",
                description: "Failed to fetch response from server",
                variant: "destructive",
              });
            }
            setIsLoading(false);
          } catch (error) {
            console.error("Error fetching response:", error);
            toast({
              title: "Error",
              description: "Failed to fetch response from server",
              variant: "destructive",
            });
            setIsLoading(false);
          }
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: `Failed to send message: ${response.status} ${response.statusText}`,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-4">
      <div className="max-w-sm mx-auto">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">WhatsApp ChatGPT Demo</CardTitle>
            <CardDescription className="text-xs">
              Test your WhatsApp bot integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="12345678910"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="business" className="text-xs">Select Business</Label>
                <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                  <SelectTrigger id="business" className="h-8 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.botId} value={business.botId} className="text-sm">
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-md bg-muted/30">
              <ScrollArea className="h-[300px] px-2 py-1">
                <div className="space-y-2">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4 text-xs">
                      No messages yet. Start a conversation!
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-1.5 text-xs ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                          <div
                            className={`text-[10px] mt-1 ${
                              msg.sender === "user"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {msg.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="flex w-full gap-1">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="h-8 text-sm"
              />
              <Button onClick={handleSendMessage} disabled={isLoading} className="h-8 px-2 text-xs">
                {isLoading ? "..." : "Send"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppDemo;
