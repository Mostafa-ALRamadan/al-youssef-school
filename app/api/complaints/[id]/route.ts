import { NextRequest, NextResponse } from 'next/server';
import { ComplaintService } from '@/services';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/complaints/[id] - Update complaint status or add reply
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get authenticated admin user
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle reply update
    if (body.reply !== undefined) {
      const complaint = await ComplaintService.addReply(
        id,
        body.reply,
        currentUser.userId
      );

      if (!complaint) {
        return NextResponse.json(
          { error: 'Complaint not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'تم إضافة الرد بنجاح',
        complaint,
      });
    }

    // Handle status update
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status or reply is required' },
        { status: 400 }
      );
    }

    const complaint = await ComplaintService.updateComplaintStatus(
      id,
      body.status
    );

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found or invalid status' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'تم تحديث حالة الشكوى بنجاح',
      complaint,
    });
  } catch (error: any) {
    console.error('PUT /api/complaints/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/complaints/[id] - Delete complaint
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deleted = await ComplaintService.deleteComplaint(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'تم حذف الشكوى بنجاح',
    });
  } catch (error: any) {
    console.error('DELETE /api/complaints/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
