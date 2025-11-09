-- Add meeting_code column to meeting_sessions table
ALTER TABLE meeting_sessions 
ADD COLUMN IF NOT EXISTS meeting_code TEXT UNIQUE;

-- Create index for faster lookups by code
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_code ON meeting_sessions(meeting_code);

-- Update existing meetings to have codes (for any existing data)
UPDATE meeting_sessions 
SET meeting_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4))
WHERE meeting_code IS NULL;