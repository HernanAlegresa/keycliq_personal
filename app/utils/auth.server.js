import { prisma } from "./db.server.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "./email.server.js";


export async function register(email, password) {
  const hash = await bcrypt.hash(password, 12);
  return prisma.user.create({ data: { email, password: hash } });
}


export async function verifyLogin(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;
  return user;
}

export async function getUserById(userId) {
  return prisma.user.findUnique({ 
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          keys: true
        }
      }
    }
  });
}

// Forgot Password Functions
export async function cleanupExpiredTokens() {
  // Clean up expired tokens (run this periodically)
  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true }
      ]
    }
  });
}

export async function createPasswordResetToken(email) {
  // Clean up expired tokens first
  await cleanupExpiredTokens();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if email exists or not
    return { success: true };
  }

  // Rate limiting: Check if user has requested reset in last 5 minutes
  const recentToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      }
    }
  });

  if (recentToken) {
    // Don't reveal rate limiting, just return success
    return { success: true };
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(token, 12);
  
  // Expire in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id }
  });

  // Create new token
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  // Send email
  try {
    await sendPasswordResetEmail(user.email, token);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    // Clean up token if email fails
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });
    throw new Error('Failed to send password reset email');
  }
}

export async function validatePasswordResetToken(token) {
  // Get only non-expired, unused tokens
  const resetTokens = await prisma.passwordResetToken.findMany({
    where: {
      used: false,
      expiresAt: {
        gt: new Date()
      }
    },
    include: { user: true }
  });

  // Find the token that matches
  for (const resetToken of resetTokens) {
    const isValid = await bcrypt.compare(token, resetToken.tokenHash);
    if (isValid) {
      return resetToken.user;
    }
  }

  return null;
}

export async function resetPassword(token, newPassword) {
  // Get only non-expired, unused tokens
  const resetTokens = await prisma.passwordResetToken.findMany({
    where: {
      used: false,
      expiresAt: {
        gt: new Date()
      }
    },
    include: { user: true }
  });

  // Find the token that matches
  let matchingToken = null;
  for (const resetToken of resetTokens) {
    const isValid = await bcrypt.compare(token, resetToken.tokenHash);
    if (isValid) {
      matchingToken = resetToken;
      break;
    }
  }

  if (!matchingToken) {
    throw new Error('Invalid or expired token');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update password and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: matchingToken.userId },
      data: { password: passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: matchingToken.id },
      data: { used: true }
    })
  ]);

  return { success: true };
}