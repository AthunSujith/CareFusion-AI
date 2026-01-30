import React from 'react';
import { motion } from 'framer-motion';
import { User, Stethoscope, Shield, ArrowRight, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const [role, setRole] = React.useState<'patient' | 'doctor' | null>(null);
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (role === 'patient') navigate('/dashboard/patient');
        if (role === 'doctor') navigate('/dashboard/doctor');
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative p-6 bg-[#F5F0E9] overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#3C507D]/5 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#E0C58F]/5 rounded-full blur-[140px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-xl w-full"
            >
                <div className="text-center mb-10 md:mb-12">
                    <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
                        <div className="p-3 bg-[#112250] rounded-2xl group-hover:bg-[#0A1435] transition-all shadow-lg border border-[#D9CBC2]">
                            <Activity className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                        <span className="text-2xl md:text-3xl font-black font-display tracking-tight text-black uppercase italic">Care<span className="text-black italic">Fusion</span></span>
                    </Link>
                    <h2 className="text-2xl md:text-3xl font-black text-black mb-2 uppercase tracking-tight italic">Secure Node Entry</h2>
                    <p className="text-sm md:text-base text-black opacity-60 font-medium italic">Authenticate clinical identity to access the distributed AI node</p>
                </div>

                <div className="glass-card p-1 md:p-1.5 bg-white border-2 border-[#D9CBC2]">
                    <div className="bg-white/60 backdrop-blur-3xl p-8 md:p-12 rounded-[22px]">
                        <form onSubmit={handleLogin} className="space-y-10">
                            {/* Role Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <RoleButton
                                    active={role === 'patient'}
                                    onClick={() => setRole('patient')}
                                    icon={<User />}
                                    label="Patient Entity"
                                />
                                <RoleButton
                                    active={role === 'doctor'}
                                    onClick={() => setRole('doctor')}
                                    icon={<Stethoscope />}
                                    label="Medical Staff"
                                />
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-1 italic">Identity Key / Verified Email</label>
                                    <input
                                        type="text"
                                        placeholder="USR-XXXXX or verified email"
                                        className="w-full bg-[#F5F0E9] border-2 border-[#D9CBC2] rounded-2xl px-5 py-5 text-black font-medium focus:outline-none focus:ring-1 focus:ring-[#E0C58F]/40 focus:border-[#E0C58F] transition-all placeholder:text-black/30"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-1 italic">Access Passcode</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-[#F5F0E9] border-2 border-[#D9CBC2] rounded-2xl px-5 py-5 text-black font-medium focus:outline-none focus:ring-1 focus:ring-[#E0C58F]/40 focus:border-[#E0C58F] transition-all placeholder:text-black/30"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!role}
                                className="btn-premium bg-[#112250] text-[#E0C58F] w-full py-6 text-lg italic tracking-[0.3em] uppercase disabled:opacity-30 shadow-2xl shadow-[#112250]/30 font-black hover:bg-[#0A1435]"
                            >
                                SYNCHRONIZE SESSION <ArrowRight className="w-5 h-5 ml-2 text-[#E0C58F]" />
                            </button>
                        </form>

                        <div className="mt-10 pt-10 border-t border-[#D9CBC2] flex flex-col gap-6 text-center">
                            <Link to="/" className="text-[10px] font-black text-black opacity-60 hover:text-black transition-colors uppercase tracking-[0.3em] italic underline">Recover Lost Credentials</Link>
                            <div className="bg-[#E0C58F]/10 border border-[#E0C58F]/20 rounded-2xl p-5 flex items-center gap-4 text-left">
                                <Shield className="w-5 h-5 text-[#3C507D] shrink-0" />
                                <p className="text-[11px] text-black font-medium leading-relaxed italic">
                                    Session encryption active. Bio-data is processed locally and synced via end-to-end encrypted medical protocols.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const RoleButton = ({ active, onClick, icon, label }: any) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all duration-300 group ${active
            ? 'bg-[#E0C58F] border-[#112250] text-black shadow-lg'
            : 'bg-white/50 border-[#D9CBC2] text-black opacity-60 hover:border-[#E0C58F] hover:bg-white'
            }`}
    >
        <div className={`p-4 rounded-2xl transition-all duration-300 ${active ? 'bg-[#112250] text-white scale-110 shadow-lg' : 'bg-[#F5F0E9] group-hover:bg-white'}`}>
            {React.cloneElement(icon, { size: 24, className: active ? 'text-white' : 'text-[#112250]' })}
        </div>
        <span className="font-black text-[10px] uppercase tracking-[0.3em] italic text-black">{label}</span>
    </button>
);

export default Login;
