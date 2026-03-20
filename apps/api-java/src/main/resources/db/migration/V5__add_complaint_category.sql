-- Add category column to complaints
ALTER TABLE complaints ADD COLUMN category VARCHAR(50);

-- Update existing complaints with a default
UPDATE complaints SET category = 'Other' WHERE category IS NULL;
