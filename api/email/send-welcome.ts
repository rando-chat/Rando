import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    const { email, username } = await request.json();
    
    if (!email || !username) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await resend.emails.send({
      from: 'RANDO <hello@yourdomain.com>',
      to: email,
      subject: 'Welcome to RANDO! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #0f0f1a; color: #fff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 12px; padding: 40px; }
            .logo { font-size: 48px; font-weight: bold; background: linear-gradient(45deg, #D4AF37, #FB6962); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px; }
            .button { display: inline-block; background: #D4AF37; color: #0f0f1a; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">RANDO</div>
            <h2>Welcome, ${username}! 🎉</h2>
            <p>You're all set and ready to start chatting!</p>
            <h3>What you can do:</h3>
            <ul>
              <li>💬 Unlimited text chat with random people</li>
              <li>🔒 Safe environment with link blocking</li>
              <li>⚡ Smart matching algorithm</li>
              <li>👨‍🎓 Student discounts available</li>
            </ul>
            <a href="https://yourdomain.com/chat" class="button">Start Chatting</a>
            <h3>Want more features?</h3>
            <p>Upgrade to Premium for:</p>
            <ul>
              <li>📸 Image sharing</li>
              <li>⚡ Priority matching</li>
              <li>🚫 Ad-free experience</li>
            </ul>
            <p>Students get 50% off with .edu email!</p>
            <div style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
              <p>RANDO - Chat Randomly. Meet Authentically.</p>
              <p>© 2024 yourdomain.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Welcome email error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send welcome email' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}