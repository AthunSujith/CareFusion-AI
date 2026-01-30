import { useState, useEffect } from 'react';
import { Activity, Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-4' : 'py-8'}`}>
            <div className="max-w-7xl mx-auto px-6">
                <div className={`glass-card border-slate-200 flex items-center justify-between px-8 py-4 bg-white/95 transition-all shadow-md ${scrolled ? 'rounded-[1.5rem]' : 'rounded-[2rem]'}`}>
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-[#112250] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-[#D9CBC2]">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-black uppercase italic">
                            Care<span className="text-black">Fusion</span>
                        </span>
                    </Link>

                    {/* Desktop Menu - High Contrast */}
                    <div className="hidden md:flex items-center gap-10">
                        <div className="flex items-center gap-8 text-black">
                            <a href="/#information" className="text-sm font-black text-black uppercase tracking-widest hover:opacity-100 transition-all relative group">
                                Information
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#E0C58F] transition-all group-hover:w-full" />
                            </a>
                            <a href="/#research" className="text-sm font-black text-black uppercase tracking-widest hover:opacity-100 transition-all relative group">
                                Research
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#E0C58F] transition-all group-hover:w-full" />
                            </a>
                            <a href="/#security" className="text-sm font-black text-black uppercase tracking-widest hover:opacity-100 transition-all relative group">
                                Security
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#E0C58F] transition-all group-hover:w-full" />
                            </a>
                        </div>
                        <div className="h-6 w-px bg-[#D9CBC2]" />
                        <div className="flex items-center gap-6">
                            <Link to="/login" className="text-sm font-bold text-black opacity-60 hover:opacity-100 transition-opacity">Sign In</Link>
                            <Link to="/login">
                                <button className="btn-premium btn-primary px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3">
                                    Open Lab
                                    <ArrowRight size={16} />
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="md:hidden text-black p-2" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu - High Visibility */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="md:hidden absolute top-28 left-6 right-6 glass-card bg-white border-[#D9CBC2] p-8 flex flex-col gap-6 shadow-2xl"
                    >
                        <a href="/#information" onClick={() => setIsOpen(false)} className="text-2xl font-black text-black uppercase tracking-tight">Information</a>
                        <a href="/#research" onClick={() => setIsOpen(false)} className="text-2xl font-black text-black uppercase tracking-tight">Research</a>
                        <a href="/#security" onClick={() => setIsOpen(false)} className="text-2xl font-black text-black uppercase tracking-tight">Security</a>
                        <hr className="border-[#D9CBC2]/20" />
                        <Link to="/login" className="btn-premium btn-secondary justify-center py-4 text-black font-black uppercase tracking-widest text-sm italic">Sign In</Link>
                        <Link to="/login" className="btn-premium btn-primary justify-center py-4 font-black uppercase tracking-widest text-sm">Open Lab</Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
