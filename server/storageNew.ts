import { type User, type InsertUser, type Article, type InsertArticle, type Comment, type InsertComment, type Like, type Bookmark, type InsertBookmark, type TnpscResource, type InsertTnpscResource, type ChatSession, type InsertChatSession } from "@shared/schema";
import { users, articles, comments, likes, bookmarks, tnpscResources, chatSessions } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Article operations
  async getArticles(category?: string, limit = 20, offset = 0): Promise<Article[]> {
    let query = db.select().from(articles).orderBy(desc(articles.publishedAt));
    
    if (category && category !== 'all') {
      query = query.where(eq(articles.category, category));
    }
    
    return await query.limit(limit).offset(offset);
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article || undefined;
  }

  async getArticleByUrl(url: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.url, url));
    return article || undefined;
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const [article] = await db
      .insert(articles)
      .values(insertArticle)
      .returning();
    return article;
  }

  async updateArticleLikes(id: string, likesCount: number): Promise<void> {
    await db
      .update(articles)
      .set({ likes: likesCount })
      .where(eq(articles.id, id));
  }

  // Comment operations
  async getCommentsByArticleId(articleId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.articleId, articleId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  // Like operations
  async getLikeByUserAndArticle(userId: string, articleId: string): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.articleId, articleId)));
    return like || undefined;
  }

  async createLike(userId: string, articleId: string): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values({ userId, articleId })
      .returning();
    return like;
  }

  async deleteLike(userId: string, articleId: string): Promise<void> {
    await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.articleId, articleId)));
  }

  // Bookmark operations
  async getBookmarksByUserId(userId: string): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const [bookmark] = await db
      .insert(bookmarks)
      .values(insertBookmark)
      .returning();
    return bookmark;
  }

  async deleteBookmark(userId: string, resourceType: string, resourceId: string): Promise<void> {
    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.resourceType, resourceType),
          eq(bookmarks.resourceId, resourceId)
        )
      );
  }

  // TNPSC Resources
  async getTnpscResources(category?: string, subject?: string, examStage?: string): Promise<TnpscResource[]> {
    let query = db.select().from(tnpscResources).orderBy(desc(tnpscResources.createdAt));
    
    const conditions = [];
    if (category) conditions.push(eq(tnpscResources.category, category));
    if (subject) conditions.push(eq(tnpscResources.subject, subject));
    if (examStage) conditions.push(eq(tnpscResources.examStage, examStage));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async createTnpscResource(insertResource: InsertTnpscResource): Promise<TnpscResource> {
    const [resource] = await db
      .insert(tnpscResources)
      .values(insertResource)
      .returning();
    return resource;
  }

  // Chat sessions
  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session || undefined;
  }

  async getChatSessionsByUserId(userId: string): Promise<ChatSession[]> {
    return await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.createdAt));
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateChatSession(id: string, messages: Array<{role: string, content: string, timestamp: string}>): Promise<void> {
    await db
      .update(chatSessions)
      .set({ messages })
      .where(eq(chatSessions.id, id));
  }
}

export const storage = new DatabaseStorage();