import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService } from '@/services';
import { ERROR_MESSAGES } from '@/constants';

/**
 * POST /api/attendance/records
 * Save attendance records for a session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, records } = body;

    if (!session_id || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'session_id and records array are required' },
        { status: 400 }
      );
    }

    // Save all records
    const savedRecords = await Promise.all(
      records.map((record: { student_id: string; status: string }) =>
        AttendanceService.saveRecord({
          session_id,
          student_id: record.student_id,
          status: record.status as 'present' | 'absent' | 'late' | 'excused',
        })
      )
    );

    return NextResponse.json({ records: savedRecords });
  } catch (error: any) {
    console.error('Save attendance records error:', error);
    return NextResponse.json(
      { error: error.message || ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}
