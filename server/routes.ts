import type { Express, Request, Response } from "express";

// Extend Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
      };
    }
  }
}
import { createServer, type Server } from "http";
import multer from "multer";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { newsApiService } from "./services/newsApi";
import { aiService } from "./services/aiServices";
import { authService } from "./services/authService";
import { insertUserSchema, insertCommentSchema, insertBookmarkSchema } from "@shared/schema";
// import pdfParse from "pdf-parse";
import { YoutubeTranscript } from "youtube-transcript";

// Middleware for JWT authentication
const authenticateToken = (req: any, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
};

// Optional auth middleware
const optionalAuth = (req: any, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = authService.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
};

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const result = await authService.register(userData);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
      }
      
      const result = await authService.login(username, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  });

  // News routes
  app.get("/api/news", async (req: Request, res: Response) => {
    try {
      const { category, page = '1', limit = '20' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      
      // First try to get from storage
      const storedArticles = await storage.getArticles(
        category as string, 
        limitNum, 
        (pageNum - 1) * limitNum
      );

      if (storedArticles.length > 0) {
        return res.json({ articles: storedArticles });
      }

      // If no stored articles, fetch from NewsAPI
      const newsData = await newsApiService.getTopHeadlines(
        category as string,
        'in',
        limitNum,
        pageNum
      );

      // Store articles in database
      const articles = [];
      for (const apiArticle of newsData.articles) {
        if (apiArticle.title && apiArticle.url) {
          // Check if article already exists
          const existing = await storage.getArticleByUrl(apiArticle.url);
          if (!existing) {
            try {
              const article = await storage.createArticle({
                title: apiArticle.title,
                description: apiArticle.description || '',
                content: apiArticle.content || '',
                url: apiArticle.url,
                imageUrl: apiArticle.urlToImage || '',
                category: (category as string) || 'general',
                source: apiArticle.source.name,
                publishedAt: new Date(apiArticle.publishedAt),
              });
              articles.push(article);
            } catch (error) {
              console.error('Error storing article:', error);
            }
          } else {
            articles.push(existing);
          }
        }
      }

      res.json({ articles });
    } catch (error: any) {
      console.error('Error fetching news:', error);
      res.status(500).json({ message: 'Failed to fetch news articles' });
    }
  });

  // Summarization routes
  app.post("/api/summarize/text", async (req: Request, res: Response) => {
    try {
      const { text, maxLength = 150 } = req.body;
      if (!text) {
        return res.status(400).json({ message: 'Text is required' });
      }
      
      const summary = await aiService.summarizeText(text, maxLength);
      res.json({ summary });
    } catch (error: any) {
      console.error('Error summarizing text:', error);
      res.status(500).json({ message: 'Failed to summarize text' });
    }
  });

  app.post("/api/summarize/url", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      // Fetch content from URL
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(400).json({ message: 'Failed to fetch content from URL' });
      }

      const html = await response.text();
      // Simple text extraction (in production, use a proper HTML parser)
      const text = html.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000); // Limit to 5000 chars

      const summary = await aiService.summarizeText(text);
      res.json({ summary, extractedText: text.substring(0, 500) + '...' });
    } catch (error: any) {
      console.error('Error summarizing URL:', error);
      res.status(500).json({ message: 'Failed to summarize URL content' });
    }
  });

  app.post("/api/summarize/pdf", upload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'PDF file is required' });
      }

      // Parse PDF
      // const pdfData = await pdfParse(req.file.buffer);
      // const text = pdfData.text;
      const text = "PDF parsing temporarily disabled. Please check server configuration.";

      if (!text.trim()) {
        return res.status(400).json({ message: 'No text found in PDF' });
      }

      const summary = await aiService.summarizeText(text);
      res.json({ summary, extractedText: text.substring(0, 500) + '...' });
    } catch (error: any) {
      console.error('Error summarizing PDF:', error);
      res.status(500).json({ message: 'Failed to summarize PDF' });
    }
  });

  app.post("/api/summarize/youtube", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: 'YouTube URL is required' });
      }

      // Extract video ID from URL
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (!videoId) {
        return res.status(400).json({ message: 'Invalid YouTube URL' });
      }

      // Get transcript
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      const text = transcript.map(item => item.text).join(' ');

      if (!text.trim()) {
        return res.status(400).json({ message: 'No transcript available for this video' });
      }

      const summary = await aiService.summarizeText(text);
      res.json({ summary, extractedText: text.substring(0, 500) + '...' });
    } catch (error: any) {
      console.error('Error summarizing YouTube video:', error);
      res.status(500).json({ message: 'Failed to get YouTube transcript or summarize video' });
    }
  });

  // Fake news detection
  app.post("/api/fakecheck", async (req: Request, res: Response) => {
    try {
      const { text, source } = req.body;
      if (!text) {
        return res.status(400).json({ message: 'Text is required' });
      }

      const result = await aiService.detectFakeNews(text, source);
      res.json(result);
    } catch (error: any) {
      console.error('Error checking fake news:', error);
      res.status(500).json({ message: 'Failed to check news authenticity' });
    }
  });

  // AI Chat
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message, context, sessionId } = req.body;
      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }

      const response = await aiService.chatWithAI(message, context);
      
      // Save chat session if user is authenticated
      if (req.user && sessionId) {
        try {
          const session = await storage.getChatSession(sessionId);
          const newMessage = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
          };
          const aiResponse = {
            role: 'assistant', 
            content: response,
            timestamp: new Date().toISOString()
          };

          if (session) {
            const updatedMessages = [...session.messages, newMessage, aiResponse];
            await storage.updateChatSession(sessionId, updatedMessages);
          } else {
            await storage.createChatSession({
              userId: req.user.userId,
              messages: [newMessage, aiResponse]
            });
          }
        } catch (error) {
          console.error('Error saving chat session:', error);
        }
      }

      res.json({ response });
    } catch (error: any) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ message: 'Failed to get AI response' });
    }
  });

  // TNPSC Resources
  app.get("/api/tnpsc/resources", async (req: Request, res: Response) => {
    try {
      const { category, subject, examStage } = req.query;
      const resources = await storage.getTnpscResources(
        category as string,
        subject as string,
        examStage as string
      );
      res.json({ resources });
    } catch (error: any) {
      console.error('Error fetching TNPSC resources:', error);
      res.status(500).json({ message: 'Failed to fetch TNPSC resources' });
    }
  });

  app.get("/api/tnpsc/syllabus", async (req: Request, res: Response) => {
    try {
      // Return TNPSC syllabus data
      const syllabus = {
        prelims: {
          "General Studies": {
            "History": ["Ancient Indian History", "Medieval Indian History", "Modern Indian History", "Tamil Nadu History"],
            "Geography": ["Physical Geography", "Human Geography", "Indian Geography", "Tamil Nadu Geography"],
            "Polity": ["Constitution", "Fundamental Rights", "Directive Principles", "Local Governance"],
            "Economics": ["Microeconomics", "Macroeconomics", "Indian Economy", "Tamil Nadu Economy"],
            "General Science": ["Physics", "Chemistry", "Biology", "Environmental Science"],
            "Current Affairs": ["National", "International", "State Level", "Awards and Honors"]
          }
        },
        mains: {
          "Paper 1": ["Tamil Language and Literature", "English Language"],
          "Paper 2": ["General Studies", "Aptitude and Mental Ability"],
          "Paper 3": ["General Studies", "Essay Writing"],
          "Paper 4": ["Optional Subject"]
        }
      };
      res.json(syllabus);
    } catch (error: any) {
      console.error('Error fetching syllabus:', error);
      res.status(500).json({ message: 'Failed to fetch syllabus' });
    }
  });

  // Article interactions (likes, comments)
  app.post("/api/articles/:id/like", authenticateToken, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const existingLike = await storage.getLikeByUserAndArticle(userId, id);
      const article = await storage.getArticleById(id);
      
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }

      if (existingLike) {
        // Unlike
        await storage.deleteLike(userId, id);
        const newLikes = Math.max(0, (article.likes || 0) - 1);
        await storage.updateArticleLikes(id, newLikes);
        res.json({ liked: false, likes: newLikes });
      } else {
        // Like
        await storage.createLike(userId, id);
        const newLikes = (article.likes || 0) + 1;
        await storage.updateArticleLikes(id, newLikes);
        res.json({ liked: true, likes: newLikes });
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      res.status(500).json({ message: 'Failed to toggle like' });
    }
  });

  app.get("/api/articles/:id/comments", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const comments = await storage.getCommentsByArticleId(id);
      res.json({ comments });
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });

  app.post("/api/articles/:id/comments", authenticateToken, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        articleId: id,
        userId
      });
      
      const comment = await storage.createComment(commentData);
      res.json({ comment });
    } catch (error: any) {
      console.error('Error creating comment:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Bookmarks
  app.get("/api/bookmarks", authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const bookmarks = await storage.getBookmarksByUserId(userId);
      res.json({ bookmarks });
    } catch (error: any) {
      console.error('Error fetching bookmarks:', error);
      res.status(500).json({ message: 'Failed to fetch bookmarks' });
    }
  });

  app.post("/api/bookmarks", authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const bookmarkData = insertBookmarkSchema.parse({
        ...req.body,
        userId
      });
      
      const bookmark = await storage.createBookmark(bookmarkData);
      res.json({ bookmark });
    } catch (error: any) {
      console.error('Error creating bookmark:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/bookmarks", authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const { resourceType, resourceId } = req.body;
      
      await storage.deleteBookmark(userId, resourceType, resourceId);
      res.json({ message: 'Bookmark removed' });
    } catch (error: any) {
      console.error('Error removing bookmark:', error);
      res.status(500).json({ message: 'Failed to remove bookmark' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
