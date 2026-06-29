-- Add optional URL field to resource items for linking to external resources
ALTER TABLE resource_items ADD COLUMN url TEXT;

-- Make body optional so link-only items don't need placeholder text
ALTER TABLE resource_items ALTER COLUMN body DROP NOT NULL;
