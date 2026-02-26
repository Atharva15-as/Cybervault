-- Run this SQL in your Supabase SQL Editor to create the shared_files table
-- Go to: Supabase Dashboard > SQL Editor > New Query

-- Create the shared_files table
CREATE TABLE IF NOT EXISTS shared_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash (64 characters)
    pin_hash VARCHAR(64) NOT NULL,   -- Hashed PIN for security
    share_token VARCHAR(32) UNIQUE NOT NULL,  -- Unique share token for URL
    share_url TEXT NOT NULL,          -- Full shareable URL
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_duration VARCHAR(10) NOT NULL,  -- e.g., '1h', '24h', '7d', '30d'
    malicious_score INTEGER DEFAULT 0,
    security_status VARCHAR(20) DEFAULT 'safe',  -- 'safe', 'warning', 'danger'
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_files_share_token ON shared_files(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_files_user_id ON shared_files(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_expiry ON shared_files(expiry_date);

-- Enable Row Level Security (RLS)
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files" ON shared_files
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own files
CREATE POLICY "Users can insert own files" ON shared_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files" ON shared_files
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files" ON shared_files
    FOR DELETE USING (auth.uid() = user_id);

-- Policy: Anyone can view files by share_token (for public access via share link)
CREATE POLICY "Public can view by share token" ON shared_files
    FOR SELECT USING (is_active = true AND expiry_date > NOW());

-- Create function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update 'updated_at'
CREATE TRIGGER update_shared_files_updated_at
    BEFORE UPDATE ON shared_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for file statistics (for dashboard)
CREATE OR REPLACE VIEW file_statistics AS
SELECT 
    user_id,
    COUNT(*) as total_files,
    COUNT(*) FILTER (WHERE is_active = true) as active_files,
    COUNT(*) FILTER (WHERE expiry_date < NOW()) as expired_files,
    SUM(download_count) as total_downloads
FROM shared_files
GROUP BY user_id;
