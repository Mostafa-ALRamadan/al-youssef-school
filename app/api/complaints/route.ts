import { NextRequest, NextResponse } from 'next/server';
import { ComplaintService } from '@/services';
import { getCurrentUser } from '@/lib/auth';

// GET /api/complaints - Get all complaints (admin only)
export async function GET(request: NextRequest) {
  try {
    const complaints = await ComplaintService.getAllComplaints();
    return NextResponse.json({ complaints });
  } catch (error) {
    console.error('GET /api/complaints error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}