import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { email, partnerGroup } = await request.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: 'A valid email address is required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'A user with this email already exists' }, { status: 409 });
    }

    const group = typeof partnerGroup === 'string' && partnerGroup !== 'Default'
      ? await prisma.partnerGroup.findFirst({ where: { name: partnerGroup } })
      : null;
    if (partnerGroup && partnerGroup !== 'Default' && !group) {
      return NextResponse.json({ success: false, error: 'Partner group not found' }, { status: 400 });
    }

    const existingInvitation = await prisma.partnerInvitation.findFirst({
      where: { email: normalizedEmail, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvitation) {
      return NextResponse.json({ success: false, error: 'An active invitation has already been sent to this email' }, { status: 409 });
    }

    const token = randomBytes(32).toString('hex');
    const invitation = await prisma.partnerInvitation.create({
      data: {
        token,
        email: normalizedEmail,
        partnerGroupId: group?.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
    if (!appUrl) {
      await prisma.partnerInvitation.delete({ where: { id: invitation.id } });
      return NextResponse.json({ success: false, error: 'NEXT_PUBLIC_APP_URL is not configured' }, { status: 500 });
    }

    const emailResult = await emailService.sendPartnerInvitationEmail({
      email: normalizedEmail,
      invitationUrl: `${appUrl}/register?invite=${token}`,
      partnerGroupName: group?.name,
    });
    if (!emailResult.success) {
      await prisma.partnerInvitation.delete({ where: { id: invitation.id } });
      return NextResponse.json({ success: false, error: 'Failed to send invitation email' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Invitation email sent' }, { status: 201 });
  } catch (error) {
    console.error('Partner invitation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send invitation' }, { status: 500 });
  }
}
