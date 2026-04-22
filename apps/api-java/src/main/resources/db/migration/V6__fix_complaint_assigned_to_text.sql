-- V6: Change complaints.assigned_to from UUID FK to plain text (staff member name/identifier)
-- This allows wardens to assign complaints to staff by name without requiring a user account

ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_assigned_to_fkey;
ALTER TABLE complaints ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;
