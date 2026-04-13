-- ============================================================================
-- MIGRATION: Simplify Classes Table
-- Remove unnecessary fields: grade_level, section, room_number, capacity, is_active
-- ============================================================================

-- First, drop dependent indexes
DROP INDEX IF EXISTS idx_classes_active;

-- Drop the trigger temporarily
DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;

-- Create new simplified classes table
CREATE TABLE classes_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Copy data from old table
INSERT INTO classes_new (id, name, academic_year, created_at, updated_at)
SELECT id, name, academic_year, created_at, updated_at
FROM classes;

-- Drop old table (this will fail if there are foreign key constraints from other tables)
-- For students.class_id, we need to handle it
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_class_id_fkey;

-- Drop the old table
DROP TABLE classes;

-- Rename new table
ALTER TABLE classes_new RENAME TO classes;

-- Recreate the trigger
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recreate index for academic_year
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);

-- Re-add foreign key constraint to students
ALTER TABLE students 
    ADD CONSTRAINT students_class_id_fkey 
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
