import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/subjects
 * Returns all subjects
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ subjects });
  } catch (error) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subjects
 * Create a new subject
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم المادة مطلوب' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: newSubject, error } = await supabase
      .from('subjects')
      .insert({ name })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
        { status: 500 }
      );
    }

    return NextResponse.json({ subject: newSubject, message: SUCCESS_MESSAGES.CREATED });
  } catch (error) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/subjects
 * Update an existing subject
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المادة مطلوب' },
        { status: 400 }
      );
    }

    const updates: { name?: string } = {};
    if (name !== undefined) updates.name = name;

    const supabase = createServerSupabaseClient();
    const { data: updatedSubject, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
        { status: 500 }
      );
    }

    return NextResponse.json({ subject: updatedSubject, message: SUCCESS_MESSAGES.UPDATED });
  } catch (error) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subjects
 * Delete a subject
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المادة مطلوب' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: SUCCESS_MESSAGES.DELETED });
  } catch (error) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}
