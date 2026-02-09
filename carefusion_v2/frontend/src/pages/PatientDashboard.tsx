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
    Plus,
    Info,
    Brain
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
    const [showSecurityDetails, setShowSecurityDetails] = useState(false);
    const [newTunnelUrl, setNewTunnelUrl] = useState('');
    const [lastUpload, setLastUpload] = useState<any>(null); // For upload feedback

    // AI Chat State
    const [chatMessages, setChatMessages] = useState<any[]>([
        {
            id: '1',
            type: 'bot',
            text: "I’m MedGemma, an AI assistant that helps explain medical information and identify questions to discuss with your doctor.",
            safety: { confidence: 'High', disclaimer: 'This is not a diagnosis.' }
        }
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
            const response = await fetch(`${baseUrl}${API_ENDPOINTS.PATIENTS}/${PATIENT_ID}/categories`, {
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

        // Refusal Logic for Sensitive Topics
        const lowerInput = chatInput.toLowerCase();
        if (lowerInput.includes('cancer') || lowerInput.includes('dying') || lowerInput.includes('kill myself')) {
            const userMsg = { id: Date.now().toString(), type: 'user', text: chatInput };
            const botMsg = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                text: "I can’t determine that. I recommend discussing this with a doctor.",
                safety: { confidence: 'High', disclaimer: 'Topic requires professional consultation.' }
            };
            setChatMessages(prev => [...prev, userMsg, botMsg]);
            setChatInput('');
            return;
        }

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
                                text: statusData.result?.ai_response || "Analysis complete.",
                                safety: { confidence: 'Moderate', disclaimer: 'Not a diagnosis. Consult a physician.' }
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
                    text: data.result?.ai_response || "Analysis complete.",
                    safety: { confidence: 'Moderate', disclaimer: 'Not a diagnosis. Consult a physician.' }
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

                <nav className="flex-1 flex flex-col gap-6 w-full z-10 overflow-y-auto no-scrollbar py-2 items-center">

                    {/* DATA GROUP */}
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mt-2">Data</div>
                        <NavIcon icon={<Activity size={22} />} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" />
                        <NavIcon icon={<HistoryIcon size={22} />} active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="Timeline" />
                        <NavIcon icon={<FileText size={22} />} active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="Vault" />
                    </div>

                    {/* AI GROUP */}
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="h-[1px] w-8 bg-white/10" />
                        <div className="text-[8px] font-black uppercase tracking-[0.3em] text-[#E0C58F]/60">AI</div>
                        <NavIcon icon={<MessagesSquare size={22} />} active={activeTab === 'aichat'} onClick={() => setActiveTab('aichat')} label="iChat" />
                    </div>

                    {/* SECURITY GROUP */}
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="h-[1px] w-8 bg-white/10" />
                        <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Sec</div>
                        <NavIcon icon={<Settings size={22} />} active={showBridgeSettings} onClick={() => setShowBridgeSettings(true)} label="Bridge" />
                    </div>

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
            <main className={`flex-1 overflow-y-auto custom-scrollbar relative pb-24 lg:pb-16 ${isStandalone() ? 'pt-0 pb-36' : ''}`}>
                <MobileAppHeader title="CareFusion Patient" onSettingsClick={() => setShowBridgeSettings(true)} />

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
                            <button
                                onClick={() => setShowSecurityDetails(true)}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-[#D9CBC2]/20 border border-[#D9CBC2] rounded-lg hover:bg-[#D9CBC2]/40 transition-colors cursor-pointer group"
                            >
                                <ShieldCheck className="w-4 h-4 text-[#3C507D] group-hover:text-[#112250] transition-colors" />
                                <span className="text-[12px] font-bold text-black uppercase tracking-wide group-hover:text-[#112250] transition-colors">Environment Secure</span>
                            </button>
                            <div className="space-y-1">
                                <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight">
                                    {activeTab === 'overview' ? 'Patient Portal' : activeTab === 'aichat' ? 'iChat' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                </h1>

                                <p className="text-xl text-black/60 font-bold">Sarah Williams</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-8 items-center md:pb-2">
                            <HeaderStat
                                label="Data Readiness Index"
                                val="92%"
                                tooltip="This score reflects how complete and structured your medical records are. It does NOT indicate your health condition or risk level."
                            />
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
                                                        <p className="text-black/60 text-lg font-medium leading-relaxed">Share selected medical records with a doctor for a limited time.</p>
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
                                                                <div className="pt-6 space-y-4">
                                                                    {/* Access Scope Panel */}
                                                                    <div className="bg-[#112250]/5 p-5 rounded-2xl border border-[#D9CBC2] space-y-3">
                                                                        <div className="flex justify-between items-center text-xs">
                                                                            <span className="font-bold text-[#112250]/60 uppercase tracking-wider">Data Scope</span>
                                                                            <span className="font-black text-[#112250] bg-white px-2 py-1 rounded border border-[#D9CBC2]">Full Record</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-xs">
                                                                            <span className="font-bold text-[#112250]/60 uppercase tracking-wider">Access</span>
                                                                            <span className="font-black text-[#112250]">Read-Only</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-xs">
                                                                            <span className="font-bold text-[#112250]/60 uppercase tracking-wider">Duration</span>
                                                                            <span className="font-black text-[#112250]">24 Hours</span>
                                                                        </div>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => setAccessCode(null)}
                                                                        className="w-full py-4 bg-white border-2 border-rose-100 text-rose-600 rounded-xl font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 transition-colors text-xs flex items-center justify-center gap-2 shadow-sm"
                                                                    >
                                                                        <XIcon size={14} /> Revoke Access
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
                                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                                                <div>
                                                    <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] mb-2">Medical Condition Folders</h3>
                                                    <p className="text-black/60 text-sm font-medium">Upload reports to help AI understand your medical history.</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const name = prompt("Enter new medical condition / folder name:");
                                                        if (name && !categories.includes(name)) {
                                                            setCategories([...categories, name]);
                                                            setSelectedCategory(name);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 text-[10px] font-black text-[#112250] hover:text-[#3C507D] transition-colors uppercase tracking-widest bg-white border border-[#D9CBC2] px-4 py-2 rounded-xl shadow-sm"
                                                >
                                                    <Plus size={14} /> New Condition
                                                </button>
                                            </div>

                                            <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
                                                <button
                                                    onClick={() => setSelectedCategory('All')}
                                                    className={`shrink-0 snap-start min-w-[220px] p-6 rounded-[2rem] border-2 transition-all flex flex-col justify-between h-40 group ${selectedCategory === 'All' ? 'bg-[#112250] text-[#E0C58F] border-[#112250] shadow-xl scale-[1.02]' : 'bg-white text-black border-[#D9CBC2] hover:border-[#112250] hover:shadow-md'}`}
                                                >
                                                    <div className="flex justify-between items-start w-full">
                                                        <div className={`p-3 rounded-2xl ${selectedCategory === 'All' ? 'bg-white/10' : 'bg-[#F5F0E9]'}`}>
                                                            <Activity size={24} />
                                                        </div>
                                                        <span className={`text-2xl font-black ${selectedCategory === 'All' ? 'text-white' : 'text-[#3C507D]'}`}>{records.length}</span>
                                                    </div>
                                                    <div className="text-left space-y-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Master View</span>
                                                        <h4 className="text-xl font-black">All Records</h4>
                                                    </div>
                                                </button>

                                                {categories.map(cat => {
                                                    const catRecords = records.filter(r => r.category === cat);
                                                    const count = catRecords.length;
                                                    const lastUpdate = catRecords.length > 0
                                                        ? new Date(Math.max(...catRecords.map(r => new Date(r.timestamp).getTime()))).toLocaleDateString()
                                                        : "No Data";

                                                    return (
                                                        <button
                                                            key={cat}
                                                            onClick={() => setSelectedCategory(cat)}
                                                            className={`shrink-0 snap-start min-w-[220px] p-6 rounded-[2rem] border-2 transition-all flex flex-col justify-between h-40 group ${selectedCategory === cat ? 'bg-[#112250] text-[#E0C58F] border-[#112250] shadow-xl scale-[1.02]' : 'bg-white text-black border-[#D9CBC2] hover:border-[#112250] hover:shadow-md'}`}
                                                        >
                                                            <div className="flex justify-between items-start w-full">
                                                                <div className={`p-3 rounded-2xl ${selectedCategory === cat ? 'bg-white/10' : 'bg-[#F5F0E9]'}`}>
                                                                    <Folder size={24} />
                                                                </div>
                                                                <span className={`text-2xl font-black ${selectedCategory === cat ? 'text-white' : 'text-[#3C507D]'}`}>{count}</span>
                                                            </div>
                                                            <div className="text-left space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Condition</span>
                                                                    <span className="text-[9px] font-bold opacity-40">{lastUpdate}</span>
                                                                </div>
                                                                <h4 className="text-xl font-black truncate max-w-[160px]" title={cat}>{cat}</h4>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
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

                                            <div className="pt-8 border-t border-[#D9CBC2]/30 space-y-3">
                                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-black/40">
                                                    <span>Last Updated</span>
                                                    <span>Feb 9, 2026</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                    <span className="text-black/40">Data Source</span>
                                                    <span className="text-[#112250] flex items-center gap-1 bg-[#F5F0E9] px-2 py-1 rounded border border-[#D9CBC2]">
                                                        Self-Reported
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                    <span className="text-black/40">Audit Trail</span>
                                                    <span className="text-[#3C507D]">Edited by Patient</span>
                                                </div>
                                                <button className="w-full py-3 mt-2 text-[10px] font-black uppercase tracking-widest text-[#3C507D] hover:bg-[#F5F0E9] rounded-xl transition-colors border border-transparent hover:border-[#D9CBC2]">
                                                    Edit Profile Details
                                                </button>
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
                                activeTab === 'history' ? (
                                    <>
                                        <div className="xl:col-span-8 space-y-12">
                                            <section className="bg-white p-10 border-2 border-[#D9CBC2] rounded-[3rem]">
                                                <h3 className="text-2xl font-black mb-8">Longitudinal Medical History</h3>
                                                <div className="space-y-0 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-1 before:bg-[#D9CBC2]/30">
                                                    {filteredRecords.map((r, i) => (
                                                        <div key={i} className="pl-20 py-8 relative group">
                                                            <div className="absolute left-6 top-10 w-5 h-5 rounded-full bg-[#112250] border-4 border-white shadow-md z-10 group-hover:bg-[#E0C58F] transition-colors" />
                                                            <div className="p-8 bg-white border-2 border-[#D9CBC2] rounded-[2rem] shadow-sm hover:border-[#112250] hover:shadow-lg transition-all">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div className="space-y-1">
                                                                        <div className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">{new Date(r.timestamp).toLocaleDateString()}</div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${r.recordType === 'imaging' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                                                r.recordType === 'genomics' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                                    'bg-amber-50 text-amber-900 border-amber-100'
                                                                                }`}>{r.recordType}</span>

                                                                            <span className="text-[9px] font-bold text-black/30 uppercase tracking-widest flex items-center gap-1 pl-2 border-l border-[#D9CBC2]">
                                                                                Source: {r.recordType === 'document' ? 'Uploaded' : 'AI-Parsed'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="px-3 py-1 bg-[#F5F0E9] rounded-full text-[9px] font-black text-[#112250] border border-[#D9CBC2] uppercase tracking-widest">{r.category || "General"}</span>
                                                                </div>
                                                                <h5 className="text-lg font-black text-[#112250] mb-2 leading-tight">
                                                                    {r.recordType === 'imaging' ? 'Radiological Analysis' : r.recordType === 'genomics' ? 'Genomic Variant Profile' : 'Clinical Consultation Note'}
                                                                </h5>
                                                                <p className="text-sm text-black/60 font-medium leading-relaxed mb-4">
                                                                    {r.recordType === 'imaging' ? `Findings: ${r.moduleData.observations || r.moduleData.prediction}` :
                                                                        r.recordType === 'genomics' ? `Genomic interpretation for ${r.moduleData.variants?.length || 0} variants.` :
                                                                            `AI reasoning session: ${r.moduleData.symptomText?.substring(0, 100)}...`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {filteredRecords.length === 0 && !isLoading && (
                                                        <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
                                                            <div className="w-20 h-20 bg-[#F5F0E9] rounded-full flex items-center justify-center">
                                                                <HistoryIcon size={32} className="text-[#D9CBC2]" />
                                                            </div>
                                                            <div className="max-w-md mx-auto space-y-2">
                                                                <h4 className="text-lg font-black text-black opacity-40 uppercase tracking-widest">Timeline Empty</h4>
                                                                <p className="text-black/40 font-medium">Your medical history timeline will build automatically as records are added.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        </div>

                                        {/* AI Insight Side Panel */}
                                        <aside className="xl:col-span-4 space-y-6 sticky top-6">
                                            <div className="bg-[#112250] text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl min-h-[500px]">
                                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#E0C58F] opacity-10 rounded-full blur-3xl pointer-events-none" />

                                                <div className="relative z-10 space-y-8">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white/10 rounded-xl">
                                                                <Brain size={20} className="text-[#E0C58F]" />
                                                            </div>
                                                            <h3 className="text-xl font-black">AI Insights</h3>
                                                        </div>
                                                        <span className="px-2 py-1 bg-[#E0C58F]/10 border border-[#E0C58F]/20 rounded text-[9px] font-black text-[#E0C58F] uppercase tracking-widest">Beta</span>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 hover:bg-white/10 transition-colors cursor-default group">
                                                            <div className="flex items-start gap-3">
                                                                <Activity size={16} className="text-[#E0C58F] mt-1 group-hover:scale-110 transition-transform" />
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-white">Data Gap Detected</h4>
                                                                    <p className="text-xs text-white/60 font-medium leading-relaxed mt-1">
                                                                        No lipid panel results found in the last 18 months. Consider scheduling a routine check-up.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 hover:bg-white/10 transition-colors cursor-default group">
                                                            <div className="flex items-start gap-3">
                                                                <FileText size={16} className="text-sky-300 mt-1 group-hover:scale-110 transition-transform" />
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-white">Record Consolidation</h4>
                                                                    <p className="text-xs text-white/60 font-medium leading-relaxed mt-1">
                                                                        3 recent entries from "General" folder could be categorized as "Cardiology".
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-white/10">
                                                        <p className="text-[10px] text-white/40 font-medium leading-tight mb-4">
                                                            * These insights are generated by analyzing patterns in your uploaded history. They are not medical diagnoses.
                                                        </p>
                                                        <button className="w-full py-4 bg-[#E0C58F] text-[#112250] rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white transition-colors shadow-lg">
                                                            Generate Full Report
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </aside>
                                    </>
                                ) : activeTab === 'reports' ? (
                                    <div className="xl:col-span-12 space-y-8">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h3 className="text-2xl font-black text-[#112250] mb-2">Document Vault</h3>
                                                <p className="text-sm font-medium text-black/60">Secure, encrypted storage for your clinical records.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="px-5 py-3 bg-[#F5F0E9] border border-[#D9CBC2] rounded-xl text-xs font-black uppercase tracking-widest text-[#112250] hover:bg-white transition-colors flex items-center gap-2">
                                                    <Upload size={14} className="rotate-180" /> Export Vault
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            {/* Left Column: Upload & Feedback */}
                                            <div className="space-y-6">
                                                <FileUpload
                                                    patientId={PATIENT_ID}
                                                    onUploadSuccess={(data) => {
                                                        // Simulate AI Extraction
                                                        setLastUpload({
                                                            name: data.filename || "Uploaded Document",
                                                            type: "Lab Report",
                                                            date: new Date().toLocaleDateString(),
                                                            confidence: 92,
                                                            preview: ["HbA1c: 5.7%", "Glucose: 98 mg/dL", "Cholesterol: 185 mg/dL"]
                                                        });
                                                        fetchPatientData();
                                                    }}
                                                />

                                                {/* Patient Explanation Box */}
                                                <div className="bg-[#F5F0E9]/50 border border-[#D9CBC2] p-5 rounded-2xl flex gap-3">
                                                    <ShieldCheck size={20} className="text-[#112250] shrink-0 mt-0.5" />
                                                    <p className="text-[10px] text-black/60 font-medium leading-relaxed">
                                                        <span className="font-bold text-[#112250] block mb-1">Privacy Guarantee</span>
                                                        Documents are encrypted and analyzed only to help organize and explain your medical information.
                                                        Your data is never shared without your permission.
                                                    </p>
                                                </div>

                                                {/* Post-Upload Feedback Panel */}
                                                <AnimatePresence>
                                                    {lastUpload && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0 }}
                                                            className="bg-white border-2 border-[#112250] p-6 rounded-[2rem] shadow-xl relative overflow-hidden"
                                                        >
                                                            <div className="absolute top-0 right-0 p-16 bg-[#E0C58F] opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="p-2 bg-[#112250] text-[#E0C58F] rounded-xl">
                                                                    <Brain size={16} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-black text-[#112250]">AI Analysis Complete</h4>
                                                                    <p className="text-[10px] font-bold text-[#3C507D] uppercase tracking-widest">Confidence Score: {lastUpload.confidence}%</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3 mb-4">
                                                                <div className="bg-[#F5F0E9] p-3 rounded-xl border border-[#D9CBC2]">
                                                                    <div className="text-[10px] font-black uppercase tracking-widest text-[#112250]/40 mb-1">Detected Type</div>
                                                                    <div className="font-bold text-[#112250] flex justify-between">
                                                                        <span>{lastUpload.type}</span>
                                                                        <span className="opacity-60">{lastUpload.date}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="bg-white border border-[#D9CBC2] p-3 rounded-xl">
                                                                    <div className="text-[10px] font-black uppercase tracking-widest text-[#112250]/40 mb-2">Key Values Extracted</div>
                                                                    <div className="space-y-1">
                                                                        {lastUpload.preview.map((val: string, i: number) => (
                                                                            <div key={i} className="flex items-center gap-2 text-xs font-medium text-[#112250]">
                                                                                <Check size={10} className="text-emerald-500" /> {val}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="bg-[#E0C58F]/20 border border-[#E0C58F] p-3 rounded-xl flex items-start gap-2">
                                                                    <Info size={14} className="text-[#112250] mt-0.5" />
                                                                    <div>
                                                                        <div className="text-[10px] font-black uppercase tracking-widest text-[#112250]/60 mb-0.5">AI Suggestion</div>
                                                                        <p className="text-xs font-bold text-[#112250]">Upload previous lipid panel for longitudinal trend analysis.</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => setLastUpload(null)}
                                                                className="w-full py-3 bg-[#112250] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#1a2e6b] transition-colors shadow-lg"
                                                            >
                                                                Confirm & Save to Vault
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Right Column: Files List */}
                                            <div className="lg:col-span-2 space-y-6">
                                                {/* Search & Filter */}
                                                <div className="flex gap-4">
                                                    <div className="flex-1 relative">
                                                        <FileSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                                                        <input type="text" placeholder="Search documents..." className="w-full pl-10 pr-4 py-4 bg-white border border-[#D9CBC2] rounded-xl text-sm font-bold placeholder:font-medium outline-none focus:border-[#112250] transition-colors shadow-sm" />
                                                    </div>
                                                    <select className="bg-white border border-[#D9CBC2] rounded-xl px-4 py-3 text-sm font-bold text-[#112250] outline-none shadow-sm cursor-pointer hover:border-[#112250] transition-colors">
                                                        <option>All Document Types</option>
                                                        <option>Lab Reports</option>
                                                        <option>Medical Imaging</option>
                                                        <option>Clinical Notes</option>
                                                    </select>
                                                </div>

                                                {/* File Grid/List */}
                                                <div className="grid gap-4">
                                                    {records.filter(r => ['document', 'imaging', 'genomics'].includes(r.recordType)).length > 0 ? (
                                                        records.filter(r => ['document', 'imaging', 'genomics'].includes(r.recordType)).map((r, i) => (
                                                            <div key={i} className="bg-white border border-[#D9CBC2] p-5 rounded-2xl transition-all group flex items-start justify-between cursor-pointer hover:border-[#112250] hover:shadow-md">
                                                                <div className="flex items-start gap-4">
                                                                    <div className={`p-3 rounded-xl text-[#3C507D] group-hover:text-[#E0C58F] transition-colors ${r.recordType === 'imaging' ? 'bg-indigo-50 group-hover:bg-[#112250]' : r.recordType === 'genomics' ? 'bg-emerald-50 group-hover:bg-[#112250]' : 'bg-[#F5F0E9] group-hover:bg-[#112250]'}`}>
                                                                        {r.recordType === 'imaging' ? <Activity size={20} /> : r.recordType === 'genomics' ? <Dna size={20} /> : <FileText size={20} />}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-[#112250] mb-1 text-sm">{r.moduleData?.filename || `${r.recordType.charAt(0).toUpperCase() + r.recordType.slice(1)} Record`}</h4>
                                                                        <div className="flex items-center gap-3 text-[10px] font-bold text-black/40 uppercase tracking-wider">
                                                                            <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                                                                            <span>•</span>
                                                                            <span>{r.category || "General"}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button className="p-2 text-[#3C507D]/40 group-hover:text-[#112250] hover:bg-[#F5F0E9] rounded-lg transition-colors">
                                                                    <ArrowRight size={18} />
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-12 text-center border-2 border-dashed border-[#D9CBC2] rounded-[2rem] flex flex-col items-center justify-center gap-4 group hover:border-[#112250] hover:bg-[#F5F0E9]/30 transition-all cursor-pointer">
                                                            <div className="w-16 h-16 bg-[#F5F0E9] rounded-full flex items-center justify-center text-[#D9CBC2] group-hover:text-[#112250] transition-colors">
                                                                <Folder size={32} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-black/30 font-black uppercase tracking-widest text-sm group-hover:text-[#112250]/60 transition-colors">Vault is empty</h4>
                                                                <p className="text-[10px] text-black/20 font-bold uppercase tracking-widest mt-1">Upload documents to verify secure storage</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
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
                                                            {m.type === 'bot' && m.safety && (
                                                                <div className="mt-4 pt-4 border-t border-[#D9CBC2]/40 flex justify-between items-center">
                                                                    <div className="flex gap-2">
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#112250]/40">Confidence: {m.safety.confidence}</span>
                                                                    </div>
                                                                    <div className="text-[10px] font-medium text-[#112250]/60 italic">
                                                                        {m.safety.disclaimer}
                                                                    </div>
                                                                </div>
                                                            )}
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
                                                {/* Structured Prompt Buttons */}
                                                <div className="flex flex-wrap gap-2 justify-center">
                                                    {["Explain a lab report", "Summarize my history", "Question for doctor"].map((prompt) => (
                                                        <button
                                                            key={prompt}
                                                            onClick={() => setChatInput(prompt)}
                                                            className="px-4 py-2 bg-white/50 border border-[#D9CBC2] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#112250] hover:bg-white hover:border-[#112250] transition-colors"
                                                        >
                                                            {prompt}
                                                        </button>
                                                    ))}
                                                </div>
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
            </main >

            {/* Bridge Configuration Modal */}
            <AnimatePresence>
                {
                    showBridgeSettings && (
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
                                        <RefreshCw className="text-[#112250] animate-spin-slow" />
                                        <h3 className="text-2xl font-black text-black">Bridge Settings</h3>
                                    </div>
                                    <button onClick={() => setShowBridgeSettings(false)} className="p-2 hover:bg-[#F5F0E9] rounded-xl transition-all text-black">
                                        <XIcon size={24} />
                                    </button>
                                </div>

                                <p className="text-sm font-medium text-black/60 leading-relaxed">
                                    Configure the neural handshake pathway between this interface and your Clinical Storage Node.
                                </p>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Clinical Node URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://clinical-node.loca.lt"
                                            className="w-full bg-[#F5F0E9] border-2 border-[#D9CBC2] rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#112250] transition-all text-black"
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
                    )
                }
            </AnimatePresence >

            {/* Security Details Modal */}
            <AnimatePresence>
                {
                    showSecurityDetails && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowSecurityDetails(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white border-2 border-[#112250] rounded-[2rem] max-w-lg w-full shadow-2xl overflow-hidden relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="bg-[#112250] p-8 text-white flex justify-between items-start relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-32 bg-[#E0C58F] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-white/10 rounded-xl">
                                                <ShieldCheck size={24} className="text-[#E0C58F]" />
                                            </div>
                                            <h3 className="text-2xl font-black">Security Status</h3>
                                        </div>
                                        <p className="text-[#D9CBC2] text-sm font-medium">Real-time environment verification </p>
                                    </div>
                                    <button onClick={() => setShowSecurityDetails(false)} className="relative z-10 p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white">
                                        <XIcon size={24} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-[#F5F0E9] rounded-2xl border border-[#D9CBC2]">
                                            <div className="flex items-center gap-3">
                                                <LockIcon size={20} className="text-[#112250]" />
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-widest opacity-60">Encryption</div>
                                                    <div className="text-sm font-bold text-[#112250]">AES-256 (At Rest) / TLS 1.3</div>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-[#112250] text-[#E0C58F] text-[10px] font-black uppercase tracking-widest rounded-full">Active</div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#D9CBC2]/50">
                                            <div className="flex items-center gap-3">
                                                <Activity size={20} className="text-[#3C507D]" />
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-widest opacity-60">Last Verified Access</div>
                                                    <div className="text-sm font-bold text-black">Today, 10:42 AM (Biometric)</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#D9CBC2]/50">
                                            <div className="flex items-center gap-3">
                                                <Fingerprint size={20} className="text-[#3C507D]" />
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-widest opacity-60">Active Sessions</div>
                                                    <div className="text-sm font-bold text-black">1 (Current Device Only)</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[#D9CBC2]/20">
                                        <button
                                            onClick={() => { setShowSecurityDetails(false); setActiveTab('history'); }}
                                            className="w-full py-4 text-xs font-black uppercase tracking-widest text-[#112250] hover:bg-[#F5F0E9] rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            View Full Audit Logs <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Persistent Medical Disclaimer */}
            < div className="fixed bottom-20 lg:bottom-0 left-0 right-0 bg-[#F5F0E9]/95 backdrop-blur-sm border-t border-[#D9CBC2] py-3 px-6 z-40 text-center lg:pl-32 transition-all" >
                <p className="text-[10px] md:text-xs font-medium text-black/60 leading-tight max-w-4xl mx-auto">
                    <span className="font-bold text-[#112250] uppercase tracking-wider mr-1">Medical Disclaimer:</span>
                    CareFusion AI provides informational and decision-support insights only.
                    It does not provide medical diagnosis or treatment. Always consult a licensed healthcare professional.
                </p>
            </div >

            {/* Mobile Bottom Navigation - Unified PWA look */}
            < div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#112250] border-t border-[#D9CBC2]/20 flex items-center justify-around px-6 z-50 pb-safe" >
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
            </div >
        </div >
    );
};


// Sub-components
const NavIcon = ({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) => (
    <div className="relative group cursor-pointer" onClick={onClick}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-[#E0C58F] text-black shadow-lg scale-110 ring-2 ring-[#E0C58F]/30' : 'bg-white/5 text-white/40 hover:text-[#E0C58F] hover:bg-white/10'
            }`}>
            {icon}
        </div>
        <span className={`absolute left-full ml-6 px-4 py-2.5 bg-[#112250] text-[#E0C58F] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl whitespace-nowrap z-[100] shadow-2xl border border-[#E0C58F]/20 transition-all duration-300 pointer-events-none ${active ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
            {label}
        </span>
    </div>
);

const HeaderStat = ({ label, val, color, tooltip }: { label: string, val: string, color?: string, tooltip?: string }) => (
    <div className="text-left md:text-right flex flex-col items-start md:items-end group relative">
        <div className="flex items-center gap-1.5 mb-1 justify-end">
            <div className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">{label}</div>
            {tooltip && <Info size={12} className="text-black/40 cursor-help" />}
        </div>
        <div className={`text-2xl font-black ${color || 'text-black'}`}>{val}</div>

        {tooltip && (
            <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-[#112250] text-white text-xs font-medium rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-left border border-[#E0C58F]/30 leading-relaxed">
                <div className="flex gap-2">
                    <Info size={14} className="text-[#E0C58F] shrink-0 mt-0.5" />
                    <span>{tooltip}</span>
                </div>
            </div>
        )}
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
