import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Calendar,
    Activity,
    LogOut,
    Bell,
    Settings,
    Fingerprint,
    RefreshCw,
    Dna,
    ArrowRight,
    Timer,
    FileText,
    User,
    Lock as LockIcon,
    History as HistoryIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientDashboard = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [accessCode, setAccessCode] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    const generateCode = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const code = Math.random().toString(36).substring(2, 5).toUpperCase() + '-' +
                Math.random().toString(36).substring(2, 5).toUpperCase() + '-' +
                Math.random().toString(36).substring(2, 5).toUpperCase();
            setAccessCode(code);
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div className="flex h-screen bg-[#F5F0E9] text-black font-main antialiased overflow-hidden">
            {/* Sidebar - Luxury Clinical Theme */}
            <aside className="hidden lg:flex w-24 border-r border-[#D9CBC2] bg-[#112250] flex-col items-center py-10 shrink-0 z-50">
                <button
                    onClick={() => setActiveTab('overview')}
                    className="w-14 h-14 rounded-2xl bg-[#E0C58F] flex items-center justify-center shadow-lg mb-12 hover:scale-105 transition-transform"
                >
                    <Activity className="text-black w-7 h-7" />
                </button>

                <nav className="flex-1 space-y-10">
                    <NavIcon icon={<Activity />} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Home" />
                    <NavIcon icon={<HistoryIcon />} active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="History" />
                    <NavIcon icon={<FileText />} active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="Reports" />
                    <NavIcon icon={<Settings />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Settings" />
                </nav>

                <div className="mt-auto space-y-8">
                    <button className="w-12 h-12 rounded-2xl border border-[#D9CBC2]/20 flex items-center justify-center text-[#E0C58F] hover:bg-[#3C507D]">
                        <Bell size={20} />
                    </button>
                    <Link to="/login" className="w-12 h-12 rounded-2xl border border-[#D9CBC2]/20 text-white hover:bg-rose-900/20 flex items-center justify-center transition-all">
                        <LogOut size={20} />
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-6xl mx-auto p-10 lg:p-16 space-y-12">
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
                                        <section className="bg-white p-10 md:p-12 border-2 border-[#D9CBC2] rounded-[3rem] shadow-lg relative overflow-hidden group">
                                            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                                                <div className="max-w-md space-y-6 text-center lg:text-left">
                                                    <div className="w-16 h-16 rounded-2xl bg-[#F5F0E9] border border-[#D9CBC2] flex items-center justify-center text-black mx-auto lg:mx-0">
                                                        <Fingerprint size={32} />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h2 className="text-3xl font-black text-black">Secure Doctor Sync</h2>
                                                        <p className="text-black/60 text-lg font-medium leading-relaxed">Give your doctor this temporary code to allow them to see your records during your visit.</p>
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
                                                                <div className="bg-[#112250] border-2 border-[#E0C58F] rounded-3xl px-12 py-8 text-4xl font-black text-[#E0C58F] tracking-[0.3em] font-display text-center shadow-2xl">
                                                                    {accessCode}
                                                                </div>
                                                                <button
                                                                    onClick={() => setAccessCode(null)}
                                                                    className="w-full text-sm font-bold text-rose-600 hover:text-rose-700 underline underline-offset-4 text-center uppercase tracking-widest"
                                                                >
                                                                    Stop Sharing Now
                                                                </button>
                                                            </div>
                                                        )}
                                                    </AnimatePresence>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-black opacity-40 uppercase tracking-widest">
                                                        <LockIcon size={14} className="text-[#3C507D]" /> Private and Secure Sync
                                                    </div>
                                                </div>
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
                                                    <RecordCard title="MRI Pulmonary Scan" desc="Lung Imaging Report" date="Feb 12" status="Success" icon={<Activity size={24} />} />
                                                    <RecordCard title="Genomic DNA Mapping" desc="Genomic Sequence Data" date="Feb 10" status="Stored" icon={<Dna size={24} />} />
                                                    <RecordCard title="Daily Health Stats" desc="Smartwatch Sync Data" date="Feb 09" status="Ready" icon={<Timer size={24} />} />
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
                                                <h3 className="text-xs font-black text-black/40 uppercase tracking-[0.2em]">Upcoming</h3>
                                                <Calendar size={20} className="text-[#3C507D]" />
                                            </div>
                                            <div className="bg-[#F5F0E9] border border-[#D9CBC2] rounded-3xl p-6 space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-10 bg-[#112250] rounded-full" />
                                                    <div>
                                                        <div className="text-lg font-bold text-black">Doctor Visit</div>
                                                        <div className="text-sm font-black text-[#3C507D] uppercase tracking-widest">Dr. Sarah Maxwell</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] font-black text-black/60 pt-4 border-t border-[#D9CBC2] uppercase tracking-[0.2em]">
                                                    <span>FEB 14, 2026</span>
                                                    <span className="text-[#3C507D]">09:30 AM</span>
                                                </div>
                                            </div>
                                        </section>
                                    </aside>
                                </>
                            ) : (
                                <div className="xl:col-span-12 h-96 bg-white border-2 border-[#D9CBC2] rounded-[3rem] flex flex-col items-center justify-center gap-6">
                                    <div className="p-6 bg-[#F5F0E9] rounded-2xl border border-[#D9CBC2]">
                                        <Activity size={48} className="text-[#112250] animate-pulse" />
                                    </div>
                                    <h4 className="text-2xl font-black text-black uppercase tracking-tight">Loading your {activeTab}...</h4>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

// Sub-components
const NavIcon = ({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) => (
    <div className="relative group cursor-pointer" onClick={onClick}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-[#E0C58F] text-black shadow-lg' : 'bg-transparent text-[#3C507D] hover:text-[#E0C58F]'
            }`}>
            {icon}
        </div>
        <span className="absolute left-full ml-6 px-3 py-1.5 bg-[#112250] text-[#E0C58F] text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] shadow-xl">{label}</span>
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
