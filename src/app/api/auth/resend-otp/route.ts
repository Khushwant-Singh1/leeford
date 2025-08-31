import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOtpEmail } from '@/lib/mailer';
import { getOtpRateLimiter } from '@/lib/rate-limiter';

export async function POST(req: Request) {
  const ratelimit = getOtpRateLimiter();
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Ensure the user exists but is NOT yet verified
  if (!user || user.isVerified) {
    return NextResponse.json({ message: 'If an account with this email exists, an OTP has been sent.' }, { status: 200 });
  }

  // CRITICAL: Invalidate all previous OTPs for this user
  await prisma.verificationCode.updateMany({
    where: { email: email, isUsed: false },
    data: { isUsed: true, expiresAt: new Date(0) } // Expire immediately
  });

  // Generate and send a new OTP (same logic as in the register endpoint)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.verificationCode.create({
    data: { code: otp, email, expiresAt },
  });

  await sendOtpEmail(email, otp);

  return NextResponse.json({ message: 'A new OTP has been sent to your email.' }, { status: 200 });
}