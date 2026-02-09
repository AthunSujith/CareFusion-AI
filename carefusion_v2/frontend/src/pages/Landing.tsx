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
    CheckCircle2,
    Lock,
    FileText,
    Database
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

const Landing = () => {
    const [selectedFeature, setSelectedFeature] = React.useState<{ title: string; content: React.ReactNode } | null>(null);


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
                                    Clinical-Decision Support <br />
                                    <span className="text-[#3C507D]">Powered by Explainable AI</span>
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-xl md:text-2xl text-black max-w-xl font-medium leading-relaxed"
                                >
                                    Built to assist clinicians, researchers, and patients — without replacing medical judgment.
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
                                    <Link to="/signup" className="w-full sm:w-auto">
                                        <button className="btn-premium bg-white border-2 border-[#D9CBC2] text-black w-full sm:w-auto px-12 py-5 text-lg shadow-md hover:bg-slate-50">
                                            Create Account
                                        </button>
                                    </Link>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center gap-10 pt-12 border-t border-[#D9CBC2]"
                                >
                                    <div className="text-sm font-bold text-black uppercase tracking-[0.1em] flex flex-wrap gap-4 md:gap-8">
                                        <span>Built for HIPAA Compliance</span>
                                        <span className="hidden md:inline">•</span>
                                        <span>SOC 2 Type II Ready</span>
                                    </div>
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="relative hidden lg:block"
                            >
                                {/* Workflow Preview Card */}
                                <div className="glass-card p-6 bg-white shadow-2xl border-[#D9CBC2] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#112250] to-[#E0C58F]" />

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-[#3C507D]" />
                                                <span className="font-bold text-sm text-[#112250]">Live Analysis Pipeline</span>
                                            </div>
                                            <span className="text-xs font-mono text-gray-400">ID: #CF-24-X92</span>
                                        </div>

                                        {/* Workflow Steps */}
                                        <div className="space-y-4">
                                            {[
                                                { label: "Clinical Data Input", icon: Activity, status: "complete" },
                                                { label: "Multi-Model Analysis", icon: Brain, status: "complete" },
                                                { label: "Evidence Extraction", icon: Microscope, status: "active" },
                                                { label: "Physician Review", icon: CheckCircle2, status: "pending" },
                                            ].map((step, i) => (
                                                <div key={i} className="flex items-center gap-4 group">
                                                    <div className={`
                                                        w-8 h-8 rounded-full flex items-center justify-center border
                                                        ${step.status === 'complete' ? 'bg-[#112250] border-[#112250] text-[#E0C58F]' :
                                                            step.status === 'active' ? 'bg-white border-[#E0C58F] text-[#112250] animate-pulse' :
                                                                'bg-gray-50 border-gray-200 text-gray-300'}
                                                    `}>
                                                        {step.status === 'complete' ? <CheckCircle2 size={14} /> : <step.icon size={14} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={`text-sm font-bold ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-800'}`}>
                                                            {step.label}
                                                        </div>
                                                        {step.status === 'active' && (
                                                            <div className="h-1 w-24 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                                <div className="h-full bg-[#E0C58F] w-2/3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Explanation Panel Mockup */}
                                        <div className="bg-[#F5F0E9] p-4 rounded-xl border border-[#D9CBC2]/50 mt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-[#3C507D] uppercase tracking-wider">Reasoning Engine</span>
                                                <span className="text-xs font-bold bg-[#112250] text-[#E0C58F] px-2 py-0.5 rounded">High Confidence</span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                                "Symptom constellation correlates with <span className="bg-[#E0C58F]/20 text-black px-1 rounded">Pattern A</span>.
                                                Genetic markers suggest elevated operational response. Recommending standard verify protocol."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Features Section - Accessible Colors */}
                <section id="platform" className="py-24 bg-white relative border-y border-[#D9CBC2]/30">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center space-y-4 mb-20">
                            <h2 className="section-title text-black">Engineered for Clinical Velocity</h2>
                            <p className="text-black opacity-60 max-w-2xl mx-auto text-lg font-medium">Precision interfaces designed to reduce cognitive load and accelerate decision-making.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <LandingFeature
                                icon={<Brain className="w-8 h-8" />}
                                title="Explainable Clinical AI"
                                desc="Every output includes a confidence score, reasoning summary, and uncertainty flags — designed for clinician review."
                                color="bg-[#E0C58F]/10 text-black"
                                onViewExample={() => setSelectedFeature({
                                    title: "Explainable Clinical AI",
                                    content: (
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-slate-700">Prediction: Atrial Fibrillation</span>
                                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">98.2% Confidence</span>
                                                </div>
                                                <p className="text-sm text-slate-600">Reasoning: Detected irregular R-R intervals consistent with AFib patterns in V1-V6 leads. No P-waves present.</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            />
                            <LandingFeature
                                icon={<Microscope className="w-8 h-8" />}
                                title="Radiological Image Analysis"
                                desc="Automated detection of anomalies in X-rays, MRIs, and CT scans with precise heatmap localization."
                                color="bg-[#E0C58F]/10 text-black"
                                onViewExample={() => setSelectedFeature({
                                    title: "Radiological Image Analysis",
                                    content: (
                                        <div className="space-y-4">
                                            <div className="aspect-video bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center">
                                                <div className="text-slate-500 text-sm">X-Ray / MRI View</div>
                                                <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-red-500/30 rounded-full blur-md border border-red-500/50" />
                                                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded text-white text-xs">
                                                    Nodule detected (0.85 prob)
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            />
                            <LandingFeature
                                icon={<Dna className="w-8 h-8" />}
                                title="Genomic Risk Profiling"
                                desc="Integrated analysis of genetic markers to identify potential hereditary risks and drug sensitivities."
                                color="bg-[#E0C58F]/10 text-black"
                                onViewExample={() => setSelectedFeature({
                                    title: "Genomic Risk Profiling",
                                    content: (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center bg-red-50 p-3 rounded border border-red-100">
                                                <span className="text-sm font-semibold text-red-900">BRCA1 Variant</span>
                                                <span className="text-xs font-bold text-red-700 bg-red-200 px-2 py-0.5 rounded">High Risk</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-blue-50 p-3 rounded border border-blue-100">
                                                <span className="text-sm font-semibold text-blue-900">CYP2C19 Metabolizer</span>
                                                <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-0.5 rounded">Poor</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            />
                            <LandingFeature
                                icon={<Shield className="w-8 h-8" />}
                                title="Immutable Audit Trails"
                                desc="All clinical decisions and data access events are cryptographically logged for forensic accountability."
                                color="bg-[#E0C58F]/10 text-black"
                                onViewExample={() => setSelectedFeature({
                                    title: "Immutable Audit Trails",
                                    content: (
                                        <div className="font-mono text-xs space-y-2 text-slate-600">
                                            <div className="border-l-2 border-emerald-500 pl-3">
                                                <div className="text-slate-400">2024-02-14 09:30:21 UTC</div>
                                                <div>User: Dr. Smith (ID: 8821)</div>
                                                <div>Action: Reviewed Patient #9921</div>
                                                <div className="text-emerald-600 text-[10px] break-all">Hash: 0x8a7d...992c</div>
                                            </div>
                                            <div className="border-l-2 border-slate-300 pl-3 opacity-60">
                                                <div className="text-slate-400">2024-02-14 09:28:15 UTC</div>
                                                <div>System: Analysis Completed</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            />
                        </div>
                    </div>
                </section>

                {/* How It Works Section - Process Flow */}
                <section id="how-it-works" className="py-24 bg-[#F5F0E9] relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center space-y-4 mb-20">
                            <h2 className="section-title text-black">How CareFusion Works</h2>
                            <p className="text-black opacity-60 max-w-2xl mx-auto text-lg font-medium">Transparent, verifiable, and clinician-led.</p>
                        </div>

                        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-[#D9CBC2]/50 -z-0" />

                            {[
                                {
                                    step: "01",
                                    title: "Data Input",
                                    items: ["Symptoms (text/voice)", "Medical Images", "Genomic Files"],
                                    icon: Activity
                                },
                                {
                                    step: "02",
                                    title: "Model Analysis",
                                    items: ["Multi-model AI Pipeline", "Specialized Models"],
                                    icon: Brain
                                },
                                {
                                    step: "03",
                                    title: "Explainability Layer",
                                    items: ["Reasoning Summary", "Confidence Scores", "Risk Flags"],
                                    icon: CheckCircle2
                                },
                                {
                                    step: "04",
                                    title: "Human Review",
                                    items: ["Clinician Validation", "No Autonomous Decisions"],
                                    icon: Shield
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="relative z-10"
                                >
                                    <div className="bg-white p-8 rounded-[2rem] border border-[#D9CBC2] h-full shadow-lg hover:-translate-y-2 transition-transform duration-300">
                                        <div className="w-12 h-12 bg-[#112250] text-[#E0C58F] rounded-full flex items-center justify-center font-bold text-lg mb-6 shadow-md mx-auto md:mx-0">
                                            {item.step}
                                        </div>
                                        <h3 className="text-xl font-black text-[#112250] mb-4 text-center md:text-left">{item.title}</h3>
                                        <ul className="space-y-3">
                                            {item.items.map((subItem, j) => (
                                                <li key={j} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#E0C58F]" />
                                                    {subItem}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>



                {/* Safety & Limitations Section - Rare Trust Builder */}
                <section id="limitations" className="py-24 bg-slate-50 border-t border-[#D9CBC2]/50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-16">
                            <div className="max-w-2xl">
                                <h2 className="section-title text-black mb-4">Safety & Limitations</h2>
                                <p className="text-black opacity-70 text-lg font-medium leading-relaxed">
                                    We believe that knowing a system's limits is as important as knowing its capabilities.
                                    CareFusion AI is designed with strict boundaries.
                                </p>
                            </div>
                            <div className="hidden md:block">
                                <div className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-bold border border-amber-200 flex items-center gap-2">
                                    <Shield size={16} />
                                    Transparency Report v2.4
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
                                <div className="mt-1"><Activity className="text-amber-500 w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold text-[#112250] text-lg mb-2">Known Failure Cases</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Performance degrades with low-resolution imaging (&lt; 150 DPI) or highly ambiguous symptom descriptions.
                                        The system flags these inputs rather than guessing.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
                                <div className="mt-1"><Brain className="text-amber-500 w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold text-[#112250] text-lg mb-2">Data Bias Acknowledgment</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        While trained on diverse datasets, historical biases in medical data may exist.
                                        We are actively calibrating for underrepresented demographic signatures.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
                                <div className="mt-1"><Shield className="text-amber-500 w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold text-[#112250] text-lg mb-2">AI Refusal Scenarios</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        The model will explicitly refuse to answer non-clinical queries or provide definitive diagnoses.
                                        It is hard-coded to defer to human judgment.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
                                <div className="mt-1"><CheckCircle2 className="text-amber-500 w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold text-[#112250] text-lg mb-2">Human Override Required</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        No action can be taken within the system without explicit clinician approval.
                                        Automation is limited to data processing, not decision making.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Feature Modal */}
            {
                selectedFeature && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedFeature(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-[#112250]">{selectedFeature.title}</h3>
                                <button onClick={() => setSelectedFeature(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <ChevronRight className="w-6 h-6 rotate-90" />
                                </button>
                            </div>
                            <div className="p-6">
                                {selectedFeature.content}
                            </div>
                            <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                                <button onClick={() => setSelectedFeature(null)} className="text-sm font-bold text-[#112250] hover:underline">
                                    Close Preview
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* Security & Data Ownership Section */}
            <section id="trust" className="py-24 bg-[#112250] text-[#F5F0E9] relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center space-y-6 mb-20">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">Security & Data Ownership</h2>
                        <p className="text-[#D9CBC2] opacity-80 max-w-2xl mx-auto text-lg font-medium">
                            Enterprise-grade protection designed for HIPAA compliance and hospital integration.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Encryption */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <Shield className="w-10 h-10 text-[#E0C58F] mb-6" />
                            <h3 className="text-xl font-bold text-white mb-3">End-to-End Encryption</h3>
                            <p className="text-[#D9CBC2] text-sm leading-relaxed">
                                All patient data is encrypted using AES-256 at rest and TLS 1.3 in transit. Keys are managed via HSMs.
                            </p>
                        </div>

                        {/* Access Control */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <Lock className="w-10 h-10 text-[#E0C58F] mb-6" />
                            <h3 className="text-xl font-bold text-white mb-3">Strict Access Control</h3>
                            <p className="text-[#D9CBC2] text-sm leading-relaxed">
                                Enforced Role-Based Access Control (RBAC) and mandatory Multi-Factor Authentication (MFA) for all clinical accounts.
                            </p>
                        </div>

                        {/* Audit Logs */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <FileText className="w-10 h-10 text-[#E0C58F] mb-6" />
                            <h3 className="text-xl font-bold text-white mb-3">Immutable Audit Logs</h3>
                            <p className="text-[#D9CBC2] text-sm leading-relaxed">
                                Every view, edit, and export is recorded in a tamper-proof forensic ledger for compliance auditing.
                            </p>
                        </div>

                        {/* Data Ownership */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors col-span-1 md:col-span-2 lg:col-span-1">
                            <Database className="w-10 h-10 text-[#E0C58F] mb-6" />
                            <h3 className="text-xl font-bold text-white mb-3">You Own Your Data</h3>
                            <p className="text-[#D9CBC2] text-sm leading-relaxed">
                                We act as data processors. You retain full sovereignty. Export or delete your data at any time.
                            </p>
                        </div>

                        {/* No Training */}
                        <div className="p-8 rounded-2xl border border-[#E0C58F]/30 bg-[#E0C58F]/10 col-span-1 md:col-span-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 bg-[#E0C58F] text-[#112250] text-xs font-black uppercase tracking-wider rounded-bl-xl">
                                Privacy Guarantee
                            </div>
                            <div className="flex items-start gap-6 relative z-10">
                                <Brain className="w-12 h-12 text-[#E0C58F] shrink-0" />
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-3">No Training on Private Data</h3>
                                    <p className="text-[#D9CBC2] leading-relaxed">
                                        Your patient data is <span className="text-white font-bold underline decoration-[#E0C58F]">never</span> used to train our base models.
                                        We use federated learning or synthetic datasets for all model improvements.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-[#D9CBC2] bg-[#F5F0E9]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <div className="flex items-center gap-3">
                                <Activity className="text-[#112250] w-8 h-8" />
                                <span className="text-2xl font-black text-black uppercase tracking-tighter">CARE<span className="text-[#3C507D]">FUSION</span></span>
                            </div>
                            <p className="text-black opacity-70 text-sm leading-relaxed max-w-sm">
                                Advanced clinical intelligence for the next generation of healthcare.
                                Secure, explainable, and precise.
                            </p>
                            <div className="space-y-4">
                                <div className="text-xs font-bold text-black uppercase tracking-widest opacity-40">Contact</div>
                                <a href="mailto:support@carefusion.ai" className="text-lg font-bold text-[#112250] hover:underline block">support@carefusion.ai</a>
                                <div className="text-sm text-black opacity-60">+1 (888) 555-0123</div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="text-xs font-bold text-black uppercase tracking-widest opacity-40">Platform</div>
                            <div className="flex flex-col gap-4 text-sm font-bold text-[#112250]">
                                <a href="#platform" className="hover:text-[#3C507D] transition-colors">Capabilities</a>
                                <a href="#how-it-works" className="hover:text-[#3C507D] transition-colors">Methodology</a>
                                <a href="#validation" className="hover:text-[#3C507D] transition-colors">Clinical Validation</a>
                                <a href="#trust" className="hover:text-[#3C507D] transition-colors">Security Architecture</a>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="text-xs font-bold text-black uppercase tracking-widest opacity-40">Legal & Ethics</div>
                            <div className="flex flex-col gap-4 text-sm font-bold text-[#112250]">
                                <a href="#" className="hover:text-[#3C507D] transition-colors">Terms of Service</a>
                                <a href="#" className="hover:text-[#3C507D] transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-[#3C507D] transition-colors">Data Usage Policy</a>
                                <a href="#" className="hover:text-[#3C507D] transition-colors">AI Limitations Statement</a>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-[#D9CBC2]/50 flex flex-col md:flex-row items-start justify-between gap-6 text-xs text-black opacity-50">
                        <div className="max-w-2xl space-y-4">
                            <p className="font-bold">MEDICAL DISCLAIMER</p>
                            <p className="leading-relaxed">
                                CareFusion AI is a research and clinical decision-support platform. It does not provide medical diagnosis or treatment.
                                All outputs should be verified by a qualified healthcare professional. The system is designed to assist, not replace, clinical judgment.
                            </p>
                        </div>
                        <div className="text-right">
                            <p>&copy; 2024 CareFusion AI. All rights reserved.</p>
                            <p>v2.4.0-RC1 (Stable)</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div >
    );
};

const LandingFeature = ({ icon, title, desc, color, onViewExample }: { icon: React.ReactNode, title: string, desc: string, color: string, onViewExample: () => void }) => (
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
        <div
            onClick={onViewExample}
            className="mt-auto pt-6 border-t border-[#D9CBC2]/20 flex items-center justify-between group cursor-pointer"
        >
            <span className="text-sm font-black text-black uppercase tracking-widest group-hover:underline">View example</span>
            <ChevronRight className="w-4 h-4 text-black opacity-30 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
        </div>
    </motion.div>
);

export default Landing;
