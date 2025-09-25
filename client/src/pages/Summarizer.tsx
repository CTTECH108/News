import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Link as LinkIcon, 
  Upload, 
  Youtube, 
  Sparkles,
  Copy,
  Download
} from "lucide-react";

export default function Summarizer() {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const { toast } = useToast();

  const textSummaryMutation = useMutation({
    mutationFn: async (data: { text: string; maxLength?: number }) => {
      const response = await apiRequest('POST', '/api/summarize/text', data);
      return response.json();
    },
    onSuccess: (data) => {
      setSummary(data.summary);
      toast({
        title: "Summary generated",
        description: "Your text has been successfully summarized.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate summary",
        variant: "destructive",
      });
    },
  });

  const urlSummaryMutation = useMutation({
    mutationFn: async (data: { url: string }) => {
      const response = await apiRequest('POST', '/api/summarize/url', data);
      return response.json();
    },
    onSuccess: (data) => {
      setSummary(data.summary);
      setExtractedText(data.extractedText);
      toast({
        title: "Summary generated",
        description: "URL content has been successfully summarized.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to summarize URL",
        variant: "destructive",
      });
    },
  });

  const pdfSummaryMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/summarize/pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setSummary(data.summary);
      setExtractedText(data.extractedText);
      toast({
        title: "Summary generated",
        description: "PDF has been successfully summarized.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to summarize PDF",
        variant: "destructive",
      });
    },
  });

  const youtubeSummaryMutation = useMutation({
    mutationFn: async (data: { url: string }) => {
      const response = await apiRequest('POST', '/api/summarize/youtube', data);
      return response.json();
    },
    onSuccess: (data) => {
      setSummary(data.summary);
      setExtractedText(data.extractedText);
      toast({
        title: "Summary generated",
        description: "YouTube video has been successfully summarized.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to summarize YouTube video",
        variant: "destructive",
      });
    },
  });

  const handleTextSummary = () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to summarize",
        variant: "destructive",
      });
      return;
    }
    textSummaryMutation.mutate({ text });
  };

  const handleUrlSummary = () => {
    if (!url.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a URL to summarize",
        variant: "destructive",
      });
      return;
    }
    urlSummaryMutation.mutate({ url });
  };

  const handlePdfSummary = () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a PDF file to summarize",
        variant: "destructive",
      });
      return;
    }
    pdfSummaryMutation.mutate(file);
  };

  const handleYoutubeSummary = () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL to summarize",
        variant: "destructive",
      });
      return;
    }
    youtubeSummaryMutation.mutate({ url: youtubeUrl });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    });
  };

  const downloadSummary = () => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isLoading = textSummaryMutation.isPending || 
                   urlSummaryMutation.isPending || 
                   pdfSummaryMutation.isPending || 
                   youtubeSummaryMutation.isPending;

  return (
    <div className="min-h-screen bg-background py-8" data-testid="summarizer-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center">
              <Sparkles className="mr-2 text-primary" />
              AI-Powered Summarizer
            </h1>
            <p className="text-xl text-muted-foreground">
              Transform lengthy content into concise, actionable insights
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Content Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="text" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="text" data-testid="tab-text">
                      <FileText size={16} />
                    </TabsTrigger>
                    <TabsTrigger value="url" data-testid="tab-url">
                      <LinkIcon size={16} />
                    </TabsTrigger>
                    <TabsTrigger value="pdf" data-testid="tab-pdf">
                      <Upload size={16} />
                    </TabsTrigger>
                    <TabsTrigger value="youtube" data-testid="tab-youtube">
                      <Youtube size={16} />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-4">
                    <div>
                      <Label htmlFor="text-input">Enter Text</Label>
                      <Textarea
                        id="text-input"
                        placeholder="Paste your article text here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={8}
                        className="resize-none"
                        data-testid="text-input"
                      />
                    </div>
                    <Button 
                      onClick={handleTextSummary} 
                      disabled={isLoading}
                      className="w-full"
                      data-testid="summarize-text-button"
                    >
                      {isLoading ? "Generating..." : "Summarize Text"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="url-input">Article URL</Label>
                      <Input
                        id="url-input"
                        type="url"
                        placeholder="https://example.com/article"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        data-testid="url-input"
                      />
                    </div>
                    <Button 
                      onClick={handleUrlSummary} 
                      disabled={isLoading}
                      className="w-full"
                      data-testid="summarize-url-button"
                    >
                      {isLoading ? "Generating..." : "Summarize URL"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="pdf" className="space-y-4">
                    <div>
                      <Label htmlFor="pdf-input">Upload PDF</Label>
                      <Input
                        id="pdf-input"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        data-testid="pdf-input"
                      />
                    </div>
                    <Button 
                      onClick={handlePdfSummary} 
                      disabled={isLoading || !file}
                      className="w-full"
                      data-testid="summarize-pdf-button"
                    >
                      {isLoading ? "Generating..." : "Summarize PDF"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="youtube" className="space-y-4">
                    <div>
                      <Label htmlFor="youtube-input">YouTube URL</Label>
                      <Input
                        id="youtube-input"
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        data-testid="youtube-input"
                      />
                    </div>
                    <Button 
                      onClick={handleYoutubeSummary} 
                      disabled={isLoading}
                      className="w-full"
                      data-testid="summarize-youtube-button"
                    >
                      {isLoading ? "Generating..." : "Summarize Video"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  AI Summary
                  {summary && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(summary)}
                        data-testid="copy-summary-button"
                      >
                        <Copy size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadSummary}
                        data-testid="download-summary-button"
                      >
                        <Download size={16} />
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Generating summary...</span>
                  </div>
                ) : summary ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 border border-border rounded-md p-4">
                      <h4 className="font-medium mb-2">Summary:</h4>
                      <p className="text-sm leading-relaxed" data-testid="summary-output">
                        {summary}
                      </p>
                    </div>
                    
                    {extractedText && (
                      <div className="bg-muted/30 border border-border rounded-md p-4">
                        <h4 className="font-medium mb-2">Extracted Text Preview:</h4>
                        <p className="text-xs text-muted-foreground" data-testid="extracted-text">
                          {extractedText}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Your AI-generated summary will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
