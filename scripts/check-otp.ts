// scripts/check-otp.ts
import { prisma } from '../src/lib/db';

async function checkOtpStatus() {
  try {
    const email = 'ccibrxhsga@bwmyga.com';
    
    console.log(`🔍 Checking OTP status for: ${email}`);
    
    // Find all verification codes for this email
    const otpCodes = await prisma.verificationCode.findMany({
      where: {
        email: email,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        code: true,
        attempts: true,
        isUsed: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    
    console.log(`📧 Found ${otpCodes.length} OTP codes:`);
    otpCodes.forEach((otp, index) => {
      console.log(`  ${index + 1}. ID: ${otp.id}`);
      console.log(`     Code: ${otp.code}`);
      console.log(`     Attempts: ${otp.attempts}`);
      console.log(`     Used: ${otp.isUsed}`);
      console.log(`     Expires: ${otp.expiresAt}`);
      console.log(`     Created: ${otp.createdAt}`);
      console.log(`     ---`);
    });
    
    // Find the current valid OTP
    const validOtp = await prisma.verificationCode.findFirst({
      where: {
        email: email,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    if (validOtp) {
      console.log(`✅ Current valid OTP: ${validOtp.code} (${validOtp.attempts} attempts used)`);
      console.log(`   Remaining attempts: ${5 - validOtp.attempts}`);
    } else {
      console.log(`❌ No valid OTP found`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOtpStatus();
