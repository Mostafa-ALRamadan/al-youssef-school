'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TEACHER_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Users, Search } from 'lucide-react';
import { formatNumber } from '@/utils/number';
import { getAuthHeaders } from '@/lib/auth-client';

interface Student {
  id: string;
  name: string;
  class_name: string;
  parent_name: string;
  parent_phone: string;
}

interface ClassOption {
  id: string;
  name: string;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/teacher/students', {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    // Apply class filter
    const matchesClass = selectedClass === 'all' || 
      student.class_name === classes.find(c => c.id === selectedClass)?.name;
    // Apply search filter
    if (!searchQuery) return matchesClass;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      student.name?.toLowerCase().includes(query) ||
      student.parent_name?.toLowerCase().includes(query);
    return matchesClass && matchesSearch;
  });

  return (
    <DashboardLayout
      sidebarItems={TEACHER_SIDEBAR_ITEMS}
      userRole={USER_ROLES.TEACHER}
    >
      <div className="p-6" dir="rtl">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold">طلابي</h1>
        </div>

        {/* Class Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">اختر الصف</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">الكل</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md mb-6">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث بالاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Students Table */}
        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-center">اسم الطالب</TableHead>
                  <TableHead className="text-center">الصف</TableHead>
                  <TableHead className="text-center">اسم ولي الأمر</TableHead>
                  <TableHead className="text-center">رقم الهاتف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد طلاب'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium text-center">{student.name}</TableCell>
                      <TableCell className="text-center">{student.class_name}</TableCell>
                      <TableCell className="text-center">{student.parent_name || '-'}</TableCell>
                      <TableCell className="text-center">{student.parent_phone ? formatNumber(student.parent_phone) : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
