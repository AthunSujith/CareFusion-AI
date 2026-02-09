import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBase, API_ENDPOINTS } from '../utils/apiConfig';
import { Shield, Users, FileText, Check, X, Activity, Lock, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueueItem {
    user_id: string;
    doctor_id?: string;
    user_type: string;
    full_name: string;
    email: string;
    submitted_at: string;
    risk_score: number;
    document_count: number;
    status: string;
    resubmission_count: number;
}

interface DetailItem {
    user_id?: string;
    doctor_id?: string;
    personal_info: {
        full_name: string;
        email: string;
        phone: string;
        dob: string;
        address: string;
    };
    documents: Array<{
        doc_id: string;
        doc_type: string;
        original_filename: string;
        file_size: number;
        mime_type: string;
    }>;
}

interface ViewingDoc {
    id: string;
    name: string;
    type: string;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('queue');
    const [subTab, setSubTab] = useState('users'); // 'users' or 'doctors'
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<DetailItem | null>(null);
    // isLoading removed
    const [viewingDoc, setViewingDoc] = useState<ViewingDoc | null>(null);
    const [docUrl, setDocUrl] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [systemSettings, setSystemSettings] = useState<any>(null);
    const [knowledgeStatus, setKnowledgeStatus] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Mock Login Check
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/admin/login');
        } else {
            if (activeTab === 'queue') fetchQueue();
            if (activeTab === 'audit') fetchAuditLogs();
            if (activeTab === 'settings') fetchSettings();
            if (activeTab === 'knowledge') fetchKnowledgeStatus();
        }
    }, [activeTab, subTab]); // Refetch when switching tabs

    const fetchKnowledgeStatus = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${getApiBase()}/api/v2/knowledge/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'bypass-tunnel-reminder': 'true'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setKnowledgeStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch knowledge status", error);
        }
    };

    const handleKnowledgeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.pdf')) {
            alert("Only PDF files are supported for clinical knowledge.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${getApiBase()}/api/v2/knowledge/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'bypass-tunnel-reminder': 'true'
                },
                body: formData
            });

            if (response.ok) {
                alert("Document successfully ingested into 'Daily Knowledge' vector store.");
                fetchKnowledgeStatus();
            } else {
                const error = await response.json();
                alert(`Upload failed: ${error.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Knowledge upload failed", error);
            alert("Network error during upload.");
        } finally {
            setIsUploading(false);
            event.target.value = ''; // Reset input
        }
    };

    const fetchQueue = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const type = subTab === 'users' ? 'users' : 'doctors';
            const response = await fetch(`${getApiBase()}${API_ENDPOINTS.ADMIN}/queue/${type}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'bypass-tunnel-reminder': 'true'
                }
            });
            if (response.status === 401) {
                handleLogout();
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setQueueItems(data);
            }
        } catch (error) {
            console.error("Failed to fetch queue", error);
        }
    };

    const fetchDetails = async (id: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${getApiBase()}${API_ENDPOINTS.ADMIN}/queue/item/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'bypass-tunnel-reminder': 'true'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedItem(data);
                setReason(''); // Reset reason
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleViewDocument = async (docId: string, targetId: string, filename: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${getApiBase()}${API_ENDPOINTS.ADMIN}/document/view`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'bypass-tunnel-reminder': 'true'
                },
                body: JSON.stringify({ doc_id: docId, target_id: targetId })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setDocUrl(url);
                setViewingDoc({ id: docId, name: filename, type: blob.type });
            } else {
                alert("Failed to decrypt document");
            }
        } catch (e) {
            console.error(e);
            alert("Error viewing document");
        }
    };

    const handleDecision = async (action: string) => {
        if (!selectedItem) return;
        if (!confirm(`Are you sure you want to ${action}? This action is audited.`)) return;

        try {
            const token = localStorage.getItem('admin_token');
            const targetId = selectedItem.user_id || selectedItem.doctor_id;

            const response = await fetch(`${getApiBase()}${API_ENDPOINTS.ADMIN}/decision`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'bypass-tunnel-reminder': 'true'
                },
                body: JSON.stringify({
                    target_id: targetId,
                    action: action,
                    reason: reason
                })
            });

            if (response.ok) {
                alert(`Successfully ${action.toLowerCase()}ed`);
                setSelectedItem(null);
                setViewingDoc(null);
                fetchQueue();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${getApiBase()}${API_ENDPOINTS.ADMIN}/audit/logs`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'bypass-tunnel-reminder': 'true'
                }
            });
            if (response.status === 401) {
                handleLogout();
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setAuditLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        }
    };

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${getApiBase()}${API_ENDPOINTS.ADMIN}/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'bypass-tunnel-reminder': 'true'
                }
            });
            if (response.status === 401) {
                handleLogout();
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setSystemSettings(data);
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-10">
                    <Shield className="w-8 h-8 text-emerald-500" />
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                        Admin Verify
                    </span>
                </div>

                <nav className="space-y-2 flex-1">
                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'queue' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-900'}`}
                    >
                        <Check className="w-5 h-5" />
                        Verification Queue
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'audit' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-900'}`}
                    >
                        <Activity className="w-5 h-5" />
                        Audit Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-900'}`}
                    >
                        <Lock className="w-5 h-5" />
                        Security Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('knowledge')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'knowledge' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-900'}`}
                    >
                        <Activity className="w-5 h-5" />
                        Daily Knowledge
                    </button>
                </nav>

                <div className="pt-6 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
                            <span className="text-xs font-bold text-emerald-500">SA</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-200">Super Admin</p>
                            <p className="text-xs text-slate-500">Security Clearance: L5</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'queue' && (
                    <>
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-2">Verification Queue</h1>
                                <p className="text-slate-400">Review and verify pending identity applications</p>
                            </div>
                            <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
                                <button
                                    onClick={() => setSubTab('users')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${subTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Patients
                                </button>
                                <button
                                    onClick={() => setSubTab('doctors')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${subTab === 'doctors' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Doctors
                                </button>
                            </div>
                        </header>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-4 gap-6 mb-8">
                            <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-6 h-6 text-blue-400" /></div>
                                    <span className="text-xs font-medium text-slate-500">Total Pending</span>
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-1">{queueItems.length}</h3>
                                <p className="text-xs text-slate-400">+5 from yesterday</p>
                            </div>
                            {/* Add more stats if needed */}
                        </div>

                        {/* Queue Table */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-900/50 border-b border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Applicant</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Submitted</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Documents</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Risk Score</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {queueItems.map((item) => (
                                        <tr key={item.user_id} className="hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => fetchDetails(item.user_id)}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                                                        {item.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{item.full_name}</p>
                                                        <p className="text-xs text-slate-400">{item.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">{new Date(item.submitted_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm text-slate-400 flex items-center gap-2">
                                                <FileText className="w-4 h-4" /> {item.document_count} Files
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.risk_score > 60 ? 'bg-red-900/50 text-red-400 border border-red-500/30' :
                                                    item.risk_score > 30 ? 'bg-amber-900/50 text-amber-400 border border-amber-500/30' :
                                                        'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30'
                                                    }`}>
                                                    {item.risk_score} / 100
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">Review</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {queueItems.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                No pending verifications found. Good job!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'audit' && (
                    <>
                        <header className="mb-8">
                            <h1 className="text-2xl font-bold text-white mb-2">Audit Logs</h1>
                            <p className="text-slate-400">Track all administrative actions and security events</p>
                        </header>

                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-900/50 border-b border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Admin</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Target ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {auditLogs.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm text-slate-200">{log.admin_id}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-slate-900 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">{log.target_user_id}</td>
                                            <td className="px-6 py-4 text-sm text-slate-400">{log.decision_reason || '-'}</td>
                                        </tr>
                                    ))}
                                    {auditLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                No audit logs recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'settings' && systemSettings && (
                    <>
                        <header className="mb-8">
                            <h1 className="text-2xl font-bold text-white mb-2">Security Settings</h1>
                            <p className="text-slate-400">System security configuration and audit parameters</p>
                        </header>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-2xl">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-indigo-400" /> Administrative Access
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/30">
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">Session Timeout</p>
                                            <p className="text-xs text-slate-500">Automatic logout after inactivity</p>
                                        </div>
                                        <span className="text-indigo-400 font-mono text-sm">{systemSettings.admin_session_timeout}s</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/30">
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">2FA Status</p>
                                            <p className="text-xs text-slate-500">Multi-factor authentication requirement</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${systemSettings.admin_2fa_enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {systemSettings.admin_2fa_enabled ? 'ENABLED' : 'DISABLED'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/30">
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">JWT Algorithm</p>
                                            <p className="text-xs text-slate-500">Token signature method</p>
                                        </div>
                                        <span className="text-slate-400 font-mono text-xs">{systemSettings.algorithm}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-2xl">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-emerald-400" /> Verification Protocol
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/30">
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">NMC Verification</p>
                                            <p className="text-xs text-slate-500">Automated medical license checks</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${systemSettings.nmc_verification_required ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {systemSettings.nmc_verification_required ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/30">
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">Encryption Method</p>
                                            <p className="text-xs text-slate-500">Document rest-state encryption</p>
                                        </div>
                                        <span className="text-slate-400 font-mono text-xs">{systemSettings.document_encryption}</span>
                                    </div>
                                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                                        <p className="text-xs text-indigo-300 mb-2 font-bold uppercase tracking-wider">Risk Thresholds</p>
                                        <div className="flex gap-4">
                                            <div className="flex-1 bg-slate-950 p-2 rounded-lg text-center">
                                                <p className="text-[10px] text-slate-500 font-bold">MEDIUM</p>
                                                <p className="text-sm font-bold text-amber-500">{systemSettings.risk_thresholds.medium}%</p>
                                            </div>
                                            <div className="flex-1 bg-slate-950 p-2 rounded-lg text-center">
                                                <p className="text-[10px] text-slate-500 font-bold">HIGH</p>
                                                <p className="text-sm font-bold text-red-500">{systemSettings.risk_thresholds.high}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'knowledge' && (
                    <>
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-2">Daily Knowledge Management</h1>
                                <p className="text-slate-400">Update the clinical vector store with external medical documentation</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className={`cursor-pointer px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isUploading ? 'bg-slate-800 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'}`}>
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            Ingesting...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-5 h-5" />
                                            Add Document
                                        </>
                                    )}
                                    <input type="file" className="hidden" accept=".pdf" onChange={handleKnowledgeUpload} disabled={isUploading} />
                                </label>
                            </div>
                        </header>

                        {knowledgeStatus && (
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Vector Count</p>
                                    <h3 className="text-4xl font-black text-white">{knowledgeStatus.vector_count?.toLocaleString()}</h3>
                                    <p className="text-xs text-slate-500 mt-2">Individual embeddings in {knowledgeStatus.collection_name}</p>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Document Scale</p>
                                    <h3 className="text-4xl font-black text-white">{knowledgeStatus.document_count}</h3>
                                    <p className="text-xs text-slate-500 mt-2">PDF sources currently indexed</p>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                                    <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Last Update</p>
                                    <h3 className="text-xl font-bold text-white mt-2">
                                        {knowledgeStatus.last_upload ? new Date(knowledgeStatus.last_upload).toLocaleDateString() : 'Never'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {knowledgeStatus.last_upload ? new Date(knowledgeStatus.last_upload).toLocaleTimeString() : 'No activity'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl mb-8">
                            <h3 className="text-xl font-bold text-white mb-4">Clinical Reasoning Context</h3>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                The documents you upload here form the "Primary Evidence" for the Clinical Advisory Reasoning Layer (CARL).
                                When doctors use the Symptom AI, the system will search these specific documents to generate evidence-bound insights.
                            </p>
                            <div className="flex gap-4">
                                <div className="flex-1 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                    <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
                                        <Check className="w-4 h-4" /> Ground Truth
                                    </div>
                                    <p className="text-xs text-slate-500">Retrieval is strictly limited to these admin-verified sources.</p>
                                </div>
                                <div className="flex-1 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                                        <Activity className="w-4 h-4" /> Version Control
                                    </div>
                                    <p className="text-xs text-slate-500">Every upload triggers a real-time re-indexing of the vector space.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
                            <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Knowledge Synchronization Active</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                All clinical documents are processed using bge-m3 embeddings and stored in a secure local vector database.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex"
                        >
                            {/* Left: Details */}
                            <div className="w-1/3 border-r border-slate-800 p-6 overflow-y-auto bg-slate-900">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-xl font-bold text-white">Application Review</h2>
                                    <button onClick={() => { setSelectedItem(null); setViewingDoc(null); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Personal Info */}
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-indigo-400" /> Personal Identity
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="grid grid-cols-3 gap-2">
                                                <span className="text-slate-500">Full Name</span>
                                                <span className="col-span-2 text-slate-200">{selectedItem.personal_info.full_name}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <span className="text-slate-500">DOB</span>
                                                <span className="col-span-2 text-slate-200">{selectedItem.personal_info.dob}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <span className="text-slate-500">Email</span>
                                                <span className="col-span-2 text-slate-200">{selectedItem.personal_info.email}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <span className="text-slate-500">Phone</span>
                                                <span className="col-span-2 text-slate-200">{selectedItem.personal_info.phone}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <span className="text-slate-500">Address</span>
                                                <span className="col-span-2 text-slate-200">{selectedItem.personal_info.address}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documents List */}
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-indigo-400" /> Submitted Documents
                                        </h3>
                                        <div className="space-y-2">
                                            {selectedItem.documents.map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                            <FileText className="w-4 h-4 text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-200">{doc.doc_type.replace(/_/g, " ")}</p>
                                                            <p className="text-xs text-slate-500">{(doc.file_size / 1024).toFixed(1)} KB • {doc.mime_type}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => selectedItem && (selectedItem.user_id || selectedItem.doctor_id) && handleViewDocument(doc.doc_id, selectedItem.user_id || selectedItem.doctor_id || "", doc.original_filename)}
                                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-md transition-colors"
                                                    >
                                                        View Encrypted
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="space-y-3 pt-4 border-t border-slate-800">
                                        <textarea
                                            placeholder="Audit notes / Rejection reason..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                            rows={3}
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleDecision('REJECT')}
                                                className="w-full py-2.5 bg-red-900/20 hover:bg-red-900/30 text-red-500 border border-red-500/20 rounded-xl text-sm font-medium transition-colors"
                                            >
                                                Reject Application
                                            </button>
                                            <button
                                                onClick={() => handleDecision('APPROVE')}
                                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-emerald-900/20"
                                            >
                                                Approve & Activate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Document Viewer */}
                            <div className="flex-1 bg-slate-950 flex flex-col relative">
                                {viewingDoc && docUrl ? (
                                    <>
                                        <div className="h-14 border-b border-slate-800 flex items-center justify-center px-6 bg-slate-900">
                                            <span className="text-sm font-medium text-slate-300 mr-2">
                                                Viewing: <span className="text-white">{viewingDoc.name}</span>
                                            </span>
                                            <span className="text-xs text-emerald-500 flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> Decrypted in-memory (AES-256)
                                            </span>
                                        </div>
                                        <div className="flex-1 p-4 bg-slate-950 flex items-center justify-center overflow-auto">
                                            {viewingDoc.type.includes('image') ? (
                                                <img src={docUrl} alt="Document" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                                            ) : (
                                                <iframe src={docUrl} className="w-full h-full rounded-lg border border-slate-800 bg-white" title="PDF Viewer" />
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                                        <Lock className="w-16 h-16 mb-4 opacity-50" />
                                        <p className="font-medium">Secure Document Viewer</p>
                                        <p className="text-sm max-w-md text-center mt-2">
                                            Select a document from the left panel to decrypt and view it.
                                            Documents are streamed securely and never stored on disk unencrypted.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
