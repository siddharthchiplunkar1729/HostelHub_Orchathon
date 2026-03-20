-- Add category column to hostel_blocks
ALTER TABLE hostel_blocks ADD COLUMN category VARCHAR(50);

-- Update existing data with defaults
UPDATE hostel_blocks SET category = 'Standard' WHERE category IS NULL;
