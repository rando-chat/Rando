export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    const { content } = await request.json();
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No content provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Basic moderation (no external API needed)
    const flagged = {
      links: false,
      profanity: false,
      personal_info: false,
      harassment: false,
    };

    // Check for URLs
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|org|net|edu|gov|io|co|app|xyz|me|tv|cc)[^\s]*)/gi;
    flagged.links = urlPattern.test(content);

    // Check for profanity
    const profanity = ['fuck', 'shit', 'bitch', 'ass', 'damn', 'penis', 'vagina', 'porn', 'sex', 'nude'];
    const lower = content.toLowerCase();
    flagged.profanity = profanity.some(word => lower.includes(word));

    // Check for personal information
    flagged.personal_info = /\d{10,}/.test(content) || /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(content);

    // Check for harassment keywords
    const harassment = ['kill', 'die', 'hate', 'stupid', 'idiot', 'worthless'];
    flagged.harassment = harassment.some(word => lower.includes(word));

    const isFlagged = Object.values(flagged).some(value => value);

    return new Response(
      JSON.stringify({
        flagged: isFlagged,
        details: flagged,
        safe: !isFlagged,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Moderation error:', error);
    return new Response(
      JSON.stringify({ error: 'Moderation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}