import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/classes
 * Returns all classes
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ classes });
  } catch (error) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/classes
 * Create a new class
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم الصف مطلوب' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({ name })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
        { status: 500 }
      );
    }

    return NextResponse.json({ class: newClass, message: SUCCESS_MESSAGES.CREATED });
  } catch (error) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/classes
 * Update an existing class
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الصف مطلوب' },
        { status: 400 }
      );
    }

    const updates: { name?: string } = {};
    if (name) updates.name = name;

    const supabase = createServerSupabaseClient();
    const { data: updatedClass, error } = await supabase
      .from('classes')
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

    return NextResponse.json({ class: updatedClass, message: SUCCESS_MESSAGES.UPDATED });
  } catch (error) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes
 * Delete a class
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الصف مطلوب' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('classes')
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
