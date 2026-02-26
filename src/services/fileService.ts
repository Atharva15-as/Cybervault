import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

// Types for database records
export interface SharedFileRecord {
    id: string;
    user_id: string;
    file_name: string;
    file_size: string;
    file_hash: string;
    pin_hash: string;
    share_token: string;
    share_url: string;
    expiry_date: string;
    expiry_duration: string;
    malicious_score: number;
    security_status: 'safe' | 'warning' | 'danger';
    download_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateFileInput {
    file_name: string;
    file_size: string;
    file_hash: string;
    pin_hash: string;
    share_token: string;
    share_url: string;
    expiry_date: Date;
    expiry_duration: string;
    malicious_score?: number;
    security_status?: 'safe' | 'warning' | 'danger';
}

// File Database Service
export const fileService = {
    /**
     * Create a new shared file record
     */
    async createFile(input: CreateFileInput): Promise<{ data: SharedFileRecord | null; error: Error | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { data: null, error: new Error('User not authenticated') };
            }

            const { data, error } = await supabase
                .from('shared_files')
                .insert({
                    user_id: user.id,
                    file_name: input.file_name,
                    file_size: input.file_size,
                    file_hash: input.file_hash,
                    pin_hash: input.pin_hash,
                    share_token: input.share_token,
                    share_url: input.share_url,
                    expiry_date: input.expiry_date.toISOString(),
                    expiry_duration: input.expiry_duration,
                    malicious_score: input.malicious_score || 0,
                    security_status: input.security_status || 'safe',
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating file record:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Get all files for the current user
     */
    async getUserFiles(): Promise<{ data: SharedFileRecord[] | null; error: Error | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { data: null, error: new Error('User not authenticated') };
            }

            const { data, error } = await supabase
                .from('shared_files')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching user files:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Get a file by share token (for public access)
     */
    async getFileByToken(token: string): Promise<{ data: SharedFileRecord | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('shared_files')
                .select('*')
                .eq('share_token', token)
                .eq('is_active', true)
                .single();

            if (error) throw error;

            // Check if expired
            if (data && new Date(data.expiry_date) < new Date()) {
                return { data: null, error: new Error('This link has expired') };
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching file by token:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Update file record (e.g., increment download count)
     * Only allows the file owner to update their own records
     */
    async updateFile(id: string, updates: Partial<SharedFileRecord>): Promise<{ data: SharedFileRecord | null; error: Error | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { data: null, error: new Error('User not authenticated') };
            }

            // Ensure the file belongs to the current user
            const { data, error } = await supabase
                .from('shared_files')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating file:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Increment download count
     */
    async incrementDownloadCount(id: string): Promise<{ success: boolean; error: Error | null }> {
        try {
            const { error } = await supabase.rpc('increment_download_count', { file_id: id });
            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            // Fallback: fetch and update manually
            try {
                const { data } = await supabase
                    .from('shared_files')
                    .select('download_count')
                    .eq('id', id)
                    .single();

                if (data) {
                    await supabase
                        .from('shared_files')
                        .update({ download_count: (data.download_count || 0) + 1 })
                        .eq('id', id);
                }
                return { success: true, error: null };
            } catch (fallbackError) {
                return { success: false, error: fallbackError as Error };
            }
        }
    },

    /**
     * Delete a file record (only owner can delete)
     */
    async deleteFile(id: string): Promise<{ success: boolean; error: Error | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { success: false, error: new Error('User not authenticated') };
            }

            const { error } = await supabase
                .from('shared_files')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            console.error('Error deleting file:', error);
            return { success: false, error: error as Error };
        }
    },

    /**
     * Deactivate a file (soft delete) - only owner can deactivate
     */
    async deactivateFile(id: string): Promise<{ success: boolean; error: Error | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { success: false, error: new Error('User not authenticated') };
            }

            const { error } = await supabase
                .from('shared_files')
                .update({ is_active: false })
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            console.error('Error deactivating file:', error);
            return { success: false, error: error as Error };
        }
    },

    /**
     * Get file statistics for current user
     */
    async getFileStats(): Promise<{ data: { total: number; active: number; expired: number; downloads: number } | null; error: Error | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { data: null, error: new Error('User not authenticated') };
            }

            const { data, error } = await supabase
                .from('shared_files')
                .select('is_active, expiry_date, download_count')
                .eq('user_id', user.id);

            if (error) throw error;

            const now = new Date();
            const stats = {
                total: data?.length || 0,
                active: data?.filter(f => f.is_active && new Date(f.expiry_date) > now).length || 0,
                expired: data?.filter(f => new Date(f.expiry_date) <= now).length || 0,
                downloads: data?.reduce((sum, f) => sum + (f.download_count || 0), 0) || 0,
            };

            return { data: stats, error: null };
        } catch (error) {
            console.error('Error fetching file stats:', error);
            return { data: null, error: error as Error };
        }
    },

    /**
     * Export all files to Excel format with formatting
     */
    async exportToExcel(): Promise<{ success: boolean; error: Error | null }> {
        try {
            const { data: files, error } = await this.getUserFiles();

            if (error) throw error;
            if (!files || files.length === 0) {
                return { success: false, error: new Error('No files to export') };
            }

            // Prepare data with Sr. No.
            const excelData = files.map((file, index) => ({
                'Sr. No.': index + 1,
                'File Name': file.file_name,
                'File Size': file.file_size,
                'SHA-256 Hash': file.file_hash,
                'PIN Hash': file.pin_hash,
                'Share Token': file.share_token,
                'Share URL': file.share_url,
                'Expiry Date': new Date(file.expiry_date).toLocaleString(),
                'Expiry Duration': file.expiry_duration,
                'Security Status': file.security_status.toUpperCase(),
                'Malicious Score': file.malicious_score,
                'Download Count': file.download_count,
                'Is Active': file.is_active ? 'Yes' : 'No',
                'Created At': new Date(file.created_at).toLocaleString()
            }));

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // Get column range
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
            const numCols = range.e.c + 1;

            // Set column widths
            const colWidths = [
                { wch: 8 },   // Sr. No.
                { wch: 30 },  // File Name
                { wch: 12 },  // File Size
                { wch: 66 },  // SHA-256 Hash
                { wch: 66 },  // PIN Hash
                { wch: 35 },  // Share Token
                { wch: 50 },  // Share URL
                { wch: 22 },  // Expiry Date
                { wch: 15 },  // Expiry Duration
                { wch: 15 },  // Security Status
                { wch: 15 },  // Malicious Score
                { wch: 15 },  // Download Count
                { wch: 10 },  // Is Active
                { wch: 22 },  // Created At
            ];
            worksheet['!cols'] = colWidths;

            // Apply cell styles (bold headers and center alignment)
            for (let col = 0; col < numCols; col++) {
                const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
                if (worksheet[headerCell]) {
                    worksheet[headerCell].s = {
                        font: { bold: true },
                        alignment: { horizontal: 'center', vertical: 'center' }
                    };
                }
            }

            // Center all data cells
            for (let row = 1; row <= range.e.r; row++) {
                for (let col = 0; col < numCols; col++) {
                    const cell = XLSX.utils.encode_cell({ r: row, c: col });
                    if (worksheet[cell]) {
                        worksheet[cell].s = {
                            alignment: { horizontal: 'center', vertical: 'center' }
                        };
                    }
                }
            }

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'CyberVault Files');

            // Generate and download file
            const filename = `CyberVault_Files_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, filename);

            return { success: true, error: null };
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            return { success: false, error: error as Error };
        }
    },

    /**
     * Export local files to Excel (fallback when not authenticated)
     */
    exportLocalToExcel(files: Array<{
        name: string;
        size: string;
        hash: string;
        hasPin: boolean;
        shareToken: string;
        shareUrl: string;
        expiryDate: Date | null;
        securityStatus: string;
        maliciousScore: number;
        uploadDate: string;
    }>): void {
        // Prepare data with Sr. No.
        const excelData = files.map((file, index) => ({
            'Sr. No.': index + 1,
            'File Name': file.name,
            'File Size': file.size,
            'SHA-256 Hash': file.hash,
            'PIN Protected': file.hasPin ? 'Yes' : 'No',
            'Share Token': file.shareToken,
            'Share URL': file.shareUrl,
            'Expiry Date': file.expiryDate ? file.expiryDate.toLocaleString() : 'N/A',
            'Security Status': file.securityStatus.toUpperCase(),
            'Malicious Score': file.maliciousScore,
            'Upload Date': file.uploadDate
        }));

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Get column range
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const numCols = range.e.c + 1;

        // Set column widths
        const colWidths = [
            { wch: 8 },   // Sr. No.
            { wch: 30 },  // File Name
            { wch: 12 },  // File Size
            { wch: 66 },  // SHA-256 Hash
            { wch: 15 },  // PIN Protected
            { wch: 35 },  // Share Token
            { wch: 50 },  // Share URL
            { wch: 22 },  // Expiry Date
            { wch: 15 },  // Security Status
            { wch: 15 },  // Malicious Score
            { wch: 15 },  // Upload Date
        ];
        worksheet['!cols'] = colWidths;

        // Apply cell styles (bold headers and center alignment)
        for (let col = 0; col < numCols; col++) {
            const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
            if (worksheet[headerCell]) {
                worksheet[headerCell].s = {
                    font: { bold: true },
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            }
        }

        // Center all data cells
        for (let row = 1; row <= range.e.r; row++) {
            for (let col = 0; col < numCols; col++) {
                const cell = XLSX.utils.encode_cell({ r: row, c: col });
                if (worksheet[cell]) {
                    worksheet[cell].s = {
                        alignment: { horizontal: 'center', vertical: 'center' }
                    };
                }
            }
        }

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'CyberVault Files');

        // Generate and download file
        const filename = `CyberVault_Files_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, filename);
    }
};

export default fileService;

