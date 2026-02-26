import { supabase } from '../lib/supabase';

// Community Types
export interface Community {
    id: string;
    name: string;
    description: string;
    password_hash: string;
    creator_id: string;
    creator_email: string;
    max_members: number;
    member_count: number;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface CommunityMember {
    id: string;
    community_id: string;
    user_id: string;
    user_email: string;
    role: 'admin' | 'member';
    joined_at: string;
}

export interface CommunityFile {
    id: string;
    community_id: string;
    uploader_id: string;
    uploader_email: string;
    file_name: string;
    file_size: string;
    file_hash: string;
    pin_hash: string;
    share_token: string;
    share_url: string;
    expiry_date: string;
    malicious_score: number;
    security_status: 'safe' | 'warning' | 'danger';
    download_count: number;
    created_at: string;
}

export interface CreateCommunityInput {
    name: string;
    description: string;
    password: string;
    max_members?: number;
}

// Simple hash function for passwords (in production, use bcrypt on backend)
const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Local storage helper for demo mode
const DEMO_COMMUNITIES_KEY = 'cybervault_communities';
const DEMO_MEMBERS_KEY = 'cybervault_community_members';
const DEMO_COMMUNITY_FILES_KEY = 'cybervault_community_files';

const getLocalCommunities = (): Community[] => {
    const stored = localStorage.getItem(DEMO_COMMUNITIES_KEY);
    return stored ? JSON.parse(stored) : [];
};

const saveLocalCommunities = (communities: Community[]): void => {
    localStorage.setItem(DEMO_COMMUNITIES_KEY, JSON.stringify(communities));
};

const getLocalMembers = (): CommunityMember[] => {
    const stored = localStorage.getItem(DEMO_MEMBERS_KEY);
    return stored ? JSON.parse(stored) : [];
};

const saveLocalMembers = (members: CommunityMember[]): void => {
    localStorage.setItem(DEMO_MEMBERS_KEY, JSON.stringify(members));
};

const getLocalCommunityFiles = (): CommunityFile[] => {
    const stored = localStorage.getItem(DEMO_COMMUNITY_FILES_KEY);
    return stored ? JSON.parse(stored) : [];
};

const saveLocalCommunityFiles = (files: CommunityFile[]): void => {
    localStorage.setItem(DEMO_COMMUNITY_FILES_KEY, JSON.stringify(files));
};

// Community Service
export const communityService = {
    /**
     * Create a new community
     */
    async createCommunity(input: CreateCommunityInput, userEmail: string): Promise<{ data: Community | null; error: Error | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'demo-user';
            const email = user?.email || userEmail;

            const passwordHash = await hashPassword(input.password);

            const newCommunity: Community = {
                id: `community_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: input.name,
                description: input.description,
                password_hash: passwordHash,
                creator_id: userId,
                creator_email: email,
                max_members: input.max_members || 10,
                member_count: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_active: true
            };

            // Try Supabase first
            try {
                const { data, error } = await supabase
                    .from('communities')
                    .insert(newCommunity)
                    .select()
                    .single();

                if (!error && data) {
                    // Add creator as admin member
                    await supabase.from('community_members').insert({
                        community_id: data.id,
                        user_id: userId,
                        user_email: email,
                        role: 'admin'
                    });
                    return { data, error: null };
                }
            } catch (e) {
                console.log('Supabase not available, using local storage');
            }

            // Fallback to local storage
            const communities = getLocalCommunities();
            communities.push(newCommunity);
            saveLocalCommunities(communities);

            // Add creator as admin member
            const members = getLocalMembers();
            members.push({
                id: `member_${Date.now()}`,
                community_id: newCommunity.id,
                user_id: userId,
                user_email: email,
                role: 'admin',
                joined_at: new Date().toISOString()
            });
            saveLocalMembers(members);

            return { data: newCommunity, error: null };
        } catch (error) {
            console.error('Error creating community:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Join a community with password
     */
    async joinCommunity(communityId: string, password: string, userEmail: string): Promise<{ success: boolean; error: Error | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'demo-user';
            const email = user?.email || userEmail;

            const passwordHash = await hashPassword(password);

            // Try Supabase first
            try {
                const { data: community, error: fetchError } = await supabase
                    .from('communities')
                    .select('*')
                    .eq('id', communityId)
                    .single();

                if (!fetchError && community) {
                    if (community.password_hash !== passwordHash) {
                        return { success: false, error: new Error('Incorrect password') };
                    }

                    if (community.member_count >= community.max_members) {
                        return { success: false, error: new Error('Community is full') };
                    }

                    // Check if already a member
                    const { data: existingMember } = await supabase
                        .from('community_members')
                        .select('*')
                        .eq('community_id', communityId)
                        .eq('user_id', userId)
                        .single();

                    if (existingMember) {
                        return { success: false, error: new Error('Already a member of this community') };
                    }

                    // Add member
                    await supabase.from('community_members').insert({
                        community_id: communityId,
                        user_id: userId,
                        user_email: email,
                        role: 'member'
                    });

                    // Update member count
                    await supabase
                        .from('communities')
                        .update({ member_count: community.member_count + 1 })
                        .eq('id', communityId);

                    return { success: true, error: null };
                }
            } catch (e) {
                console.log('Supabase not available, using local storage');
            }

            // Fallback to local storage
            const communities = getLocalCommunities();
            const community = communities.find(c => c.id === communityId);

            if (!community) {
                return { success: false, error: new Error('Community not found') };
            }

            if (community.password_hash !== passwordHash) {
                return { success: false, error: new Error('Incorrect password') };
            }

            if (community.member_count >= community.max_members) {
                return { success: false, error: new Error('Community is full') };
            }

            const members = getLocalMembers();
            const existingMember = members.find(m => m.community_id === communityId && m.user_id === userId);

            if (existingMember) {
                return { success: false, error: new Error('Already a member of this community') };
            }

            // Add member
            members.push({
                id: `member_${Date.now()}`,
                community_id: communityId,
                user_id: userId,
                user_email: email,
                role: 'member',
                joined_at: new Date().toISOString()
            });
            saveLocalMembers(members);

            // Update community member count
            community.member_count += 1;
            saveLocalCommunities(communities);

            return { success: true, error: null };
        } catch (error) {
            console.error('Error joining community:', error);
            return { success: false, error: error as Error };
        }
    },

    /**
     * Get all communities the user is a member of
     */
    async getUserCommunities(): Promise<{ data: Community[] | null; error: Error | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'demo-user';

            // Try Supabase first
            try {
                const { data: memberRecords, error: memberError } = await supabase
                    .from('community_members')
                    .select('community_id')
                    .eq('user_id', userId);

                if (!memberError && memberRecords && memberRecords.length > 0) {
                    const communityIds = memberRecords.map(m => m.community_id);
                    const { data: communities, error: communityError } = await supabase
                        .from('communities')
                        .select('*')
                        .in('id', communityIds)
                        .eq('is_active', true);

                    if (!communityError) {
                        return { data: communities, error: null };
                    }
                }
            } catch (e) {
                console.log('Supabase not available, using local storage');
            }

            // Fallback to local storage
            const members = getLocalMembers();
            const userMemberships = members.filter(m => m.user_id === userId);
            const communityIds = userMemberships.map(m => m.community_id);

            const communities = getLocalCommunities()
                .filter(c => communityIds.includes(c.id) && c.is_active);

            return { data: communities, error: null };
        } catch (error) {
            console.error('Error fetching user communities:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Get all available communities (for browsing/joining)
     */
    async getAllCommunities(): Promise<{ data: Community[] | null; error: Error | null }> {
        try {
            // Try Supabase first
            try {
                const { data, error } = await supabase
                    .from('communities')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (!error) {
                    return { data, error: null };
                }
            } catch (e) {
                console.log('Supabase not available, using local storage');
            }

            // Fallback to local storage
            const communities = getLocalCommunities().filter(c => c.is_active);
            return { data: communities, error: null };
        } catch (error) {
            console.error('Error fetching all communities:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Get community by ID
     */
    async getCommunityById(communityId: string): Promise<{ data: Community | null; error: Error | null }> {
        try {
            // Try Supabase first
            try {
                const { data, error } = await supabase
                    .from('communities')
                    .select('*')
                    .eq('id', communityId)
                    .single();

                if (!error) {
                    return { data, error: null };
                }
            } catch (e) {
                console.log('Supabase not available, using local storage');
            }

            // Fallback to local storage
            const communities = getLocalCommunities();
            const community = communities.find(c => c.id === communityId);
            return { data: community || null, error: null };
        } catch (error) {
            console.error('Error fetching community:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Get community members
     */
    async getCommunityMembers(communityId: string): Promise<{ data: CommunityMember[] | null; error: Error | null }> {
        try {
            // Try Supabase first
            try {
                const { data, error } = await supabase
                    .from('community_members')
                    .select('*')
                    .eq('community_id', communityId);

                if (!error) {
                    return { data, error: null };
                }
            } catch (e) {
                console.log('Supabase not available, using local storage');
            }

            // Fallback to local storage
            const members = getLocalMembers().filter(m => m.community_id === communityId);
            return { data: members, error: null };
        } catch (error) {
            console.error('Error fetching community members:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Check if user is a member of a community
     */
    async isMember(communityId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'demo-user';

            // Try Supabase first
            try {
                const { data, error } = await supabase
                    .from('community_members')
                    .select('*')
                    .eq('community_id', communityId)
                    .eq('user_id', userId)
                    .single();

                if (!error && data) {
                    return true;
                }
            } catch (e) {
                console.log('Supabase not available, using local storage');
            }

            // Fallback to local storage
            const members = getLocalMembers();
            return members.some(m => m.community_id === communityId && m.user_id === userId);
        } catch (error) {
            return false;
        }
    },

    /**
     * Upload file to community
     */
    async uploadCommunityFile(communityId: string, fileData: {
        file_name: string;
        file_size: string;
        file_hash: string;
        pin_hash: string;
        share_token: string;
        share_url: string;
        expiry_date: Date;
        malicious_score: number;
        security_status: 'safe' | 'warning' | 'danger';
    }, userEmail: string): Promise<{ data: CommunityFile | null; error: Error | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'demo-user';
            const email = user?.email || userEmail;

            const newFile: CommunityFile = {
                id: `cfile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                community_id: communityId,
                uploader_id: userId,
                uploader_email: email,
                file_name: fileData.file_name,
                file_size: fileData.file_size,
                file_hash: fileData.file_hash,
                pin_hash: fileData.pin_hash,
                share_token: fileData.share_token,
                share_url: fileData.share_url,
                expiry_date: fileData.expiry_date.toISOString(),
                malicious_score: fileData.malicious_score,
                security_status: fileData.security_status,
                download_count: 0,
                created_at: new Date().toISOString()
            };

            // Try Supabase first
            try {
                const { data, error } = await supabase
                    .from('community_files')
                    .insert(newFile)
                    .select()
                    .single();

                if (!error) {
                    return { data, error: null };
                }
            } catch (e) {
                console.log('Supabase not available, using local storage');
            }

            // Fallback to local storage
            const files = getLocalCommunityFiles();
            files.push(newFile);
            saveLocalCommunityFiles(files);

            return { data: newFile, error: null };
        } catch (error) {
            console.error('Error uploading community file:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Get community files
     */
    async getCommunityFiles(communityId: string): Promise<{ data: CommunityFile[] | null; error: Error | null }> {
        try {
            // Try Supabase first
            try {
                const { data, error } = await supabase
                    .from('community_files')
                    .select('*')
                    .eq('community_id', communityId)
                    .order('created_at', { ascending: false });

                if (!error) {
                    return { data, error: null };
                }
            } catch (e) {
                console.log('Supabase not available, using local storage');
            }

            // Fallback to local storage
            const files = getLocalCommunityFiles()
                .filter(f => f.community_id === communityId)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            return { data: files, error: null };
        } catch (error) {
            console.error('Error fetching community files:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Leave a community
     */
    async leaveCommunity(communityId: string): Promise<{ success: boolean; error: Error | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'demo-user';

            // Try Supabase first
            try {
                const { error: deleteError } = await supabase
                    .from('community_members')
                    .delete()
                    .eq('community_id', communityId)
                    .eq('user_id', userId);

                if (!deleteError) {
                    // Update member count
                    const { data: community } = await supabase
                        .from('communities')
                        .select('member_count')
                        .eq('id', communityId)
                        .single();

                    if (community) {
                        await supabase
                            .from('communities')
                            .update({ member_count: Math.max(0, community.member_count - 1) })
                            .eq('id', communityId);
                    }

                    return { success: true, error: null };
                }
            } catch (e) {
                console.log('Supabase not available, using local storage');
            }

            // Fallback to local storage
            let members = getLocalMembers();
            members = members.filter(m => !(m.community_id === communityId && m.user_id === userId));
            saveLocalMembers(members);

            const communities = getLocalCommunities();
            const community = communities.find(c => c.id === communityId);
            if (community) {
                community.member_count = Math.max(0, community.member_count - 1);
                saveLocalCommunities(communities);
            }

            return { success: true, error: null };
        } catch (error) {
            console.error('Error leaving community:', error);
            return { success: false, error: error as Error };
        }
    },

    /**
     * Delete a community file
     */
    async deleteCommunityFile(fileId: string): Promise<{ success: boolean; error: Error | null }> {
        try {
            // Try Supabase first
            try {
                const { error } = await supabase
                    .from('community_files')
                    .delete()
                    .eq('id', fileId);

                if (!error) {
                    return { success: true, error: null };
                }
            } catch (e) {
                console.log('Supabase not available, using local storage');
            }

            // Fallback to local storage
            let files = getLocalCommunityFiles();
            files = files.filter(f => f.id !== fileId);
            saveLocalCommunityFiles(files);

            return { success: true, error: null };
        } catch (error) {
            console.error('Error deleting community file:', error);
            return { success: false, error: error as Error };
        }
    }
};

export default communityService;
