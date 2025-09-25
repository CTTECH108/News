export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  imageUrl: string;
  category: string;
  source: string;
  publishedAt: string;
  likes: number;
  createdAt: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  icon: string;
}

export const NEWS_CATEGORIES: NewsCategory[] = [
  { id: 'all', name: 'All News', icon: 'globe' },
  { id: 'sports', name: 'Sports', icon: 'football-ball' },
  { id: 'politics', name: 'Politics', icon: 'landmark' },
  { id: 'technology', name: 'Technology', icon: 'microchip' },
  { id: 'entertainment', name: 'Entertainment', icon: 'film' },
  { id: 'business', name: 'Business', icon: 'chart-line' },
  { id: 'health', name: 'Health', icon: 'heartbeat' },
];
