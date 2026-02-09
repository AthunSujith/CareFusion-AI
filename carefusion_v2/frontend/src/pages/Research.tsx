import React from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Brain,
    Database,
    FileText,
    GitBranch,
    Microscope,
    Target
} from 'lucide-react';
import Navbar from '../components/Navbar';

const Research = () => {
    return (
        <div className="bg-[#F5F0E9] text-black min-h-screen flex flex-col pt-20">
            <Navbar />

            <main className="flex-1">
                {/* Header */}
                <section className="py-20 px-6">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-bold border border-blue-200"
                        >
                            Pre-Clinical Research Phase
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black text-[#112250] tracking-tight"
                        >
                            Validation & Research
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-black opacity-70 max-w-2xl mx-auto"
                        >
                            Transparent documentation of our model architectures, evaluation metrics, and dataset methodology.
                        </motion.p>
                    </div>
                </section>

                {/* Model Architecture */}
                <section className="py-20 bg-white border-y border-[#D9CBC2]/30">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="p-3 bg-[#112250] rounded-xl text-white">
                                <GitBranch size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-[#112250]">Model Architecture</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <ArchitectureCard
                                icon={<Activity />}
                                title="Clinical NLP"
                                model="Transformer (BERT-based)"
                                desc="Fine-tuned on PubMed and clinical notes for entity extraction and symptom correlation."
                            />
                            <ArchitectureCard
                                icon={<Microscope />}
                                title="Medical Imaging"
                                model="EfficientNet / ResNet"
                                desc="Convolutional Neural Networks trained for anomaly detection in X-ray and MRI modalities."
                            />
                            <ArchitectureCard
                                icon={<Brain />}
                                title="Genomic Analysis"
                                model="GNN / Transformer"
                                desc="Graph Neural Networks for variant effect prediction and phenotype mapping."
                            />
                        </div>
                    </div>
                </section>

                {/* Performance Metrics */}
                <section className="py-20 bg-[#F5F0E9]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="p-3 bg-[#112250] rounded-xl text-white">
                                <Target size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-[#112250]">Performance Metrics</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricCard label="Diagnostic AUC" value="0.94" sub="Internal Validation Set" />
                            <MetricCard label="Sensitivity" value="92%" sub="Standard Operating Point" />
                            <MetricCard label="Specificity" value="89%" sub="To Minimize False Alarms" />
                            <MetricCard label="F1-Score" value="0.91" sub="Balanced Precision/Recall" />
                        </div>
                        <p className="mt-8 text-sm text-black opacity-50 italic">
                            * Results based on retrospective analysis of de-identified test sets. Real-world prospective performance may vary.
                        </p>
                    </div>
                </section>

                {/* Datasets & Methodology */}
                <section className="py-20 bg-white border-t border-[#D9CBC2]/30">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#112250] rounded-xl text-white">
                                        <Database size={24} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-[#112250]">Datasets</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                        <h3 className="font-bold text-[#112250] mb-2">Training Data Source</h3>
                                        <p className="text-slate-600">
                                            Models are trained on de-identified, open-access research datasets including MIMIC-III, CheXpert, and 1000 Genomes Project.
                                            No proprietary patient data is used for base model training.
                                        </p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                        <h3 className="font-bold text-[#112250] mb-2">Preprocessing</h3>
                                        <p className="text-slate-600">
                                            Strict de-identification pipelines remove PHI. Standardization of DICOM and FHIR formats ensures consistency across modalities.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#112250] rounded-xl text-white">
                                        <FileText size={24} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-[#112250]">Current Status</h2>
                                </div>
                                <div className="relative border-l-2 border-[#D9CBC2] pl-8 py-2 space-y-12">
                                    <div className="relative">
                                        <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                                        <h3 className="font-bold text-[#112250]">In Silico Validation</h3>
                                        <p className="text-sm text-slate-500 mt-1">Completed Q4 2023</p>
                                        <p className="mt-2 text-slate-700">Initial model architecture validation and retrospective testing.</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
                                        <h3 className="font-bold text-[#112250]">Limited Pilot</h3>
                                        <p className="text-sm text-slate-500 mt-1">Current Phase</p>
                                        <p className="mt-2 text-slate-700">Controlled deployment in research environments for usability testing.</p>
                                    </div>
                                    <div className="relative opacity-50">
                                        <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-slate-300 border-4 border-white shadow-sm" />
                                        <h3 className="font-bold text-[#112250]">Clinical Trials</h3>
                                        <p className="text-sm text-slate-500 mt-1">Future Milestone</p>
                                        <p className="mt-2 text-slate-700">Prospective multi-center studies for FDA clearance.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

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

const ArchitectureCard = ({ icon, title, model, desc }: { icon: React.ReactNode, title: string, model: string, desc: string }) => (
    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-[#112250] flex items-center justify-center mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-[#112250] mb-2">{title}</h3>
        <div className="text-sm text-[#3C507D] font-bold mb-4 uppercase tracking-wider">{model}</div>
        <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
    </div>
);

const MetricCard = ({ label, value, sub }: { label: string, value: string, sub: string }) => (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="text-4xl font-black text-[#112250] mb-2">{value}</div>
        <div className="text-sm font-bold text-black uppercase tracking-wider mb-4">{label}</div>
        <div className="text-xs text-slate-400 font-medium">{sub}</div>
    </div>
);

export default Research;
