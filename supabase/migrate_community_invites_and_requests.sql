-- Community invite links + join requests
-- Run this in Supabase SQL editor if these tables are not present yet.

CREATE TABLE IF NOT EXISTS community_invites (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_by TEXT,
    invited_email VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_invites_community_id ON community_invites(community_id);
CREATE INDEX IF NOT EXISTS idx_community_invites_token ON community_invites(token);
CREATE INDEX IF NOT EXISTS idx_community_invites_expires_at ON community_invites(expires_at);

CREATE TABLE IF NOT EXISTS community_join_requests (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    requester_id TEXT NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    invite_token TEXT,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_join_requests_community_id ON community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_status ON community_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_requester_id ON community_join_requests(requester_id);

ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active invites by token" ON community_invites;
CREATE POLICY "Public read active invites by token" ON community_invites
    FOR SELECT
    USING (is_active = true AND expires_at > NOW());

DROP POLICY IF EXISTS "Admins manage invites" ON community_invites;
CREATE POLICY "Admins manage invites" ON community_invites
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM communities
            WHERE communities.id = community_invites.community_id
            AND communities.creator_id::text = auth.uid()::text
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM communities
            WHERE communities.id = community_invites.community_id
            AND communities.creator_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Requester can insert own join requests" ON community_join_requests;
CREATE POLICY "Requester can insert own join requests" ON community_join_requests
    FOR INSERT
    WITH CHECK (requester_id = auth.uid()::text);

DROP POLICY IF EXISTS "Requester can read own join requests" ON community_join_requests;
CREATE POLICY "Requester can read own join requests" ON community_join_requests
    FOR SELECT
    USING (requester_id = auth.uid()::text);

DROP POLICY IF EXISTS "Admins can read all requests in own communities" ON community_join_requests;
CREATE POLICY "Admins can read all requests in own communities" ON community_join_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM communities
            WHERE communities.id = community_join_requests.community_id
            AND communities.creator_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Admins can update requests in own communities" ON community_join_requests;
CREATE POLICY "Admins can update requests in own communities" ON community_join_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM communities
            WHERE communities.id = community_join_requests.community_id
            AND communities.creator_id::text = auth.uid()::text
        )
    );
