import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

// GET /api/complaints - Get all complaints (admin only)
export async function GET(request: NextRequest) {
  try {
        
    // Check if user is admin (optional - for admin access)
    const authHeader = request.headers.get('authorization');
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && authUser) {
        user = authUser;
      }
    }
    
    // Get complaints without user join for now
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching complaints:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return complaints as-is for now
    const transformedComplaints = complaints || [];

    return NextResponse.json({ complaints: transformedComplaints });
  } catch (error) {
    console.error('GET /api/complaints error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/complaints - Submit new complaint (authenticated users only)
export async function POST(request: NextRequest) {
  try {
        
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول لإرسال شكوى' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول لإرسال شكوى' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: 'العنوان والمحتوى مطلوبان' },
        { status: 400 }
      );
    }

    // Rate limiting: Check today's complaints for this user
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingComplaints, error: countError } = await supabase
      .from('complaints')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);
    
    if (countError) {
      console.error('Error checking rate limit:', countError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
    
    // Check rate limit (max 3 per day)
    if (existingComplaints && existingComplaints.length >= 3) {
      return NextResponse.json(
        { error: 'لقد وصلت إلى الحد الأقصى من الشكاوى لهذا اليوم. يمكنك إرسال 3 شكاوى فقط يومياً.' },
        { status: 429 }
      );
    }

    // Create complaint
    const { data: complaint, error: createError } = await supabase
      .from('complaints')
      .insert({
        user_id: user.id,
        title: body.title,
        message: body.message,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating complaint:', createError);
      return NextResponse.json(
        { error: createError.message || 'Failed to create complaint' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'تم إرسال الشكوى بنجاح', complaint },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/complaints error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
