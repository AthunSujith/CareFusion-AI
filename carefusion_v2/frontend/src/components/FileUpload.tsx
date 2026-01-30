import React, { useState } from 'react';

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
        formData.append('file', file);
        formData.append('patientId', patientId);
        formData.append('folderType', folderType);

        try {
            const response = await fetch('http://localhost:5000/api/v2/patients/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('✅ Success: File uploaded to ' + folderType);
                setFile(null);
                if (onUploadSuccess) onUploadSuccess(data);
            } else {
                setMessage('❌ Error: ' + data.error);
            }
        } catch (error) {
            setMessage('❌ Connection Error');
        } finally {
            setUploading(false);
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

                {message && (
                    <p className={`text-sm text-center mt-4 ${message.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
