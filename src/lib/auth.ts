// Authentication and session management for the affiliate platform
import { type User, Role, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string; // 'affiliate' or 'admin' from the form
  invitationToken?: string;
}

class AuthService {
  private readonly TOKEN_EXPIRY_HOURS = 24;

  private generateReferralCode(name: string): string {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
    return `${cleanName.substr(0, 6)}-${random}`;
  }

  /**
   * Register a new user and create their profile.
   * This is a server-side only method.
   */
  async register(data: RegisterData): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Self-service registrations authenticate by email OTP, so affiliates
      // must be active immediately in order to receive and verify that code.
      const userRoleLower = data.role.toLowerCase();
      const initialStatus = data.invitationToken ? 'PENDING' : 'ACTIVE';

      const user = await prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({ where: { email: data.email } });
        if (existingUser) throw new Error('User already exists with this email');

        const invitation = data.invitationToken
          ? await tx.partnerInvitation.findUnique({ where: { token: data.invitationToken } })
          : null;
        if (data.invitationToken && (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date())) {
          throw new Error('This invitation is invalid or has expired');
        }
        if (invitation && invitation.email !== data.email.toLowerCase()) {
          throw new Error('This invitation was sent to a different email address');
        }

        const createdUser = await tx.user.create({
          data: {
            email: data.email,
            name: data.name,
            password: hashedPassword,
            role: data.role.toUpperCase() as Role,
            status: initialStatus as UserStatus,
          },
        });

        if (userRoleLower === 'affiliate') {
          await tx.affiliate.create({
            data: {
              userId: createdUser.id,
              referralCode: this.generateReferralCode(data.name),
              payoutDetails: {},
              balanceCents: 0,
              partnerGroupId: invitation?.partnerGroupId,
            },
          });
        }
        if (invitation) {
          await tx.partnerInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
        }
        return createdUser;
      });

      return {
        success: true,
        message: 'Registration successful',
        user: user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Registration failed' };
    }
  }

  /**
   * Update a user's password.
   * Server-side only.
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, message: 'Password update failed' };
    }
  }
}

export const auth = new AuthService();
