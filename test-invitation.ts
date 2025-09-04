// Test script to verify Prisma client has invitation model
import { prisma } from '@/lib/db';

async function testInvitationModel() {
  try {
    console.log('Testing Prisma client...');
    
    // Test that we can access the invitation model
    const count = await prisma.invitation.count();
    console.log('✅ Invitation model is accessible, current count:', count);
    
    // Test enum import
    const { InvitationStatus } = await import('@prisma/client');
    console.log('✅ InvitationStatus enum imported:', Object.keys(InvitationStatus));
    
  } catch (error) {
    console.error('❌ Error testing invitation model:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInvitationModel();
