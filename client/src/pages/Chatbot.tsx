import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  Send, 
  User, 
  Sparkles,
  MessageCircle,
  Zap,
  FileText,
  Shield,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your FlashPress News AI Assistant. I can help you with news summaries, fact-checking, TNPSC preparation guidance, and current affairs discussions. How can I assist you today?',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; sessionId: string }) => {
      const response = await apiRequest('POST', '/api/chat', data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      const userMessage: ChatMessage = {
        role: 'user',
        content: variables.message,
        timestamp: new Date().toISOString(),
      };
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    chatMutation.mutate({
      message: inputMessage,
      sessionId,
    });

    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const quickActions = [
    {
      label: "Summarize latest news",
      icon: FileText,
      message: "Can you summarize the latest news for today?",
    },
    {
      label: "Check news authenticity",
      icon: Shield,
      message: "How can I verify if a news article is real or fake?",
    },
    {
      label: "TNPSC preparation tips",
      icon: GraduationCap,
      message: "Give me some tips for TNPSC exam preparation.",
    },
    {
      label: "Current affairs update",
      icon: Sparkles,
      message: "What are the important current affairs topics I should know about?",
    },
  ];

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background py-8" data-testid="chatbot-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center">
              <Bot className="mr-2 text-primary" />
              AI News Assistant
            </h1>
            <p className="text-xl text-muted-foreground">
              Chat with our AI for news insights, summaries, and TNPSC guidance
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat Interface */}
            <Card className="lg:col-span-3">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center">
                  <MessageCircle className="mr-2" size={20} />
                  Chat with AI Assistant
                  {user && (
                    <span className="ml-auto text-sm text-muted-foreground">
                      Logged in as {user.username}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages Area */}
                <ScrollArea className="h-[500px] p-4" ref={scrollAreaRef} data-testid="chat-messages">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "flex mb-4",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                        data-testid={`message-${index}`}
                      >
                        <div
                          className={cn(
                            "flex max-w-[80%] items-start space-x-2",
                            message.role === 'user' ? "flex-row-reverse space-x-reverse" : "flex-row"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              message.role === 'user'
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {message.role === 'user' ? (
                              <User size={16} />
                            ) : (
                              <Bot size={16} />
                            )}
                          </div>
                          <div
                            className={cn(
                              "rounded-lg px-4 py-2",
                              message.role === 'user'
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                            <p className={cn(
                              "text-xs mt-1 opacity-70",
                              message.role === 'user' ? "text-primary-foreground" : "text-muted-foreground"
                            )}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {chatMutation.isPending && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start mb-4"
                    >
                      <div className="flex items-start space-x-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Bot size={16} />
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-sm text-muted-foreground">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Ask me about news, summaries, fact-checking, or TNPSC preparation..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={chatMutation.isPending}
                      className="flex-1"
                      data-testid="chat-input"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={chatMutation.isPending || !inputMessage.trim()}
                      data-testid="send-message-button"
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Sidebar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto p-3 text-left"
                      onClick={() => setInputMessage(action.message)}
                      data-testid={`quick-action-${index}`}
                    >
                      <Icon size={16} className="mr-2 shrink-0" />
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Features Info */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2" size={20} />
                AI Assistant Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <FileText className="mx-auto mb-2 text-primary" size={24} />
                  <h4 className="font-medium mb-1">News Summaries</h4>
                  <p className="text-sm text-muted-foreground">
                    Get quick summaries of articles and current events
                  </p>
                </div>
                <div className="text-center p-4">
                  <Shield className="mx-auto mb-2 text-primary" size={24} />
                  <h4 className="font-medium mb-1">Fact Checking</h4>
                  <p className="text-sm text-muted-foreground">
                    Verify news authenticity and source credibility
                  </p>
                </div>
                <div className="text-center p-4">
                  <GraduationCap className="mx-auto mb-2 text-primary" size={24} />
                  <h4 className="font-medium mb-1">TNPSC Guidance</h4>
                  <p className="text-sm text-muted-foreground">
                    Get exam preparation tips and study guidance
                  </p>
                </div>
                <div className="text-center p-4">
                  <Sparkles className="mx-auto mb-2 text-primary" size={24} />
                  <h4 className="font-medium mb-1">Current Affairs</h4>
                  <p className="text-sm text-muted-foreground">
                    Stay updated with important news and events
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
