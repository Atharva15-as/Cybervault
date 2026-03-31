-- Normalize legacy shared_files.share_url values to short app links
-- Usage:
-- 1) Open Supabase Dashboard -> SQL Editor
-- 2) Paste this script
-- 3) Replace APP_BASE_URL with your deployed frontend origin
--    Example: https://cybervault.example.com
-- 4) Run once

DO $$
DECLARE
    app_base_url TEXT := 'APP_BASE_URL'; -- replace before running
    normalized_base_url TEXT;
    rows_updated INTEGER := 0;
BEGIN
    IF app_base_url = 'APP_BASE_URL' THEN
        RAISE EXCEPTION 'Please replace APP_BASE_URL with your real frontend URL before running this migration.';
    END IF;

    normalized_base_url := regexp_replace(trim(app_base_url), '/+$', '');

    UPDATE shared_files
    SET
        share_url = normalized_base_url || '/share/' || share_token,
        updated_at = NOW()
    WHERE
        share_token IS NOT NULL
        AND btrim(share_token) <> ''
        AND (
            share_url IS NULL
            OR share_url = ''
            OR share_url LIKE '%/storage/v1/object/%'
            OR share_url NOT LIKE normalized_base_url || '/share/%'
        );

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RAISE NOTICE 'Share URL migration completed. Rows updated: %', rows_updated;
END $$;

-- Optional verification query:
-- SELECT id, share_token, share_url
-- FROM shared_files
-- ORDER BY created_at DESC
-- LIMIT 20;
