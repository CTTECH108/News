import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Search,
  Star
} from "lucide-react";

interface FakeNewsResult {
  isReal: boolean;
  confidence: number;
  explanation: string;
  sourceCredibility: 'high' | 'medium' | 'low';
}

export default function FakeNewsDetector() {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [result, setResult] = useState<FakeNewsResult | null>(null);
  const { toast } = useToast();

  const fakeNewsMutation = useMutation({
    mutationFn: async (data: { text: string; source?: string }) => {
      const response = await apiRequest('POST', '/api/fakecheck', data);
      return response.json();
    },
    onSuccess: (data: FakeNewsResult) => {
      setResult(data);
      toast({
        title: "Analysis complete",
        description: `News authenticity has been analyzed with ${Math.round(data.confidence * 100)}% confidence.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze news authenticity",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter news content to analyze",
        variant: "destructive",
      });
      return;
    }
    
    fakeNewsMutation.mutate({ text, source: source.trim() || undefined });
  };

  const getResultIcon = (isReal: boolean, confidence: number) => {
    if (confidence > 0.8) {
      return isReal ? (
        <CheckCircle className="text-green-500" size={24} />
      ) : (
        <XCircle className="text-red-500" size={24} />
      );
    }
    return <AlertTriangle className="text-yellow-500" size={24} />;
  };

  const getResultColor = (isReal: boolean, confidence: number) => {
    if (confidence > 0.8) {
      return isReal ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200";
    }
    return "text-yellow-700 bg-yellow-50 border-yellow-200";
  };

  const getCredibilityBadge = (credibility: string) => {
    const colors = {
      high: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800", 
      low: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge className={colors[credibility as keyof typeof colors]}>
        {credibility.toUpperCase()} CREDIBILITY
      </Badge>
    );
  };

  const getConfidenceStars = (confidence: number) => {
    const stars = Math.round(confidence * 5);
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < stars ? "text-yellow-400 fill-current" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  const trustedSources = [
    "The Hindu", "Times of India", "Indian Express", "Thanthi TV", 
    "Polimer News", "Sun TV", "BBC", "Reuters", "Associated Press"
  ];

  return (
    <div className="min-h-screen bg-background py-8" data-testid="fake-news-detector-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center">
              <Shield className="mr-2 text-primary" />
              Fake News Detector
            </h1>
            <p className="text-xl text-muted-foreground">
              Verify news authenticity using advanced machine learning algorithms
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>News Content Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="news-content">News Article or Claim</Label>
                  <Textarea
                    id="news-content"
                    placeholder="Paste the news article or claim you want to verify..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className="resize-none"
                    data-testid="news-content-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="news-source">Source (Optional)</Label>
                  <Input
                    id="news-source"
                    placeholder="e.g., Times of India, BBC, etc."
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    data-testid="news-source-input"
                  />
                </div>

                <Button 
                  onClick={handleAnalyze} 
                  disabled={fakeNewsMutation.isPending}
                  className="w-full"
                  data-testid="analyze-button"
                >
                  {fakeNewsMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2" size={16} />
                      Analyze News
                    </>
                  )}
                </Button>

                {/* Trusted Sources Info */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm">Trusted Sources:</h4>
                  <div className="flex flex-wrap gap-1">
                    {trustedSources.map((source) => (
                      <Badge key={source} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Articles from these sources are automatically marked as highly credible.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Result</CardTitle>
              </CardHeader>
              <CardContent>
                {fakeNewsMutation.isPending ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Analyzing content...</span>
                  </div>
                ) : result ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Main Result */}
                    <div className={`border rounded-lg p-4 ${getResultColor(result.isReal, result.confidence)}`}>
                      <div className="flex items-center mb-2">
                        {getResultIcon(result.isReal, result.confidence)}
                        <h3 className="font-bold text-lg ml-2" data-testid="verification-result">
                          {result.isReal ? "LIKELY REAL" : "POTENTIALLY FAKE"}
                        </h3>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Confidence:</span>
                          {getConfidenceStars(result.confidence)}
                          <span className="text-sm" data-testid="confidence-score">
                            {Math.round(result.confidence * 100)}%
                          </span>
                        </div>
                        {getCredibilityBadge(result.sourceCredibility)}
                      </div>
                      
                      <p className="text-sm leading-relaxed" data-testid="analysis-explanation">
                        {result.explanation}
                      </p>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-primary">
                          {result.isReal ? "✓" : "✗"}
                        </div>
                        <div className="text-xs text-muted-foreground">Authenticity</div>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-primary">
                          {Math.round(result.confidence * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Confidence</div>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-primary">
                          {result.sourceCredibility.toUpperCase()}
                        </div>
                        <div className="text-xs text-muted-foreground">Source Trust</div>
                      </div>
                    </div>

                    {/* Verification Factors */}
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium mb-2">Verification Factors:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          Source credibility checked
                        </div>
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          Language pattern analysis
                        </div>
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          Content consistency review
                        </div>
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          AI fact-checking applied
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Enter news content above to start verification</p>
                    <p className="text-sm mt-2">
                      Our AI will analyze the content for authenticity markers
                    </p>
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
