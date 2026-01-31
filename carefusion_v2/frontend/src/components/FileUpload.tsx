import React, { useState } from 'react';
import { getApiBase, API_ENDPOINTS } from '../utils/apiConfig';


interface FileUploadProps {
    patientId: string;
    onUploadSuccess?: (data: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ patientId, onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [folderType, setFolderType] = useState('documentation');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        setUploading(true);
        setMessage('');


        const formData = new FormData();
        formData.append('patientId', patientId);
        formData.append('folderType', folderType);
        formData.append('file', file); // Append file last so req.body fields are available to Multer

        try {
            const baseUrl = getApiBase();
            const uploadUrl = `${baseUrl}${API_ENDPOINTS.PATIENTS}/upload`;
            console.log('🔵 Upload attempt:', { uploadUrl, patientId, folderType, fileName: file.name });

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                },
                body: formData,
            });

            console.log('🔵 Response status:', response.status, response.statusText);

            let data;
            try {
                data = await response.json();
            } catch (e) {
                data = { error: 'Invalid response from server' };
            }

            if (response.ok) {
                setMessage('✅ Success: File synchronized to vault');
                setFile(null);
                if (onUploadSuccess) onUploadSuccess(data);
            } else {
                setMessage('❌ Error: ' + (data.error || 'Upload failed'));
            }
        } catch (error: any) {
            console.error('🔴 Upload error detail:', error);
            setMessage(`❌ Connection Blocked: Check if backend is running on port 5000`);
        } finally {
            setUploading(false);
        }
    };

    const testConnection = async () => {
        setMessage('🔄 Testing clinical handshake...');
        try {
            const baseUrl = getApiBase();
            const res = await fetch(`${baseUrl}/`, {
                headers: { 'bypass-tunnel-reminder': 'true' }
            });
            if (res.ok) {
                setMessage('✅ Handshake Verified: Backend reachable');
            } else {
                setMessage('⚠️ Handshake Failed: Server returned ' + res.status);
            }
        } catch (err) {
            setMessage('❌ Handshake Blocked: Browser is restricting access to the backend');
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="text-xl font-semibold mb-4 text-white">Upload clinical Data</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Target Folder</label>
                    <select
                        className="w-full bg-black/40 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
                        value={folderType}
                        onChange={(e) => setFolderType(e.target.value)}
                    >
                        <option value="documentation">Documentation</option>
                        <option value="image">Medical Images</option>
                        <option value="DNA">Genomics (DNA)</option>
                        <option value="lab_reports">Lab Reports</option>
                        <option value="audio">Audio Files</option>
                        <option value="AI_chat">Chat Logs</option>
                    </select>
                </div>

                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-colors">
                    <input
                        type="file"
                        id="fileInput"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="fileInput" className="cursor-pointer">
                        {file ? (
                            <span className="text-cyan-400 font-medium">{file.name}</span>
                        ) : (
                            <span className="text-gray-400">Click to select or drag file here</span>
                        )}
                    </label>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={uploading || !file}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${uploading || !file
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                        }`}
                >
                    {uploading ? 'Uploading...' : 'Confirm Upload to Patient Database'}
                </button>

                <div className="flex flex-col gap-3">
                    {message && (
                        <p className={`text-sm text-center font-bold px-4 py-2 rounded-lg ${message.includes('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {message}
                        </p>
                    )}

                    <button
                        onClick={testConnection}
                        className="text-[10px] text-gray-400 hover:text-white uppercase tracking-widest transition-colors"
                    >
                        Troubleshoot Connection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
