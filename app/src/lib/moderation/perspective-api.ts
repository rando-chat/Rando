const PERSPECTIVE_API_KEY = process.env.NEXT_PUBLIC_PERSPECTIVE_API_KEY;

export interface ModerationResult {
  flagged: boolean;
  scores: Record<string, number>;
  reason?: string;
}

export async function moderateContent(content: string): Promise<ModerationResult> {
  try {
    // First, check for URLs (completely block all URLs)
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|org|net|edu|gov|io|co|app|xyz|me|tv|cc|uk|ca|de|fr|jp|cn|in|au|br|ru|nl|se|no|dk|fi|pl|it|es|be|ch|at|cz|gr|pt|ro|hu|sk|bg|hr|si|ee|lv|lt|cy|mt|lu|ie)[^\s]*)/gi;
    if (urlPattern.test(content)) {
      return {
        flagged: true,
        scores: {},
        reason: 'links_not_allowed',
      };
    }

    // Check for profanity (basic filter)
    const profanity = ['fuck', 'shit', 'bitch', 'ass', 'damn', 'penis', 'vagina', 'porn', 'sex', 'nude', 'dick', 'pussy', 'cock'];
    const lower = content.toLowerCase();
    for (const word of profanity) {
      if (lower.includes(word)) {
        return {
          flagged: true,
          scores: {},
          reason: 'profanity',
        };
      }
    }

    // Check for phone numbers and emails
    if (/\d{10,}/.test(content)) {
      return {
        flagged: true,
        scores: {},
        reason: 'phone_number',
      };
    }

    if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(content)) {
      return {
        flagged: true,
        scores: {},
        reason: 'email_address',
      };
    }

    // If Perspective API key is available, use it for advanced moderation
    if (PERSPECTIVE_API_KEY) {
      const response = await fetch(
        `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: { text: content },
            languages: ['en'],
            requestedAttributes: {
              TOXICITY: {},
              SEVERE_TOXICITY: {},
              IDENTITY_ATTACK: {},
              INSULT: {},
              PROFANITY: {},
              THREAT: {},
              SEXUALLY_EXPLICIT: {},
            },
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        console.error('Perspective API error:', data.error);
        return { flagged: false, scores: {} };
      }

      const scores: Record<string, number> = {};
      let flagged = false;
      let reason = '';

      for (const [attribute, info] of Object.entries(data.attributeScores || {})) {
        const score = (info as any).summaryScore.value;
        scores[attribute] = score;

        // Flag if any score is above threshold
        if (score > 0.7) {
          flagged = true;
          reason = attribute.toLowerCase();
        }
      }

      return { flagged, scores, reason };
    }

    // If no API key, just use basic moderation
    return { flagged: false, scores: {} };
  } catch (error) {
    console.error('Moderation error:', error);
    return { flagged: false, scores: {} };
  }
}