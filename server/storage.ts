import { type User, type InsertUser, type Article, type InsertArticle, type Comment, type InsertComment, type Like, type Bookmark, type InsertBookmark, type TnpscResource, type InsertTnpscResource, type ChatSession, type InsertChatSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Article operations
  getArticles(category?: string, limit?: number, offset?: number): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | undefined>;
  getArticleByUrl(url: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticleLikes(id: string, likes: number): Promise<void>;

  // Comment operations
  getCommentsByArticleId(articleId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  // Like operations
  getLikeByUserAndArticle(userId: string, articleId: string): Promise<Like | undefined>;
  createLike(userId: string, articleId: string): Promise<Like>;
  deleteLike(userId: string, articleId: string): Promise<void>;

  // Bookmark operations
  getBookmarksByUserId(userId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: string, resourceType: string, resourceId: string): Promise<void>;

  // TNPSC Resources
  getTnpscResources(category?: string, subject?: string, examStage?: string): Promise<TnpscResource[]>;
  createTnpscResource(resource: InsertTnpscResource): Promise<TnpscResource>;

  // Chat sessions
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getChatSessionsByUserId(userId: string): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: string, messages: Array<{role: string, content: string, timestamp: string}>): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private articles: Map<string, Article> = new Map();
  private comments: Map<string, Comment> = new Map();
  private likes: Map<string, Like> = new Map();
  private bookmarks: Map<string, Bookmark> = new Map();
  private tnpscResources: Map<string, TnpscResource> = new Map();
  private chatSessions: Map<string, ChatSession> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Initialize TNPSC resources
    const tnpscData = [
      {
        id: randomUUID(),
        title: "Tamil Nadu History",
        category: "book",
        subject: "History",
        examStage: "prelims",
        fileUrl: "/books/tamil-history.pdf",
        description: "Comprehensive guide to Tamil Nadu history for TNPSC prelims",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Indian Polity",
        category: "book", 
        subject: "Polity",
        examStage: "mains",
        fileUrl: "/books/indian-polity.pdf",
        description: "Complete coverage of Indian polity for TNPSC mains",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Geography Notes",
        category: "notes",
        subject: "Geography",
        examStage: "prelims",
        fileUrl: "/books/geography-notes.pdf",
        description: "Important geography notes for TNPSC preparation",
        createdAt: new Date(),
      }
    ];

    tnpscData.forEach(resource => {
      this.tnpscResources.set(resource.id, resource);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Article operations
  async getArticles(category?: string, limit = 20, offset = 0): Promise<Article[]> {
    const articles = Array.from(this.articles.values());
    const filtered = category && category !== 'all' 
      ? articles.filter(article => article.category === category)
      : articles;
    
    return filtered
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(offset, offset + limit);
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticleByUrl(url: string): Promise<Article | undefined> {
    return Array.from(this.articles.values()).find(article => article.url === url);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const article: Article = {
      ...insertArticle,
      id,
      likes: 0,
      createdAt: new Date(),
      content: insertArticle.content || null,
      description: insertArticle.description || null,
      imageUrl: insertArticle.imageUrl || null
    };
    this.articles.set(id, article);
    return article;
  }

  async updateArticleLikes(id: string, likes: number): Promise<void> {
    const article = this.articles.get(id);
    if (article) {
      this.articles.set(id, { ...article, likes });
    }
  }

  // Comment operations
  async getCommentsByArticleId(articleId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.articleId === articleId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }

  // Like operations
  async getLikeByUserAndArticle(userId: string, articleId: string): Promise<Like | undefined> {
    return Array.from(this.likes.values())
      .find(like => like.userId === userId && like.articleId === articleId);
  }

  async createLike(userId: string, articleId: string): Promise<Like> {
    const id = randomUUID();
    const like: Like = {
      id,
      userId,
      articleId,
      createdAt: new Date()
    };
    this.likes.set(id, like);
    return like;
  }

  async deleteLike(userId: string, articleId: string): Promise<void> {
    const like = Array.from(this.likes.values())
      .find(like => like.userId === userId && like.articleId === articleId);
    if (like) {
      this.likes.delete(like.id);
    }
  }

  // Bookmark operations
  async getBookmarksByUserId(userId: string): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const bookmark: Bookmark = {
      ...insertBookmark,
      id,
      createdAt: new Date()
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async deleteBookmark(userId: string, resourceType: string, resourceId: string): Promise<void> {
    const bookmark = Array.from(this.bookmarks.values())
      .find(b => b.userId === userId && b.resourceType === resourceType && b.resourceId === resourceId);
    if (bookmark) {
      this.bookmarks.delete(bookmark.id);
    }
  }

  // TNPSC Resources
  async getTnpscResources(category?: string, subject?: string, examStage?: string): Promise<TnpscResource[]> {
    let resources = Array.from(this.tnpscResources.values());
    
    if (category) {
      resources = resources.filter(r => r.category === category);
    }
    if (subject) {
      resources = resources.filter(r => r.subject === subject);
    }
    if (examStage) {
      resources = resources.filter(r => r.examStage === examStage);
    }
    
    return resources.sort((a, b) => a.title.localeCompare(b.title));
  }

  async createTnpscResource(insertResource: InsertTnpscResource): Promise<TnpscResource> {
    const id = randomUUID();
    const resource: TnpscResource = {
      ...insertResource,
      id,
      createdAt: new Date(),
      description: insertResource.description || null,
      fileUrl: insertResource.fileUrl || null
    };
    this.tnpscResources.set(id, resource);
    return resource;
  }

  // Chat sessions
  async getChatSession(id: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async getChatSessionsByUserId(userId: string): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const session: ChatSession = {
      id,
      userId: insertSession.userId || null,
      messages: insertSession.messages,
      createdAt: new Date()
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async updateChatSession(id: string, messages: Array<{role: string, content: string, timestamp: string}>): Promise<void> {
    const session = this.chatSessions.get(id);
    if (session) {
      this.chatSessions.set(id, { ...session, messages });
    }
  }
}

export const storage = new MemStorage();
