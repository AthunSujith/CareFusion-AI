import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Brain,
    Dna,
    Shield,
    ChevronRight,
    Activity,
    Microscope,
    CheckCircle2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="bg-[#F5F0E9] text-black min-h-screen flex flex-col pt-20 overflow-x-hidden relative">
            <Navbar />

            {/* Hero Section */}
            <main className="flex-1">
                <section className="relative px-6 py-20 lg:py-32">
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-10 text-left">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-[#D9CBC2]/20 border border-[#D9CBC2] text-[14px] font-bold text-black tracking-wide"
                                >
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#3C507D] animate-pulse" />
                                    <span>Version 2.4 Clinical Intelligence</span>
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="hero-text text-black"
                                >
                                    Better Health <br />
                                    <span className="text-black">Through Precision AI.</span>
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-xl md:text-2xl text-black max-w-xl font-medium leading-relaxed"
                                >
                                    The most advanced platform for medical diagnostics. Simple for everyone,
                                    from clinical professionals to patients and families.
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-col sm:flex-row items-center gap-6"
                                >
                                    <Link to="/login" className="w-full sm:w-auto">
                                        <button className="btn-premium bg-[#112250] text-[#E0C58F] w-full px-12 py-5 text-lg group shadow-xl">
                                            Access Workspace
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#E0C58F]" />
                                        </button>
                                    </Link>
                                    <button className="btn-premium bg-white border-2 border-[#D9CBC2] text-black w-full sm:w-auto px-12 py-5 text-lg">
                                        Learn More
                                    </button>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center gap-10 pt-12 border-t border-[#D9CBC2]"
                                >
                                    <div className="text-sm font-bold text-black uppercase tracking-[0.1em]">
                                        Trusted by <span className="text-black">4,200+</span> Medical Networks
                                    </div>
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="relative hidden lg:block"
                            >
                                <div className="glass-card p-4 bg-white shadow-2xl border-[#D9CBC2]">
                                    <div className="rounded-[1.5rem] overflow-hidden bg-[#F5F0E9] aspect-[4/3] relative flex items-center justify-center">
                                        <div className="w-24 h-24 rounded-full bg-[#E0C58F]/20 flex items-center justify-center border border-[#E0C58F]">
                                            <Activity className="text-[#112250] w-12 h-12" />
                                        </div>
                                        {/* Simplified visual cues for accessibility */}
                                        <div className="absolute top-8 left-8 space-y-3">
                                            <div className="w-32 h-3 bg-[#3C507D]/20 rounded-full" />
                                            <div className="w-24 h-3 bg-[#D9CBC2] rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* High Visibility Badges */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-8 -right-8 glass-card p-6 bg-white shadow-lg border-[#E0C58F] flex items-center gap-4"
                                >
                                    <div className="p-3 bg-[#E0C58F]/10 text-emerald-600 rounded-xl"><CheckCircle2 size={24} className="text-[#112250]" /></div>
                                    <div>
                                        <div className="text-sm font-bold text-black">99.8% Accuracy</div>
                                        <div className="text-xs text-black opacity-60">Verified AI Model</div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Features Section - Accessible Colors */}
                <section id="information" className="py-24 bg-white relative border-y border-[#D9CBC2]/30">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center space-y-4 mb-20">
                            <h2 className="section-title text-black">Designed for Everyone</h2>
                            <p className="text-black opacity-60 max-w-2xl mx-auto text-lg font-medium">Simple, clear, and easy to use across all age groups.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <LandingFeature
                                icon={<Brain className="w-8 h-8" />}
                                title="Safe AI Reasoning"
                                desc="Our AI explains its logic in simple terms anyone can understand."
                                color="bg-[#E0C58F]/10 text-black"
                            />
                            <LandingFeature
                                icon={<Microscope className="w-8 h-8" />}
                                title="Clinical Vision"
                                desc="State-of-the-art imaging analysis for doctors and researchers."
                                color="bg-[#E0C58F]/10 text-black"
                            />
                            <LandingFeature
                                icon={<Dna className="w-8 h-8" />}
                                title="Your DNA Data"
                                desc="Private and secure genomic insights at your fingertips."
                                color="bg-[#E0C58F]/10 text-black"
                            />
                            <LandingFeature
                                icon={<Shield className="w-8 h-8" />}
                                title="Secure Ledger"
                                desc="Your records are protected by military-grade encryption."
                                color="bg-[#E0C58F]/10 text-black"
                            />
                        </div>
                    </div>
                </section>
            </main>

            {/* Research Placeholder */}
            <section id="research" className="py-1 bg-white"></section>

            {/* Security Placeholder */}
            <section id="security" className="py-1 bg-white"></section>

            {/* Footer */}
            <footer className="py-20 border-t border-[#D9CBC2] bg-[#F5F0E9]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Activity className="text-[#112250] w-8 h-8" />
                        <span className="text-2xl font-black text-black uppercase tracking-tighter">CARE<span className="text-[#3C507D]">FUSION</span></span>
                    </div>
                    <p className="text-black opacity-60 text-sm font-bold uppercase tracking-widest mb-10 italic">Better Healthcare for Generations</p>
                    <div className="flex justify-center gap-10 text-xs font-bold text-black opacity-40">
                        <a href="#" className="hover:underline transition-colors">Safety</a>
                        <a href="#" className="hover:underline transition-colors">Privacy</a>
                        <a href="#" className="hover:underline transition-colors">Accessibility</a>
                        <a href="#" className="hover:underline transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const LandingFeature = ({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) => (
    <motion.div
        whileHover={{ y: -8 }}
        className="glass-card p-10 bg-white border-[#D9CBC2]/30 hover:border-[#E0C58F] transition-all flex flex-col gap-6 shadow-sm hover:shadow-xl"
    >
        <div className={`p-4 rounded-xl w-fit ${color} shadow-sm border border-[#D9CBC2]/20`}>
            {icon}
        </div>
        <div className="space-y-3">
            <h3 className="text-xl font-black text-black uppercase tracking-tight">{title}</h3>
            <p className="text-black opacity-70 text-base leading-relaxed font-medium">{desc}</p>
        </div>
        <div className="mt-auto pt-6 border-t border-[#D9CBC2]/20 flex items-center justify-between group cursor-pointer">
            <span className="text-sm font-black text-black uppercase tracking-widest group-hover:underline">Learn More</span>
            <ChevronRight className="w-4 h-4 text-black opacity-30 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
        </div>
    </motion.div>
);

export default Landing;
