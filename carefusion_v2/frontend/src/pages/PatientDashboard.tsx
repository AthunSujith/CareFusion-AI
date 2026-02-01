import { useState, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    Copy,
    ShieldCheck,
    Activity,
    LogOut,
    Bell,
    Settings,
    Fingerprint,
    RefreshCw,
    Dna,
    ArrowRight,
    FileText,
    User,
    Lock as LockIcon,
    History as HistoryIcon,
    MessagesSquare,
    Bot,
    Send,
    Upload,
    X as XIcon,
    FileSearch,
    Folder,
    Plus
} from 'lucide-react';


import { Link } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import MobileAppHeader from '../components/MobileAppHeader';
import { isStandalone } from '../utils/pwa';
import { getApiBase, API_ENDPOINTS, setApiBase } from '../utils/apiConfig';



const PatientDashboard = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [accessCode, setAccessCode] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'reports' | 'settings' | 'aichat'>('overview');
    const [records, setRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [copied, setCopied] = useState(false);

    const [categories, setCategories] = useState<string[]>(['General']);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const PATIENT_ID = 'PAT-001-X'; // Unified patient ID for this demo
    const [showBridgeSettings, setShowBridgeSettings] = useState(false);
    const [newTunnelUrl, setNewTunnelUrl] = useState('');

    // AI Chat State
    const [chatMessages, setChatMessages] = useState<any[]>([
        { id: '1', type: 'bot', text: "Hello. I am MedGemma 1.5, your specialized clinical AI. You can chat with me or upload medical documents for deep analysis." }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatThinking, setIsChatThinking] = useState(false);
    const [chatPdf, setChatPdf] = useState<File | null>(null);
    const chatPdfInputRef = useRef<HTMLInputElement>(null);
    const chatMessagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (activeTab === 'aichat') {
            scrollToBottom();
        }
    }, [chatMessages, activeTab]);


    // Logic for 2-minute code expiry and 1-hour session termination
    useEffect(() => {
        let timer: any;

        if (timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && accessCode) {
            setAccessCode(null);
        }
        return () => clearInterval(timer);
    }, [timeLeft, accessCode]);

    // One hour termination logic
    useEffect(() => {
        if (accessCode) {
            const terminationTimer = setTimeout(() => {
                setAccessCode(null);
                console.log('Session terminated after 1 hour.');
            }, 3600000); // 1 hour
            return () => clearTimeout(terminationTimer);
        }
    }, [accessCode]);


    const fetchPatientData = async () => {
        setIsLoading(true);
        try {
            const baseUrl = getApiBase();
            const response = await fetch(`${baseUrl}${API_ENDPOINTS.AI}/records/patient/${PATIENT_ID}`, {
                headers: {
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                }
            });

            const data = await response.json();
            if (data.status === 'success') {
                setRecords(data.records);
            }
        } catch (error) {
            console.error('Portal Sync Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const baseUrl = getApiBase();
            const response = await fetch(`${baseUrl}${API_ENDPOINTS.PATIENTS}/patients/${PATIENT_ID}/categories`, {
                headers: {
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    useEffect(() => {
        fetchPatientData();
        fetchCategories();
    }, []);

    const filteredRecords = selectedCategory === 'All'
        ? records
        : records.filter(r => r.category === selectedCategory);


    const generateCode = async () => {
        setIsGenerating(true);
        setCopied(false);

        // Generate a clean code
        const code = Math.random().toString(36).substring(2, 5).toUpperCase() + '-' +
            Math.random().toString(36).substring(2, 5).toUpperCase() + '-' +
            Math.random().toString(36).substring(2, 5).toUpperCase();

        try {
            const baseUrl = getApiBase();
            const response = await fetch(`${baseUrl}/api/v2/patients/handshake/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: PATIENT_ID,
                    code: code,
                    patientName: "Sarah Williams"
                })
            });

            if (response.ok) {
                setAccessCode(code);
                setTimeLeft(300); // 5 minutes to match backend
            } else {
                console.error("Failed to register handshake");
            }
        } catch (error) {
            console.error("Handshake Error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (accessCode) {
            navigator.clipboard.writeText(accessCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSendGeneralChat = async () => {
        if (!chatInput.trim() && !chatPdf) return;

        const userMsg = { id: Date.now().toString(), type: 'user', text: chatInput || (chatPdf ? `📄 [Analyzing Document: ${chatPdf.name}]` : "") };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsChatThinking(true);

        const formData = new FormData();
        formData.append('prompt', chatInput || "Analyze this medical document.");
        formData.append('userId', PATIENT_ID);
        formData.append('category', selectedCategory === 'All' ? 'General' : selectedCategory);
        if (chatPdf) formData.append('pdf_doc', chatPdf);

        try {
            const baseUrl = getApiBase();
            const url = `${baseUrl}${API_ENDPOINTS.AI}/chat/general`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                },
                body: formData
            });

            if (!response.ok) throw new Error(`Server error ${response.status}`);

            const data = await response.json();

            if (data.status === 'accepted' && data.analysisId) {
                let completed = false;
                const analysisId = data.analysisId;
                while (!completed) {
                    await new Promise(r => setTimeout(r, 5000));
                    const statusUrl = `${baseUrl}${API_ENDPOINTS.AI}/status/${analysisId}`;
                    const statusRes = await fetch(statusUrl, {
                        headers: { 'Authorization': 'Bearer clinical-access-token-2026', 'bypass-tunnel-reminder': 'true' }
                    });
                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        if (statusData.status === 'completed') {
                            completed = true;
                            setChatMessages(prev => [...prev, {
                                id: Date.now().toString(),
                                type: 'bot',
                                text: statusData.result?.ai_response || "Analysis complete."
                            }]);
                            fetchPatientData(); // Refresh history
                            fetchCategories();  // Refresh folders
                        } else if (statusData.status === 'failed') {
                            completed = true;
                            throw new Error(statusData.error || "AI analysis failed.");
                        }
                    }
                }
            } else {
                setChatMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    type: 'bot',
                    text: data.result?.ai_response || "Analysis complete."
                }]);
            }
        } catch (error: any) {
            console.error("Chat Error:", error);
            alert(`❌ AI Chat Error: ${error.message}`);
        } finally {
            setIsChatThinking(false);
            setChatPdf(null);
        }
    };


    return (
        <div className="flex h-screen bg-[#F5F0E9] text-black font-main antialiased overflow-hidden">
            {/* Sidebar - Luxury Clinical Theme */}
            <aside className="hidden lg:flex w-24 border-r border-[#D9CBC2] bg-[#112250] flex-col items-center py-10 shrink-0 z-50 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
                    <img src="https://images.unsplash.com/photo-1631549916768-4119cb21af14?auto=format&fit=crop&q=80&w=1000" alt="bg" className="w-full h-full object-cover" />
                </div>
                <button
                    onClick={() => setActiveTab('overview')}
                    className="w-14 h-14 rounded-2xl bg-[#E0C58F] flex items-center justify-center shadow-lg mb-12 hover:scale-105 transition-transform z-10"
                >
                    <Activity className="text-black w-7 h-7" />
                </button>

                <nav className="flex-1 space-y-10 z-10">
                    <NavIcon icon={<Activity />} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Home" />
                    <NavIcon icon={<HistoryIcon />} active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="History" />
                    <NavIcon icon={<FileText />} active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="Reports" />
                    <NavIcon icon={<MessagesSquare />} active={activeTab === 'aichat'} onClick={() => setActiveTab('aichat')} label="AI Chat" />
                    <NavIcon icon={<Settings />} active={activeTab === 'settings'} onClick={() => setShowBridgeSettings(true)} label="Settings" />
                </nav>

                <div className="mt-auto space-y-8 z-10">
                    <button className="w-12 h-12 rounded-2xl border border-[#D9CBC2]/20 flex items-center justify-center text-[#E0C58F] hover:bg-[#3C507D]">
                        <Bell size={20} />
                    </button>
                    <Link to="/login" className="w-12 h-12 rounded-2xl border border-[#D9CBC2]/20 text-white hover:bg-rose-900/20 flex items-center justify-center transition-all">
                        <LogOut size={20} />
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 overflow-y-auto custom-scrollbar relative ${isStandalone() ? 'pt-0 pb-24' : ''}`}>
                <MobileAppHeader title="CareFusion Patient" />

                {/* Global Luxury Background Image */}
                <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply z-0">
                    <img
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000"
                        alt="Background Texture"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="max-w-6xl mx-auto p-10 lg:p-16 space-y-12 relative z-10">
                    {/* Header - High Legibility */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D9CBC2]/20 border border-[#D9CBC2] rounded-lg">
                                <ShieldCheck className="w-4 h-4 text-[#3C507D]" />
                                <span className="text-[12px] font-bold text-black uppercase tracking-wide">Environment Secure</span>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight">
                                    {activeTab === 'overview' ? 'Patient Portal' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                </h1>

                                <p className="text-xl text-black/60 font-bold">Sarah Williams</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-8 items-center md:pb-2">
                            <HeaderStat label="Health Score" val="92%" />
                            <HeaderStat label="Security" val="Level S" />
                            <HeaderStat label="Sync Status" val="READY" color="text-[#3C507D]" />
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 xl:grid-cols-12 gap-10"
                        >
                            {activeTab === 'overview' ? (
                                <>
                                    {/* Main Workspace */}
                                    <div className="xl:col-span-8 space-y-10">
                                        {/* Simple Direct Handshake Card */}
                                        <section className="bg-white p-10 md:p-12 border-2 border-[#D9CBC2] rounded-[3rem] shadow-lg relative overflow-hidden group min-h-[400px]">
                                            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                                <img
                                                    src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1000"
                                                    alt="Clinical Visual"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 h-full">
                                                <div className="max-w-md space-y-6 text-center lg:text-left">
                                                    <div className="w-16 h-16 rounded-2xl bg-[#F5F0E9] border border-[#D9CBC2] flex items-center justify-center text-black mx-auto lg:mx-0 shadow-inner">
                                                        <Fingerprint size={32} />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h2 className="text-3xl font-black text-black">Secure Doctor Sync</h2>
                                                        <p className="text-black/60 text-lg font-medium leading-relaxed">Activate your temporary handshake code to allow clinical data synchronization with your physician.</p>
                                                    </div>
                                                </div>


                                                <div className="flex flex-col items-center lg:items-end gap-6 w-full lg:w-auto">
                                                    <AnimatePresence mode="wait">
                                                        {!accessCode ? (
                                                            <button
                                                                onClick={generateCode}
                                                                disabled={isGenerating}
                                                                className="btn-premium bg-[#112250] text-[#E0C58F] px-12 py-6 text-lg w-full lg:w-auto shadow-xl"
                                                            >
                                                                {isGenerating ? <RefreshCw className="animate-spin" /> : "Generate Sync Code"}
                                                            </button>
                                                        ) : (
                                                            <div className="space-y-4 w-full lg:w-auto">
                                                                <div className="relative group/code">
                                                                    <div className="bg-[#112250] border-2 border-[#E0C58F] rounded-3xl px-12 py-8 text-4xl font-black text-[#E0C58F] tracking-[0.3em] font-display text-center shadow-2xl min-w-[320px]">
                                                                        {accessCode}
                                                                    </div>
                                                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={copyToClipboard}
                                                                            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-[#E0C58F] transition-all backdrop-blur-md border border-white/10"
                                                                            title="Copy Code"
                                                                        >
                                                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                                                        </button>
                                                                        <button
                                                                            onClick={generateCode}
                                                                            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-[#E0C58F] transition-all backdrop-blur-md border border-white/10"
                                                                            title="Regenerate Code"
                                                                        >
                                                                            <RefreshCw size={18} className={isGenerating ? 'animate-spin' : ''} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#E0C58F] text-[#112250] text-[10px] font-black rounded-full shadow-lg border-2 border-[#112250] uppercase tracking-widest">
                                                                        Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                                                    </div>
                                                                </div>
                                                                <div className="pt-6">
                                                                    <button
                                                                        onClick={() => setAccessCode(null)}
                                                                        className="w-full text-sm font-bold text-rose-600 hover:text-rose-700 underline underline-offset-4 text-center uppercase tracking-widest"
                                                                    >
                                                                        Stop Sharing Now
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                    </AnimatePresence>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-black opacity-40 uppercase tracking-widest">
                                                        <LockIcon size={14} className="text-[#3C507D]" /> Private and Secure Sync
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Condition Folders Navigation */}
                                        <section className="space-y-6">
                                            <div className="flex items-center justify-between mb-2 px-2">
                                                <h3 className="text-xs font-black text-black/40 uppercase tracking-[0.2em]">Medical Condition Folders</h3>
                                                <button
                                                    onClick={() => {
                                                        const name = prompt("Enter new medical condition / folder name:");
                                                        if (name && !categories.includes(name)) {
                                                            setCategories([...categories, name]);
                                                            setSelectedCategory(name);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 text-[10px] font-black text-[#112250] hover:text-[#3C507D] transition-colors uppercase tracking-widest"
                                                >
                                                    <Plus size={14} /> New Folder
                                                </button>
                                            </div>
                                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                                <button
                                                    onClick={() => setSelectedCategory('All')}
                                                    className={`shrink-0 px-6 py-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${selectedCategory === 'All' ? 'bg-[#112250] text-[#E0C58F] border-[#112250] shadow-lg' : 'bg-white text-black border-[#D9CBC2] opacity-60 hover:opacity-100'}`}
                                                >
                                                    <Activity size={18} />
                                                    <span className="font-bold text-sm">All Records</span>
                                                </button>
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={`shrink-0 px-6 py-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${selectedCategory === cat ? 'bg-[#112250] text-[#E0C58F] border-[#112250] shadow-lg' : 'bg-white text-black border-[#D9CBC2] opacity-60 hover:opacity-100'}`}
                                                    >
                                                        <Folder size={18} />
                                                        <span className="font-bold text-sm">{cat}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Records - Highly Readable Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <section className="space-y-6">
                                                <div className="flex items-center justify-between mb-2 px-2">
                                                    <h3 className="text-xs font-black text-black/40 uppercase tracking-[0.2em]">Medical History</h3>
                                                    <ArrowRight size={18} className="text-[#D9CBC2]" />
                                                </div>
                                                <div className="space-y-5">
                                                    {isLoading ? (
                                                        <p className="text-xs text-black/40 animate-pulse p-4">Syncing History...</p>
                                                    ) : filteredRecords.length > 0 ? (
                                                        filteredRecords.slice(0, 3).map((r, i) => (
                                                            <RecordCard
                                                                key={i}
                                                                title={r.recordType === 'imaging' ? `Scan: ${r.moduleData.prediction}` : r.recordType === 'genomics' ? 'Genomic Sequence' : r.recordType === 'document' ? r.moduleData.filename : 'Symptom Case'}
                                                                desc={r.recordType === 'imaging' ? 'Radiology Report' : r.recordType === 'genomics' ? 'DNA Profile' : r.recordType === 'document' ? 'Clinical Document' : 'AI Reasoning'}
                                                                date={new Date(r.timestamp).toLocaleDateString()}
                                                                status={r.category || "Stored"}
                                                                icon={r.recordType === 'imaging' ? <Activity size={24} /> : r.recordType === 'genomics' ? <Dna size={24} /> : r.recordType === 'document' ? <FileText size={24} /> : <FileText size={24} />}
                                                            />
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-black/40 p-4">No records in this category.</p>
                                                    )}
                                                </div>

                                            </section>

                                            <section className="space-y-6">
                                                <h3 className="text-xs font-black text-black/40 uppercase tracking-[0.2em] px-2">Account Activity</h3>
                                                <div className="bg-white border-2 border-[#D9CBC2] p-8 space-y-7 rounded-[2rem]">
                                                    <ActivityItem label="Dr. Sarah Maxwell Accessed Portal" time="15m ago" />
                                                    <ActivityItem label="Biometric Sign-In Successful" time="2h ago" />
                                                    <ActivityItem label="X-Ray Records Downloaded" time="Yesterday" />
                                                </div>
                                            </section>
                                        </div>
                                    </div>

                                    {/* Profile Sidebar */}
                                    <aside className="xl:col-span-4 space-y-10">
                                        <section className="bg-white border-2 border-[#D9CBC2] p-10 text-center space-y-8 rounded-[3rem]">
                                            <div className="w-28 h-28 rounded-full bg-[#F5F0E9] border border-[#D9CBC2] flex items-center justify-center mx-auto shadow-inner relative group">
                                                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                                                    <User size={48} className="text-[#3C507D]" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h2 className="text-3xl font-black text-black">Sarah W.</h2>
                                                <p className="text-xs font-black text-black/40 uppercase tracking-[0.2em]">Patient #US-928A42</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <MiniStat label="Age" val="28" />
                                                <MiniStat label="Blood" val="AB+" />
                                                <MiniStat label="Height" val="172cm" />
                                                <MiniStat label="Weight" val="64kg" />
                                            </div>
                                        </section>

                                        <section className="bg-white border-2 border-[#D9CBC2] p-10 space-y-8 rounded-[3rem]" >
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black text-black/40 uppercase tracking-[0.2em]">Latest Alert</h3>
                                                <Bell size={20} className="text-[#3C507D]" />
                                            </div>
                                            <div className="bg-[#112250] text-[#E0C58F] rounded-3xl p-6 space-y-4 shadow-xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-10 bg-[#E0C58F] rounded-full" />
                                                    <div>
                                                        <div className="text-lg font-bold">Lab Results Ready</div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">System Notification</div>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-medium opacity-80 leading-relaxed">Your genomic sequencing for Clinical Case XJ-102 is complete and verified.</p>
                                            </div>
                                        </section>

                                    </aside>
                                </>
                            ) : (
                                activeTab === 'reports' ? (
                                    <div className="xl:col-span-12 space-y-8">
                                        <section className="bg-white p-10 md:p-12 border-2 border-[#D9CBC2] rounded-[3rem] shadow-lg">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                <div>
                                                    <h2 className="text-3xl font-black text-black">Clinical Document Vault</h2>
                                                    <p className="text-black/60 font-medium">Upload and manage your clinical records securely.</p>
                                                </div>
                                            </div>
                                            <FileUpload patientId={PATIENT_ID} onUploadSuccess={() => { fetchPatientData(); fetchCategories(); }} />
                                        </section>

                                        <div className="grid gap-6">
                                            {filteredRecords.map((r, i) => (
                                                <RecordCard
                                                    key={i}
                                                    title={r.recordType === 'imaging' ? `Scan Analysis: ${r.moduleData.prediction}` : r.recordType === 'genomics' ? 'Genomic Sequence Manifest' : r.recordType === 'document' ? r.moduleData.filename : 'Symptom AI reasoning'}
                                                    desc={`Clinical Record - ID: ${r._id.slice(-6)}`}
                                                    date={new Date(r.timestamp).toLocaleDateString()}
                                                    status={r.category || "Verified"}
                                                    icon={r.recordType === 'imaging' ? <Activity size={24} /> : r.recordType === 'genomics' ? <Dna size={24} /> : <FileText size={24} />}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : activeTab === 'history' ? (
                                    <div className="xl:col-span-12 space-y-12">
                                        <section className="bg-white p-10 border-2 border-[#D9CBC2] rounded-[3rem]">
                                            <h3 className="text-2xl font-black mb-8">Longitudinal Medical History</h3>
                                            <div className="space-y-0 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-1 before:bg-[#D9CBC2]">
                                                {filteredRecords.map((r, i) => (
                                                    <div key={i} className="pl-20 py-8 relative">
                                                        <div className="absolute left-6 top-10 w-5 h-5 rounded-full bg-[#112250] border-4 border-white shadow-md z-10" />
                                                        <div className="p-8 bg-white border-2 border-[#D9CBC2] rounded-[2rem] shadow-sm hover:border-[#E0C58F] transition-colors">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <p className="text-[10px] font-black text-[#112250] opacity-60 uppercase tracking-[0.2em]">{new Date(r.timestamp).toLocaleDateString()}</p>
                                                                <span className="px-3 py-1 bg-[#F5F0E9] rounded-full text-[9px] font-black text-[#112250] border border-[#D9CBC2] uppercase tracking-widest">{r.category || "General"}</span>
                                                            </div>
                                                            <h5 className="text-xl font-bold text-black mb-3">{r.recordType.toUpperCase()} EVENT</h5>
                                                            <p className="text-sm text-black/60 font-medium leading-relaxed">
                                                                {r.recordType === 'imaging' ? `Findings: ${r.moduleData.observations || r.moduleData.prediction}` :
                                                                    r.recordType === 'genomics' ? `Genomic interpretation for ${r.moduleData.variants?.length || 0} variants.` :
                                                                        `AI reasoning session: ${r.moduleData.symptomText?.substring(0, 100)}...`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {filteredRecords.length === 0 && !isLoading && (
                                                    <div className="p-20 text-center text-black/20 font-black uppercase tracking-widest">No historical data found in this category.</div>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                ) : activeTab === 'aichat' ? (
                                    <div className="xl:col-span-12 space-y-10">
                                        <div className="bg-white border-2 border-[#D9CBC2] rounded-[3rem] p-8 min-h-[500px] flex flex-col shadow-xl">
                                            <header className="flex items-center gap-4 border-b border-[#D9CBC2] pb-6 mb-6">
                                                <div className="w-12 h-12 rounded-xl bg-[#112250] flex items-center justify-center text-[#E0C58F]">
                                                    <Bot size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-black">MedGemma Intelligence</h3>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3C507D]">Clinical Reasoning Engine Active</p>
                                                </div>
                                            </header>

                                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 max-h-[400px] mb-6 pr-2">
                                                {chatMessages.map((m) => (
                                                    <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] p-5 rounded-2xl font-medium text-sm shadow-sm ${m.type === 'user'
                                                            ? 'bg-[#112250] text-[#E0C58F] rounded-br-none'
                                                            : 'bg-[#F5F0E9] text-black border border-[#D9CBC2] rounded-bl-none'
                                                            }`}>
                                                            {m.text}
                                                        </div>
                                                    </div>
                                                ))}
                                                {isChatThinking && (
                                                    <div className="flex justify-start">
                                                        <div className="bg-[#F5F0E9] border border-[#D9CBC2] p-4 rounded-2xl flex gap-1">
                                                            <div className="w-1.5 h-1.5 bg-[#112250] rounded-full animate-bounce" />
                                                            <div className="w-1.5 h-1.5 bg-[#112250] rounded-full animate-bounce [animation-delay:0.2s]" />
                                                            <div className="w-1.5 h-1.5 bg-[#112250] rounded-full animate-bounce [animation-delay:0.4s]" />
                                                        </div>
                                                    </div>
                                                )}
                                                <div ref={chatMessagesEndRef} />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex gap-4 items-center">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Condition Folder:</label>
                                                    <select
                                                        value={selectedCategory === 'All' ? 'General' : selectedCategory}
                                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                                        className="bg-[#F5F0E9] border border-[#D9CBC2] rounded-lg px-3 py-1 text-[10px] font-black text-[#112250] outline-none"
                                                    >
                                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                    </select>
                                                </div>
                                                {chatPdf && (
                                                    <div className="flex items-center justify-between p-3 bg-[#E0C58F]/10 border border-[#E0C58F] rounded-xl text-xs font-bold text-black">
                                                        <div className="flex items-center gap-2">
                                                            <FileSearch size={14} />
                                                            <span>{chatPdf.name}</span>
                                                        </div>
                                                        <button onClick={() => setChatPdf(null)} className="text-black/40 hover:text-black"><XIcon size={14} /></button>
                                                    </div>
                                                )}
                                                <div className="flex gap-4">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            value={chatInput}
                                                            onChange={(e) => setChatInput(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleSendGeneralChat()}
                                                            placeholder="Ask a medical question or upload a report..."
                                                            className="w-full bg-[#F5F0E9] border-2 border-[#D9CBC2] rounded-2xl px-6 py-4 outline-none focus:border-[#112250] transition-all font-medium pr-12"
                                                        />
                                                        <button onClick={handleSendGeneralChat} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#112250]">
                                                            <Send size={20} />
                                                        </button>
                                                    </div>
                                                    <input type="file" ref={chatPdfInputRef} className="hidden" onChange={(e) => setChatPdf(e.target.files?.[0] || null)} accept=".pdf" />
                                                    <button
                                                        onClick={() => chatPdfInputRef.current?.click()}
                                                        className="p-4 bg-[#F5F0E9] border-2 border-[#D9CBC2] text-[#112250] rounded-2xl hover:bg-white transition-all shadow-sm"
                                                    >
                                                        <Upload size={24} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="xl:col-span-12 h-96 bg-white border-2 border-[#D9CBC2] rounded-[3rem] flex flex-col items-center justify-center gap-6">
                                        <div className="p-6 bg-[#F5F0E9] rounded-2xl border border-[#D9CBC2]">
                                            <Activity size={48} className="text-[#112250] animate-pulse" />
                                        </div>
                                        <h4 className="text-2xl font-black text-black uppercase tracking-tight">Loading your {activeTab}...</h4>
                                    </div>
                                )



                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Clinical Bridge Modal */}
            <AnimatePresence>
                {showBridgeSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white border-2 border-[#112250] rounded-[3rem] p-12 max-w-lg w-full shadow-2xl space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <RefreshCw className="text-[#112250]" />
                                    <h3 className="text-2xl font-black text-black">Bridge Configuration</h3>
                                </div>
                                <button onClick={() => setShowBridgeSettings(false)} className="p-2 hover:bg-[#F5F0E9] rounded-xl transition-all">
                                    <LogOut className="rotate-180" />
                                </button>
                            </div>

                            <p className="text-sm font-medium text-black/60 leading-relaxed">
                                Enter your public clinical node URL (handshake bridge) to synchronize records across encrypted sectors.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Active Node Path</label>
                                    <input
                                        type="text"
                                        placeholder="https://clinical-node.loca.lt"
                                        className="w-full bg-[#F5F0E9] border-2 border-[#D9CBC2] rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#112250] transition-all"
                                        value={newTunnelUrl || getApiBase()}
                                        onChange={(e) => setNewTunnelUrl(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (newTunnelUrl) setApiBase(newTunnelUrl);
                                        setShowBridgeSettings(false);
                                        fetchPatientData();
                                    }}
                                    className="w-full bg-[#112250] text-[#E0C58F] py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Verify Bridge
                                </button>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('carefusion_tunnel_url');
                                        setShowBridgeSettings(false);
                                        fetchPatientData();
                                    }}
                                    className="w-full text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                                >
                                    Reset to Default Protocol
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Navigation - Unified PWA look */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#112250] border-t border-[#D9CBC2]/20 flex items-center justify-around px-6 z-50 pb-safe">
                <button onClick={() => setActiveTab('overview')} className={`p-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-[#E0C58F] text-black shadow-lg' : 'text-white/40 hover:text-[#E0C58F]'}`}>
                    <Activity size={24} />
                </button>
                <button onClick={() => setActiveTab('history')} className={`p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-[#E0C58F] text-black shadow-lg' : 'text-white/40 hover:text-[#E0C58F]'}`}>
                    <HistoryIcon size={24} />
                </button>
                <button onClick={() => setActiveTab('reports')} className={`p-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-[#E0C58F] text-black shadow-lg' : 'text-white/40 hover:text-[#E0C58F]'}`}>
                    <FileText size={24} />
                </button>
                <button onClick={() => setActiveTab('aichat')} className={`p-3 rounded-xl transition-all ${activeTab === 'aichat' ? 'bg-[#E0C58F] text-black shadow-lg' : 'text-white/40 hover:text-[#E0C58F]'}`}>
                    <MessagesSquare size={24} />
                </button>
                <Link to="/login" className="p-3 rounded-xl text-rose-400">
                    <LogOut size={24} />
                </Link>
            </div>
        </div>
    );
};


// Sub-components
const NavIcon = ({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) => (
    <div className="relative group cursor-pointer" onClick={onClick}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-[#E0C58F] text-black shadow-lg' : 'bg-transparent text-white/70 hover:text-[#E0C58F]'
            }`}>
            {icon}
        </div>
        <span className="absolute left-full ml-6 px-3 py-1.5 bg-[#112250] text-[#E0C58F] text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] shadow-xl border border-[#D9CBC2]/20">{label}</span>
    </div>
);

const HeaderStat = ({ label, val, color }: { label: string, val: string, color?: string }) => (
    <div className="text-left md:text-right flex flex-col items-start md:items-end">
        <div className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-1">{label}</div>
        <div className={`text-2xl font-black ${color || 'text-black'}`}>{val}</div>
    </div>
);

const RecordCard = ({ title, desc, date, status, icon }: { title: string, desc: string, date: string, status: string, icon: React.ReactNode }) => (
    <div className="bg-white border-2 border-[#D9CBC2]/20 p-6 rounded-3xl flex items-center justify-between hover:border-[#E0C58F] transition-all shadow-sm group">
        <div className="flex items-center gap-5 pr-6">
            <div className="p-3 bg-[#F5F0E9] rounded-xl text-black shadow-inner group-hover:bg-[#E0C58F]/20">{icon}</div>
            <div className="min-w-0">
                <h4 className="text-lg font-bold text-black leading-tight mb-1">{title}</h4>
                <p className="text-sm text-black/60 font-medium">{desc}</p>
            </div>
        </div>
        <div className="text-right shrink-0">
            <div className="text-[10px] font-black text-black/30 mb-2 uppercase tracking-widest">{date}</div>
            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-[#E0C58F]/10 text-black border border-[#E0C58F]/20 uppercase tracking-widest">{status}</span>
        </div>
    </div>
);

const ActivityItem = ({ label, time }: { label: string, time: string }) => (
    <div className="flex items-center justify-between border-b border-[#D9CBC2]/20 pb-5 last:border-0 last:pb-0">
        <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-[#3C507D]" />
            <span className="text-sm font-bold text-black">{label}</span>
        </div>
        <span className="text-[10px] font-black text-black/30 uppercase tracking-widest italic">{time}</span>
    </div>
);

const MiniStat = ({ label, val }: { label: string, val: string }) => (
    <div className="bg-[#F5F0E9] border border-[#D9CBC2] p-6 rounded-3xl text-center shadow-sm">
        <div className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-1">{label}</div>
        <div className="text-xl font-black text-black">{val}</div>
    </div>
);

export default PatientDashboard;
