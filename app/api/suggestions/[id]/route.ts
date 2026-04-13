import { NextRequest, NextResponse } from 'next/server';
import { SuggestionService } from '@/services';

// PUT /api/suggestions/[id] - Update suggestion status or add reply
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Handle reply update
    if (body.reply !== undefined) {
      const suggestion = await SuggestionService.addReply(id, body.reply, body.replied_by);

      if (!suggestion) {
        return NextResponse.json(
          { error: 'Suggestion not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'تم إضافة الرد بنجاح',
        suggestion,
      });
    }

    // Handle status update
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status or reply is required' },
        { status: 400 }
      );
    }

    const suggestion = await SuggestionService.updateSuggestionStatus(id, body.status);

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'تم تحديث حالة الاقتراح بنجاح',
      suggestion,
    });
  } catch (error: any) {
    console.error('PUT /api/suggestions/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/suggestions/[id] - Delete suggestion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await SuggestionService.deleteSuggestion(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete suggestion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'تم حذف الاقتراح بنجاح',
    });
  } catch (error: any) {
    console.error('DELETE /api/suggestions/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
