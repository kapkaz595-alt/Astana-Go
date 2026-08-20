import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/supabase/admin-auth-middleware';
import type { AdminSession } from '@/lib/supabase/admin-session';

export const GET = withAdminAuth(async (
  session: AdminSession,
  _request: NextRequest,
  _context: { params: Promise<Record<string, string>> }
) => {
  return NextResponse.json({ success: true, data: session });
});