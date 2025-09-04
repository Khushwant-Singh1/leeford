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

/**
 * Sends a password reset email to a user.
 * @param to The recipient's email address.
 * @param token The password reset token.
 */
export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`; // Assuming NEXTAUTH_URL is set
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset Request</h1>
      <p>You have requested a password reset. Please click the link below to reset your password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
    `,
    text: `You have requested a password reset. Please use the following link to reset your password: ${resetLink}. This link is valid for 1 hour. If you did not request this, please ignore this email.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', to);
  } catch (error) {
    console.error('💥 Failed to send password reset email:', error);
    throw new Error('Could not send password reset email.');
  }
};

/**
 * Sends an invitation email to a new user.
 * @param to The recipient's email address.
 * @param invitationUrl The unique URL to accept the invitation.
 * @param role The role the user will have when they accept.
 */
export const sendInvitationEmail = async (to: string, invitationUrl: string, role: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: 'You have been invited to join Leeford',
    html: `
      <h1>You're Invited!</h1>
      <p>You have been invited to join the Leeford platform as a <strong>${role}</strong>. Please click the link below to create your account.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${invitationUrl}" target="_blank" style="padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Accept Invitation</a>
      </div>
      <p><strong>This invitation is valid for 48 hours.</strong></p>
      <p>If you did not expect this invitation, please ignore this email.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #666;">If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="${invitationUrl}">${invitationUrl}</a></p>
    `,
    text: `You have been invited to join the Leeford platform as a ${role}. Please use the following link to create your account: ${invitationUrl}. This invitation is valid for 48 hours. If you did not expect this invitation, please ignore this email.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Invitation email sent to:', to);
  } catch (error) {
    console.error('💥 Failed to send invitation email:', error);
    throw new Error('Could not send invitation email.');
  }
};