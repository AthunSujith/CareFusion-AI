import React, { useState } from 'react';
import { getApiBase, API_ENDPOINTS } from '../utils/apiConfig';
import {
    Upload,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    Folder,
    ChevronRight,
    ShieldCheck,
    CloudUpload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
    patientId: string;
    onUploadSuccess?: (data: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ patientId, onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [folderType, setFolderType] = useState('documentation');
    const [category, setCategory] = useState('General');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setMessage(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage({ type: 'error', text: 'Select a clinical document first.' });
            return;
        }

        setUploading(true);
        setUploadProgress(10);
        setMessage({ type: 'info', text: 'Initializing secure clinical transfer...' });

        const formData = new FormData();
        formData.append('patientId', patientId);
        formData.append('folderType', folderType);
        formData.append('category', category);
        formData.append('file', file);

        try {
            const baseUrl = getApiBase();
            const uploadUrl = `${baseUrl}${API_ENDPOINTS.PATIENTS}/upload`;

            setUploadProgress(30);

            // Fetch to upload
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                },
                body: formData,
            });

            setUploadProgress(80);

            let data;
            try {
                data = await response.json();
            } catch (e) {
                data = { error: 'Clinical Node Protocol Violation' };
            }

            if (response.ok) {
                setUploadProgress(100);
                setMessage({ type: 'success', text: 'Document synchronized to patient vault successfully.' });
                setFile(null);
                if (onUploadSuccess) onUploadSuccess(data);
            } else {
                setMessage({ type: 'error', text: data.detail || data.error || 'Clinical Synchrony Failure' });
            }
        } catch (error: any) {
            console.error('🔴 Upload Error:', error);
            setMessage({
                type: 'error',
                text: 'Connection Interrupted: Check your Clinical Bridge URL. (Hint: Accept the Localtunnel warning on mobile)'
            });
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    };

    const testConnection = async () => {
        setMessage({ type: 'info', text: 'Verifying Clinical Bridge...' });
        try {
            const baseUrl = getApiBase();
            const res = await fetch(`${baseUrl}/`, {
                headers: { 'bypass-tunnel-reminder': 'true' }
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Bridge Verified: Node is responsive.' });
            } else {
                setMessage({ type: 'error', text: `Bridge Restricted: Server returned ${res.status}.` });
            }
        } catch (err) {
            setMessage({
                type: 'error',
                text: 'Bridge Blocked: Please visit your Tunnel URL on this mobile browser first and click "Continue".'
            });
        }
    };

    return (
        <div className="space-y-8 bg-[#F5F0E9]/30 border-2 border-[#D9CBC2] p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden">
            <div className="flex items-center gap-4 border-b border-[#D9CBC2] pb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#112250] flex items-center justify-center text-[#E0C58F] shadow-lg">
                    <CloudUpload size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-[#112250]">Secure Clinical Upload</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3C507D] opacity-60">End-to-End Encrypted Patient Data</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#3C507D] ml-2">Condition Folder</label>
                    <div className="relative">
                        <Folder className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3C507D]/40" size={16} />
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-white border-2 border-[#D9CBC2] rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-black outline-none focus:border-[#E0C58F] transition-all shadow-inner"
                            placeholder="General"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#3C507D] ml-2">Document Classification</label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3C507D]/40" size={16} />
                        <select
                            value={folderType}
                            onChange={(e) => setFolderType(e.target.value)}
                            className="w-full bg-white border-2 border-[#D9CBC2] rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-black appearance-none outline-none focus:border-[#E0C58F] transition-all shadow-inner"
                        >
                            <option value="documentation">Documentation</option>
                            <option value="image">Medical Images</option>
                            <option value="DNA">Genomics (DNA)</option>
                            <option value="lab_reports">Lab Reports</option>
                            <option value="audio">Clinical Audio</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3C507D]/40 rotate-90" size={16} />
                    </div>
                </div>
            </div>

            <div
                className={`relative border-2 border-dashed rounded-[2rem] p-10 text-center transition-all group ${file ? 'border-[#112250] bg-white' : 'border-[#D9CBC2] bg-[#F5F0E9]/50 hover:border-[#112250]'
                    }`}
            >
                <input
                    type="file"
                    id="clinicalFileInput"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <label htmlFor="clinicalFileInput" className="cursor-pointer block space-y-4">
                    <div className="w-16 h-16 bg-[#112250]/5 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        {file ? <CheckCircle2 className="text-[#3C507D]" size={32} /> : <Upload className="text-[#3C507D]/40" size={32} />}
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black text-black">
                            {file ? file.name : "Select Medical Document"}
                        </p>
                        <p className="text-[10px] font-bold text-[#3C507D] opacity-40 uppercase tracking-widest">
                            {file ? `${(file.size / 1024).toFixed(1)} KB` : "PDF, DICOM, VCF, JPEG"}
                        </p>
                    </div>
                </label>

                {file && (
                    <button
                        onClick={() => setFile(null)}
                        className="absolute top-4 right-4 p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                        <XCircle size={20} />
                    </button>
                )}
            </div>

            <div className="space-y-6">
                <button
                    onClick={handleUpload}
                    disabled={uploading || !file}
                    className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${uploading || !file
                        ? 'bg-[#D9CBC2] text-white cursor-not-allowed opacity-50'
                        : 'bg-[#112250] text-[#E0C58F] hover:bg-[#1a2e6b] hover:-translate-y-1'
                        }`}
                >
                    {uploading ? (
                        <>
                            <RefreshCw className="animate-spin" size={20} />
                            Encrypting & Syncing...
                        </>
                    ) : (
                        <>
                            <CloudUpload size={20} />
                            Synchronize to Vault
                        </>
                    )}
                </button>

                {uploading && (
                    <div className="h-1.5 w-full bg-[#D9CBC2]/30 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-[#112250]"
                        />
                    </div>
                )}

                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`p-5 rounded-2xl flex items-start gap-3 ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
                                message.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' :
                                    'bg-blue-50 border border-blue-200 text-blue-800'
                                }`}
                        >
                            {message.type === 'success' ? <CheckCircle2 className="mt-0.5" size={18} /> :
                                message.type === 'error' ? <AlertCircle className="mt-0.5" size={18} /> :
                                    <RefreshCw className="animate-spin mt-0.5" size={18} />}
                            <div className="text-xs font-bold leading-relaxed">{message.text}</div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-center border-t border-[#D9CBC2] pt-6">
                    <button
                        onClick={testConnection}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#3C507D] opacity-40 hover:opacity-100 transition-all"
                    >
                        <RefreshCw size={12} />
                        Verify Clinical Handshake
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
