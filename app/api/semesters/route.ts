import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/semesters - Get all semesters with year names
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: semesters, error } = await supabase
      .from('semesters')
      .select('id, name, academic_year_id, is_active')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching semesters:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get year names separately
    const yearIds = semesters?.map(s => s.academic_year_id).filter(Boolean) || [];
    let yearsMap: Record<string, string> = {};

    if (yearIds.length > 0) {
      const { data: years } = await supabase
        .from('academic_years')
        .select('id, name')
        .in('id', yearIds);

      years?.forEach((y: any) => {
        yearsMap[y.id] = y.name;
      });
    }

    // Transform data
    const transformedData = semesters?.map((s: any) => ({
      id: s.id,
      name: s.name,
      academic_year_name: yearsMap[s.academic_year_id] || '-',
      is_active: s.is_active,
    })) || [];

    return NextResponse.json({ semesters: transformedData });
  } catch (error: any) {
    console.error('GET semesters error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
