import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Newspaper } from "lucide-react";
import { NewsArticle } from "@/types/news";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface NewsCardProps {
  article: NewsArticle;
  onLike?: (articleId: string, liked: boolean) => void;
  onShare?: (article: NewsArticle) => void;
}

export function NewsCard({ article, onLike, onShare }: NewsCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(article.likes);
  const [isLiking, setIsLiking] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case 'breaking':
        return 'destructive';
      case 'sports':
        return 'secondary';
      case 'politics':
        return 'outline';
      case 'technology':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to like articles",
        variant: "destructive",
      });
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/articles/${article.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      setLiked(data.liked);
      setLikesCount(data.likes);
      onLike?.(article.id, data.liked);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    onShare?.(article);
    
    // Copy to clipboard
    navigator.clipboard.writeText(article.url).then(() => {
      toast({
        title: "Link copied",
        description: "Article link copied to clipboard",
      });
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      data-testid={`news-card-${article.id}`}
    >
      <Card className="news-card-hover overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
        {article.imageUrl && (
          <div className="relative overflow-hidden">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
              data-testid={`article-image-${article.id}`}
            />
          </div>
        )}
        
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Badge 
              variant={getCategoryBadgeVariant(article.category)}
              className="text-xs font-medium uppercase"
              data-testid={`article-category-${article.id}`}
            >
              {article.category}
            </Badge>
            <span className="text-muted-foreground text-sm" data-testid={`article-time-${article.id}`}>
              {formatTimeAgo(article.publishedAt)}
            </span>
          </div>
          
          <h2 
            className="text-xl font-bold mb-3 line-clamp-2 hover:text-primary transition-colors cursor-pointer"
            onClick={() => window.open(article.url, '_blank')}
            data-testid={`article-title-${article.id}`}
          >
            {article.title}
          </h2>
          
          <p className="text-muted-foreground mb-4 line-clamp-3" data-testid={`article-description-${article.id}`}>
            {article.description}
          </p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <Newspaper className="mr-2" size={16} />
              <span data-testid={`article-source-${article.id}`}>{article.source}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex items-center space-x-1 transition-colors",
                  liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-primary"
                )}
                onClick={handleLike}
                disabled={isLiking}
                data-testid={`like-button-${article.id}`}
              >
                <Heart 
                  size={16} 
                  className={cn(liked && "fill-current")} 
                />
                <span>{likesCount}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => {
                  // TODO: Implement comments modal/page
                  toast({
                    title: "Coming soon",
                    description: "Comments feature will be available soon",
                  });
                }}
                data-testid={`comment-button-${article.id}`}
              >
                <MessageCircle size={16} />
                <span>0</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={handleShare}
                data-testid={`share-button-${article.id}`}
              >
                <Share2 size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
