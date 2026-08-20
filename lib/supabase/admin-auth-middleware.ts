import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, type AdminSession } from './admin-session';

type AdminRole = AdminSession['role'];

type RouteContext = { params: Promise<Record<string, string>> };

type Handler = (
  session: AdminSession,
  request: NextRequest,
  context: RouteContext
) => Promise<NextResponse>;

export function withAdminAuth(handler: Handler) {
  return async (request: NextRequest, context: RouteContext): Promise<NextResponse> => {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '未登录或登录已过期' } },
        { status: 401 }
      );
    }
    return handler(session, request, context);
  };
}

export function requireAdminRole(session: AdminSession, allowed: AdminRole[]): boolean {
  return allowed.includes(session.role);
}