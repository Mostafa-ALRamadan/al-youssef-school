import { NextRequest, NextResponse } from 'next/server';
import { WeeklyScheduleService, TimeSlotService, TeacherAssignmentService } from '@/services';
import { ERROR_MESSAGES } from '@/constants';

/**
 * GET /api/weekly-schedule
 * Returns all weekly schedules or filtered by class_id or teacher_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const teacherId = searchParams.get('teacher_id');

    let schedules;
    if (classId) {
      schedules = await WeeklyScheduleService.getSchedulesByClassId(classId);
    } else if (teacherId) {
      schedules = await WeeklyScheduleService.getSchedulesByTeacherId(teacherId);
    } else {
      schedules = await WeeklyScheduleService.getAllSchedules();
    }

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Get weekly schedule error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/weekly-schedule
 * Creates a new weekly schedule entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacher_assignment_id, day_of_week, time_slot_id } = body;

    // Validation
    if (!teacher_assignment_id || day_of_week === undefined || !time_slot_id) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // Get teacher assignment details
    const assignment = await TeacherAssignmentService.getAssignmentById(teacher_assignment_id);

    if (!assignment) {
      return NextResponse.json(
        { error: 'التعيين غير موجود' },
        { status: 400 }
      );
    }

    const { teacher_id, class_id, subject_id } = assignment;

    // Get time slot details
    const timeSlots = await TimeSlotService.getAllTimeSlots();
    const selectedTimeSlot = timeSlots.find(slot => slot.id === time_slot_id);

    if (!selectedTimeSlot) {
      return NextResponse.json(
        { error: 'الفترة الزمنية غير موجودة' },
        { status: 400 }
      );
    }

    const schedule = await WeeklyScheduleService.createSchedule({
      class_id,
      subject_id,
      teacher_id,
      day_of_week: parseInt(day_of_week),
      start_time: selectedTimeSlot.start_time,
      end_time: selectedTimeSlot.end_time,
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'فشل في إنشاء البرنامج الأسبوعي' },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error: any) {
    console.error('Create weekly schedule error:', error);
    return NextResponse.json(
      { error: error.message || ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}
