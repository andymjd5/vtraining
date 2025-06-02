/*
  # Add Company URLs

  1. Updates
    - Add url_slug field to companies table
    - Update existing companies with URL slugs
    - Add unique constraint on url_slug
    - Add validation for url_slug format

  2. Security
    - Ensure URL slugs are unique and valid
    - Add check constraint for valid characters
*/

-- Add url_slug column to companies table
ALTER TABLE companies
ADD COLUMN url_slug text UNIQUE;

-- Add check constraint for valid URL slug format
ALTER TABLE companies
ADD CONSTRAINT valid_url_slug CHECK (url_slug ~ '^[a-z0-9-]+$');

-- Update existing companies with URL slugs
UPDATE companies
SET url_slug = CASE
  WHEN name = 'FONAREV' THEN 'fonarev'
  WHEN name = 'UNIKIN' THEN 'unikin'
  WHEN name = 'PNJT' THEN 'pnjt'
  WHEN name = 'BESDU' THEN 'besdu'
  WHEN name = 'VISION 26' THEN 'vision26'
END
WHERE name IN ('FONAREV', 'UNIKIN', 'PNJT', 'BESDU', 'VISION 26');