import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CategoryFilter } from "@/components/CategoryFilter";
import { NewsCard } from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NewsArticle } from "@/types/news";
import { 
  Zap, 
  FileText, 
  Shield, 
  Bot, 
  GraduationCap,
  Plus,
  ArrowRight,
  TrendingUp,
  Users,
  Clock,
  Globe
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);

  const { data: newsData, isLoading, error } = useQuery({
    queryKey: ['/api/news', selectedCategory, page],
    enabled: true,
  });

  const articles = (newsData as any)?.articles || [];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1); // Reset page when category changes
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const aiTools = [
    {
      title: "AI Summarizer",
      description: "Get instant summaries of articles, PDFs, and YouTube videos using advanced AI",
      icon: FileText,
      href: "/summarizer",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Fake News Detector", 
      description: "Verify news authenticity with our advanced machine learning algorithms",
      icon: Shield,
      href: "/fake-detector",
      color: "bg-destructive/10 text-destructive",
    },
    {
      title: "AI Chatbot",
      description: "Chat with our AI assistant for news insights and quick summaries",
      icon: Bot,
      href: "/chatbot", 
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "TNPSC Resources",
      description: "Comprehensive study materials and syllabus for TNPSC preparation",
      icon: GraduationCap,
      href: "/tnpsc",
      color: "bg-green-500/10 text-green-500",
    },
  ];

  const stats = [
    { label: "Daily Articles", value: "1000+", icon: Globe },
    { label: "AI Powered Tools", value: "4", icon: Bot },
    { label: "Categories", value: "6", icon: TrendingUp },
    { label: "Updates", value: "24/7", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            data-testid="hero-section"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                AI-Powered News
              </span>
              <br />
              <span className="text-foreground">at Your Fingertips</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Get the latest news, AI-powered summaries, fake news detection, and comprehensive TNPSC resources all in one place.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className={index === 0 ? "stat-card text-white" : "bg-card border border-border"}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-center mb-2">
                          <Icon size={24} className={index === 0 ? "text-white" : "text-primary"} />
                        </div>
                        <div className={`text-3xl font-bold ${index === 0 ? "text-white" : "text-primary"}`}>
                          {stat.value}
                        </div>
                        <div className={`text-sm ${index === 0 ? "text-white/90" : "text-muted-foreground"}`}>
                          {stat.label}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* News Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </section>

      {/* News Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="news-feed">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load news articles. Please try again later.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article: NewsArticle) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>

            {articles.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No articles found for the selected category.</p>
              </div>
            )}

            {/* Load More Button */}
            {articles.length > 0 && (
              <div className="text-center mt-12">
                <Button onClick={handleLoadMore} size="lg" data-testid="load-more-button">
                  <Plus className="mr-2" size={16} />
                  Load More Articles
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* AI Tools Showcase */}
      <section className="bg-muted/30 py-16" data-testid="ai-tools-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">AI-Powered Tools</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of news consumption with our advanced AI tools
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aiTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 group h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${tool.color}`}>
                        <Icon size={24} />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{tool.title}</h3>
                      <p className="text-muted-foreground mb-4 flex-grow">
                        {tool.description}
                      </p>
                      <Link href={tool.href}>
                        <Button variant="ghost" className="w-full justify-between group">
                          Try Now 
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
