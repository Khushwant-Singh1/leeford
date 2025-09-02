// scripts/test-max-attempts.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMaxAttempts() {
  try {
    const email = 'ccibrxhsga@bwmyga.com';
    
    console.log(`🧪 Testing max attempts for: ${email}`);
    
    // Update the current OTP to have 5 attempts (max)
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
      console.log(`📧 Current OTP: ${validOtp.code} (${validOtp.attempts} attempts)`);
      
      // Set attempts to 4 so next failed attempt will trigger max attempts
      await prisma.verificationCode.update({
        where: { id: validOtp.id },
        data: { attempts: 4 }
      });
      
      console.log(`✅ Set attempts to 4. Next failed attempt will trigger max attempts exceeded.`);
      console.log(`🔴 Try entering a wrong OTP now to see the "resend OTP" button.`);
      
    } else {
      console.log(`❌ No valid OTP found`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMaxAttempts();
