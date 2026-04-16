import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// PUT /api/complaints/[id] - Update complaint status or add reply
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerSupabaseClient();

    // Handle reply update
    if (body.reply !== undefined) {
      const { data: complaint, error } = await supabase
        .from('complaints')
        .update({
          reply: body.reply,
          replied_by: body.replied_by,
          replied_at: new Date().toISOString(),
          status: 'resolved',
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !complaint) {
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

    const { data: complaint, error } = await supabase
      .from('complaints')
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single();

    if (error || !complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
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
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete complaint' },
        { status: 500 }
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
