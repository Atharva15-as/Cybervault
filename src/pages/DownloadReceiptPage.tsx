import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DownloadReceipt from '../components/DownloadReceipt';

/**
 * Standalone page for displaying download receipt
 * Can be opened in a new window or tab
 * 
 * Usage:
 * window.open(`/download-receipt?fileName=file.txt&fileSize=1024&hash=abc123&token=xyz789`)
 */
export const DownloadReceiptPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [receiptData, setReceiptData] = useState<{
        fileName: string;
        fileSize: number;
        downloadTime: Date;
        shareToken: string;
        originalHash?: string;
    } | null>(null);

    useEffect(() => {
        const fileName = searchParams.get('fileName');
        const fileSize = searchParams.get('fileSize');
        const hash = searchParams.get('hash');
        const token = searchParams.get('token');

        if (fileName && fileSize) {
            setReceiptData({
                fileName: decodeURIComponent(fileName),
                fileSize: parseInt(fileSize),
                downloadTime: new Date(),
                shareToken: token || '',
                originalHash: hash || undefined,
            });
        }
    }, [searchParams]);

    if (!receiptData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-800 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-slate-400">Invalid receipt data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-800 flex items-center justify-center p-4">
            <DownloadReceipt
                fileName={receiptData.fileName}
                fileSize={receiptData.fileSize}
                downloadTime={receiptData.downloadTime}
                shareToken={receiptData.shareToken}
                originalHash={receiptData.originalHash}
            />
        </div>
    );
};

export default DownloadReceiptPage;
