import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    const { email, code } = await request.json();
    
    if (!email || !code || !email.endsWith('.edu')) {
      return new Response(
        JSON.stringify({ error: 'Invalid student email or code' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await resend.emails.send({
      from: 'RANDO <hello@yourdomain.com>',
      to: email,
      subject: '🎓 Student Verification Successful!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #0f0f1a; color: #fff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 12px; padding: 40px; }
            .logo { font-size: 48px; font-weight: bold; background: linear-gradient(45deg, #D4AF37, #FB6962); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px; }
            .success-box { background: linear-gradient(45deg, #10B981, #059669); padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">RANDO</div>
            <div class="success-box">
              <h2>🎓 Student Verification Successful!</h2>
              <p>Your .edu email has been verified and you now have student access!</p>
            </div>
            <h3>Your Benefits:</h3>
            <ul>
              <li>✅ All Premium features unlocked</li>
              <li>✅ 50% discount (only $2.49/month!)</li>
              <li>✅ Image sharing enabled</li>
              <li>✅ Priority matching</li>
              <li>✅ Ad-free experience</li>
            </ul>
            <p>Your verification code: <strong>${code}</strong></p>
            <p>Thank you for verifying your student status!</p>
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
    console.error('Student verification email error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send student verification email' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}