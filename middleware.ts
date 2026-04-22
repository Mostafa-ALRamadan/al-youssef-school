import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Temporarily disabled - using client-side auth checks only
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
