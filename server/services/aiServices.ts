import OpenAI from "openai";

// ✅ Ensure environment variables are loaded
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error(
    "OPENROUTER_API_KEY is missing in your environment variables. Please add it to .env"
  );
}

// Create OpenRouter client
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://127.0.0.1:5000/", // Change to deployed domain in production
    "X-Title": "FlashPress News",
  },
});

// Optional: log to confirm environment variables loaded
console.log("ENV CHECK:", {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? "loaded" : "missing",
  OPENROUTER_API_BASE: process.env.OPENROUTER_API_BASE || "default",
  NODE_ENV: process.env.NODE_ENV,
});

export class AIService {
  async summarizeText(text: string, maxLength = 150): Promise<string> {
    try {
      const prompt = `Please summarize the following text in ${maxLength} words or less while maintaining key points:\n\n${text}`;

      const response = await openrouter.chat.completions.create({
        model: "deepseek/deepseek-r1",
        messages: [{ role: "user", content: prompt }],
        max_tokens: Math.max(maxLength * 2, 200),
      });

      return response.choices[0].message?.content || "Unable to generate summary";
    } catch (error: any) {
      console.error("Error in text summarization:", error.message || error);
      throw new Error("Failed to summarize text");
    }
  }

  async detectFakeNews(
    text: string,
    source?: string
  ): Promise<{
    isReal: boolean;
    confidence: number;
    explanation: string;
    sourceCredibility: "high" | "medium" | "low";
  }> {
    try {
      const trustedSources = [
        "thanthi",
        "polimer",
        "suntv",
        "times of india",
        "the hindu",
        "indian express",
      ];

      const sourceCredibility =
        source && trustedSources.some((trusted) => source.toLowerCase().includes(trusted))
          ? "high"
          : "medium";

      if (sourceCredibility === "high") {
        return {
          isReal: true,
          confidence: 0.95,
          explanation: "This news comes from a trusted and verified source.",
          sourceCredibility: "high",
        };
      }

      const prompt = `Analyze the following news text for authenticity and potential misinformation. Consider factors like:
      - Language patterns that suggest bias or sensationalism
      - Factual consistency and logical flow
      - Claims that seem extraordinary without evidence
      - Writing style and professionalism

      Respond with JSON in this format: { "isReal": boolean, "confidence": number (0-1), "explanation": string }

      Text to analyze: ${text}`;

      const response = await openrouter.chat.completions.create({
        model: "deepseek/deepseek-r1",
        messages: [
          {
            role: "system",
            content:
              "You are an expert fact-checker and misinformation detection specialist. Analyze news content for authenticity.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message?.content || "{}");

      return {
        isReal: result.isReal || false,
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        explanation: result.explanation || "Analysis completed",
        sourceCredibility: sourceCredibility as "high" | "medium" | "low",
      };
    } catch (error: any) {
      console.error("Error in fake news detection:", error.message || error);
      throw new Error("Failed to analyze news authenticity");
    }
  }

  async chatWithAI(message: string, context?: string): Promise<string> {
    try {
      const systemPrompt = `You are FlashPress News AI Assistant. You help users with:
      - News summarization and analysis
      - Fact-checking and verification
      - TNPSC exam preparation guidance
      - Current affairs discussions
      Be helpful, accurate, and concise in your responses.`;

      const userMessage = context
        ? `Context: ${context}\n\nUser Question: ${message}`
        : message;

      const response = await openrouter.chat.completions.create({
        model: "deepseek/deepseek-r1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 500,
      });

      return response.choices[0].message?.content || "I'm sorry, I couldn't process your request.";
    } catch (error: any) {
      console.error("Error in AI chat:", error.message || error);
      throw new Error("Failed to get AI response");
    }
  }
}

export const aiService = new AIService();
