import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService } from '@/services';
import { AttendanceRepository } from '@/repositories';
import { ERROR_MESSAGES } from '@/constants';

/**
 * POST /api/attendance/records
 * Save attendance records for a session
 * Body: { session_id } OR { schedule_id, date } + { records: [...] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, schedule_id, date, records } = body;

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'records array is required' },
        { status: 400 }
      );
    }

    // Get or create session
    let finalSessionId = session_id;
    if (!finalSessionId && schedule_id && date) {
      const session = await AttendanceRepository.findOrCreateSession(schedule_id, date);
      if (!session) {
        return NextResponse.json(
          { error: 'Failed to create attendance session' },
          { status: 500 }
        );
      }
      finalSessionId = session.id;
    }

    if (!finalSessionId) {
      return NextResponse.json(
        { error: 'session_id or (schedule_id + date) is required' },
        { status: 400 }
      );
    }

    // Save all records
    const savedRecords = await Promise.all(
      records.map((record: { student_id: string; status: string }) =>
        AttendanceService.saveRecord({
          session_id: finalSessionId,
          student_id: record.student_id,
          status: record.status as 'present' | 'absent' | 'late' | 'excused',
        })
      )
    );

    return NextResponse.json({ records: savedRecords, session_id: finalSessionId });
  } catch (error: any) {
    console.error('Save attendance records error:', error);
    return NextResponse.json(
      { error: error.message || ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}
