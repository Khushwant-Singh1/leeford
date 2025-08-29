// lib/mailer.ts
import nodemailer from 'nodemailer';

// ... (keep your existing transporter configuration)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});


/**
 * Sends an OTP email to a user.
 * @param to The recipient's email address.
 * @param otp The One-Time Password.
 */
export const sendOtpEmail = async (to: string, otp: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: 'Your Verification Code',
    html: `
      <h1>Your Verification Code</h1>
      <p>Please use the following code to verify your account. The code is valid for 10 minutes.</p>
      <h2 style="font-size: 24px; letter-spacing: 4px; text-align: center;">${otp}</h2>
      <p>If you did not request this, please ignore this email.</p>
    `,
    text: `Your verification code is: ${otp}. It is valid for 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent to:', to);
  } catch (error) {
    console.error('💥 Failed to send OTP email:', error);
    throw new Error('Could not send OTP email.');
  }
};

// You can keep or remove the old sendVerificationEmail function