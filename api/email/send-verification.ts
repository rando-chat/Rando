import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    const { email, isStudent } = await request.json();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit code using Web Crypto API (Edge compatible)
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = (100000 + (array[0] % 900000)).toString();
    
    let subject = 'Your RANDO Verification Code';
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #0f0f1a; color: #fff; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 12px; padding: 40px; }
          .logo { font-size: 48px; font-weight: bold; background: linear-gradient(45deg, #D4AF37, #FB6962); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px; }
          .code { font-size: 36px; font-weight: bold; color: #D4AF37; background: #2E235E; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; letter-spacing: 8px; }
          .footer { color: #888; font-size: 12px; margin-top: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">RANDO</div>
          <h2>Verify Your Email</h2>
          <p>Thanks for signing up! Enter this code to verify your email:</p>
          <div class="code">${code}</div>
          <p>This code expires in 10 minutes.</p>
          ${isStudent ? '<p>🎓 <strong>Student verification:</strong> Your .edu email qualifies you for 50% discount!</p>' : ''}
          <p>If you didn't request this, please ignore this email.</p>
          <div class="footer">
            <p>RANDO - Chat Randomly. Meet Authentically.</p>
            <p>© 2024 yourdomain.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (isStudent) {
      subject = '🎓 Student Verification - RANDO';
      html = html.replace('Verify Your Email', 'Student Email Verification');
    }

    await resend.emails.send({
      from: 'RANDO <hello@deskchatapp.com>',
      to: email,
      subject,
      html,
    });

    return new Response(
      JSON.stringify({ success: true, code }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send verification email' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}