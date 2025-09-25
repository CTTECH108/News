interface NewsApiArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  content: string;
}

interface NewsApiResponse {
  articles: NewsApiArticle[];
  totalResults: number;
}

export class NewsApiService {
  private apiKey: string;
  private baseUrl = 'https://newsapi.org/v2';

  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || '58215056cd304f859765f89530f9301c';
    if (!this.apiKey) {
      console.warn('WARNING: NEWS_API_KEY not found. News features will return mock data.');
    }
  }

  async getTopHeadlines(category?: string, country = 'in', pageSize = 20, page = 1): Promise<NewsApiResponse> {
    if (!this.apiKey) {
      // Return mock data when API key is not available
      return {
        articles: [
          {
            title: "Sample News Article",
            description: "This is a sample news article. Please add your NEWS_API_KEY to get real news.",
            url: "https://example.com",
            urlToImage: "https://picsum.photos/400/200",
            publishedAt: new Date().toISOString(),
            source: { name: "Sample Source" },
            content: "Sample content for testing purposes."
          }
        ],
        totalResults: 1
      };
    }
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      country,
      pageSize: pageSize.toString(),
      page: page.toString(),
    });

    if (category && category !== 'all') {
      params.append('category', category);
    }

    const url = `${this.baseUrl}/top-headlines?${params}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.status === 'error') {
        throw new Error(`NewsAPI error: ${data.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  }

  async searchArticles(query: string, pageSize = 20, page = 1): Promise<NewsApiResponse> {
    if (!this.apiKey) {
      // Return mock data when API key is not available
      return {
        articles: [],
        totalResults: 0
      };
    }
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      q: query,
      pageSize: pageSize.toString(),
      page: page.toString(),
      sortBy: 'publishedAt',
      language: 'en',
    });

    const url = `${this.baseUrl}/everything?${params}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.status === 'error') {
        throw new Error(`NewsAPI error: ${data.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error searching articles:', error);
      throw error;
    }
  }
}

export const newsApiService = new NewsApiService();
