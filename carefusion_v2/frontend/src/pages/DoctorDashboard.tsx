import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    User,
    LogOut,
    Bell,
    AudioLines,
    Image as ImageIcon,
    Dna,
    Timer,
    Zap,
    Fingerprint,
    RefreshCw,
    Mic,
    Upload,
    X,
    Database,
    Lock,
    Clock,
    Send,
    History as HistoryIcon,
    FileText,
    Brain,
    ShieldAlert,
    CheckCircle2,
    Save,
    Video,
    FolderArchive,
    Search,
    Filter,
    FileSearch,
    ChevronRight,
    Download,
    Terminal,
    MessagesSquare,
    Bot,
    TrendingUp,
    TrendingDown,
    Info,
    Folder,
    FileDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import { getApiBase, API_ENDPOINTS, setApiBase } from '../utils/apiConfig';
import MobileAppHeader from '../components/MobileAppHeader';
import { isStandalone } from '../utils/pwa';



interface Patient {
    id: string;
    name: string;
    lastAccessed: string;
    status: 'Stable' | 'Critical' | 'Monitoring';
    avatar: string;
}

interface Message {
    id: string;
    type: 'bot' | 'user';
    text: string;
    richData?: any;
}

const CURRENT_USER_ID = 'dr-sarah-chen';
const CURRENT_PATIENT_ID = 'SW-928';


const DoctorDashboard = () => {
    const [view, setView] = useState<'overview' | 'linkage' | 'workspace' | 'history' | 'dossier' | 'aichat'>('overview');
    const [activeModule, setActiveModule] = useState('symptoms');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [showBridgeSettings, setShowBridgeSettings] = useState(false);
    const [newTunnelUrl, setNewTunnelUrl] = useState('');


    // Handshake/Sync
    const [syncCode, setSyncCode] = useState('');
    const [isEstablishing, setIsEstablishing] = useState(false);

    // Chat Logic (Module 1)
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', type: 'bot', text: "Hello Doctor. I am ready to analyze patient symptoms. You can type, record audio, or upload clinical notes below." }
    ]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Module 2 Logic (Imaging)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Module 3 Logic (Genomics)
    const [vcfFile, setVcfFile] = useState<File | null>(null);
    const [isDnaProcessing, setIsDnaProcessing] = useState(false);
    const [dnaResult, setDnaResult] = useState<any>(null);
    const vcfInputRef = useRef<HTMLInputElement>(null);

    // Patients History
    const [patients] = useState<Patient[]>([
        { id: '1', name: 'Sarah Williams', lastAccessed: '14m ago', status: 'Monitoring', avatar: 'SW' },
        { id: '2', name: 'Marcus Chen', lastAccessed: '2h ago', status: 'Stable', avatar: 'MC' },
        { id: '3', name: 'Elena Rodriguez', lastAccessed: 'Yesterday', status: 'Critical', avatar: 'ER' },
    ]);

    // AI Chat (MedGemma 1.5 4B) logic
    const [chatMessages, setChatMessages] = useState<Message[]>([
        { id: '1', type: 'bot', text: "Hello Doctor. I am MedGemma 1.5 (4B), your specialized medical AI. You can chat with me or upload medical PDFs for deep clinical analysis and summarization." }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatThinking, setIsChatThinking] = useState(false);
    const [chatPdf, setChatPdf] = useState<File | null>(null);
    const chatPdfInputRef = useRef<HTMLInputElement>(null);

    // Module 4 Logic (Temporal)
    const [temporalResult, setTemporalResult] = useState<any>(null);
    const [isTemporalProcessing, setIsTemporalProcessing] = useState(false);
    const [temporalObservation, setTemporalObservation] = useState('Patient reports worsening fatigue and persistent nocturnal cough over the last 3 weeks.');

    const handleConnect = async () => {
        if (syncCode.length === 11) {
            setIsEstablishing(true);
            try {
                const baseUrl = getApiBase();
                const response = await fetch(`${baseUrl}/api/v2/patients/handshake/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: syncCode })
                });

                if (response.ok) {
                    const data = await response.json();
                    setSelectedPatient(data.patient);
                    setIsEstablishing(false);
                    // Reset sync code for next time
                    setSyncCode('');
                    setView('workspace');
                } else {
                    const error = await response.json();
                    alert(error.detail || "Invalid Sync Code");
                    setIsEstablishing(false);
                }
            } catch (error) {
                console.error("Connection error:", error);
                alert("Clinical Node Handshake Failed. Check your connection.");
                setIsEstablishing(false);
            }
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), type: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsThinking(true);

        try {
            const url = `${getApiBase()}${API_ENDPOINTS.AI}/module1/analyze`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                },
                body: JSON.stringify({ userId: CURRENT_PATIENT_ID, textInput: inputText })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Reasoning engine response failed' }));
                throw new Error(errorData.detail || `Server error ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'accepted' && data.analysisId) {
                // Poll for result
                let completed = false;
                const analysisId = data.analysisId;

                console.log(`📡 Analysis accepted. ID: ${analysisId}. Starting polling...`);

                while (!completed) {
                    await new Promise(r => setTimeout(r, 5000)); // Poll every 5s
                    const statusUrl = `${getApiBase()}${API_ENDPOINTS.AI}/status/${analysisId}`;
                    console.log(`⏱️ Polling analysis status for ${analysisId}...`);

                    const statusRes = await fetch(statusUrl, {
                        headers: { 'Authorization': 'Bearer clinical-access-token-2026', 'bypass-tunnel-reminder': 'true' }
                    });

                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        console.log(`📊 Status: ${statusData.status}`);

                        if (statusData.status === 'completed') {
                            completed = true;
                            const botMsg: Message = {
                                id: (Date.now() + 1).toString(),
                                type: 'bot',
                                text: statusData.result?.ai_response && statusData.result.ai_response !== "" ? statusData.result.ai_response : "Neural reasoning complete. Structured analysis below.",
                                richData: statusData.result
                            };
                            setMessages(prev => [...prev, botMsg]);
                        } else if (statusData.status === 'failed') {
                            completed = true;
                            throw new Error(statusData.error || "Analysis failed on engine.");
                        }
                    }
                }
            } else {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    text: data.result?.ai_response && data.result.ai_response !== "" ? data.result.ai_response : "Neural reasoning complete. Structured analysis below.",
                    richData: data.result
                };
                setMessages(prev => [...prev, botMsg]);
            }
        } catch (error: any) {
            console.error("Failed to fetch AI response", error);
            alert(`❌ AI Inference Error: ${error.message || 'Connection to the Reasoning Node failed.'}`);
        } finally {
            setIsThinking(false);
        }
    };

    const handleVoiceToggle = async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                audioChunksRef.current = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                recorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    await sendAudioToBackend(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };

                recorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Microphone access denied", err);
                alert("Microphone access denied. Please check your browser permissions.");
            }
        } else {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        }
    };

    const sendAudioToBackend = async (blob: Blob) => {
        setIsThinking(true);
        const userMsg: Message = { id: Date.now().toString(), type: 'user', text: "🎤 [Clinical Audio Note Captured]" };
        setMessages(prev => [...prev, userMsg]);

        const formData = new FormData();
        formData.append('userId', CURRENT_PATIENT_ID);
        formData.append('audio_file', blob, 'clinic_note.webm');

        try {
            const url = `${getApiBase()}${API_ENDPOINTS.AI}/module1/analyze`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Audio engine response failed' }));
                throw new Error(errorData.detail || `Server error ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'accepted' && data.analysisId) {
                // Poll for result
                let completed = false;
                const analysisId = data.analysisId;

                console.log(`🎤 Audio Analysis accepted. ID: ${analysisId}. Starting polling...`);

                while (!completed) {
                    await new Promise(r => setTimeout(r, 5000));
                    const statusUrl = `${getApiBase()}${API_ENDPOINTS.AI}/status/${analysisId}`;
                    console.log(`⏱️ Polling audio status for ${analysisId}...`);

                    const statusRes = await fetch(statusUrl, {
                        headers: { 'Authorization': 'Bearer clinical-access-token-2026', 'bypass-tunnel-reminder': 'true' }
                    });

                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        console.log(`📊 Status: ${statusData.status}`);

                        if (statusData.status === 'completed') {
                            completed = true;
                            const botMsg: Message = {
                                id: (Date.now() + 1).toString(),
                                type: 'bot',
                                text: statusData.result?.ai_response && statusData.result.ai_response !== "" ? statusData.result.ai_response : "Neural reasoning complete. Structured analysis below.",
                                richData: statusData.result
                            };
                            setMessages(prev => [...prev, botMsg]);
                        } else if (statusData.status === 'failed') {
                            completed = true;
                            throw new Error(statusData.error || "Vocal analysis failed.");
                        }
                    }
                }
            } else {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    text: data.result?.ai_response && data.result.ai_response !== "" ? data.result.ai_response : "Neural reasoning complete. Structured analysis below.",
                    richData: data.result
                };
                setMessages(prev => [...prev, botMsg]);
            }
        } catch (error: any) {
            console.error("Vocal analysis failure:", error);
            alert(`❌ Audio Analysis Linkage Error: ${error.message || 'Could not reach the Clinical Audio Engine.'}`);
        } finally {
            setIsThinking(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('userId', CURRENT_PATIENT_ID);
        formData.append('medical_image', file);

        try {
            // Pre-flight check: Ensure the tunnel is actually reachable and not showing a reminder
            const baseUrl = getApiBase();
            const healthUrl = `${baseUrl}/api/health`;

            try {
                const healthRes = await fetch(healthUrl, { headers: { 'bypass-tunnel-reminder': 'true' } });
                if (!healthRes.ok) throw new Error(`Handshake status ${healthRes.status}`);
            } catch (e) {
                console.warn("Handshake warning", e);
                // We proceed anyway, but this helps debug
            }

            const url = `${baseUrl}${API_ENDPOINTS.AI}/module2/scan`;
            console.log('📡 Initiating Radiology Scan:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true',
                    'Accept': 'application/json'
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Network handshake failed' }));
                throw new Error(errorData.detail || `Server error ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'accepted' && data.analysisId) {
                let completed = false;
                const analysisId = data.analysisId;
                console.log(`🖼️ Imaging job accepted: ${analysisId}`);

                while (!completed) {
                    await new Promise(r => setTimeout(r, 5000));
                    const statusUrl = `${getApiBase()}${API_ENDPOINTS.AI}/status/${analysisId}`;
                    const statusRes = await fetch(statusUrl, {
                        headers: { 'Authorization': 'Bearer clinical-access-token-2026', 'bypass-tunnel-reminder': 'true' }
                    });

                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        if (statusData.status === 'completed') {
                            completed = true;
                            setAnalysisResult(statusData.result);
                        } else if (statusData.status === 'failed') {
                            completed = true;
                            throw new Error(statusData.error || "Imaging analysis failed.");
                        }
                    }
                }
            } else {
                setAnalysisResult(data);
            }
        } catch (error: any) {
            console.error("Radiology Upload Error:", error);
            const isNetworkError = error.name === 'TypeError' || error.message.includes('fetch');
            alert(`❌ Imaging Scan Error: ${isNetworkError ? 'Network Connectivity Issue. Ensure the Clinical Bridge is open and verified in another tab.' : error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDnaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setVcfFile(file);
        setIsDnaProcessing(false);
        setDnaResult(null);
    };

    const triggerDnaAnalysis = async () => {
        if (!vcfFile) return;
        setIsDnaProcessing(true);

        const formData = new FormData();
        formData.append('userId', CURRENT_PATIENT_ID);
        formData.append('vcf_file', vcfFile);

        try {
            const baseUrl = getApiBase();
            const url = `${baseUrl}${API_ENDPOINTS.AI}/module3/dna`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Genomic node unavailable' }));
                throw new Error(errorData.detail || `Server error ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'accepted' && data.analysisId) {
                let completed = false;
                const analysisId = data.analysisId;
                console.log(`🧬 DNA job accepted: ${analysisId}`);

                while (!completed) {
                    await new Promise(r => setTimeout(r, 5000));
                    const statusUrl = `${getApiBase()}${API_ENDPOINTS.AI}/status/${analysisId}`;
                    const statusRes = await fetch(statusUrl, {
                        headers: { 'Authorization': 'Bearer clinical-access-token-2026', 'bypass-tunnel-reminder': 'true' }
                    });

                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        if (statusData.status === 'completed') {
                            completed = true;
                            setDnaResult(statusData.result);
                        } else if (statusData.status === 'failed') {
                            completed = true;
                            throw new Error(statusData.error || "DNA analysis failed.");
                        }
                    }
                }
            } else {
                setDnaResult(data);
            }
        } catch (error: any) {
            console.error("DNA Analysis failed", error);
            alert(`❌ Genomic Sequencing Error: ${error.message || 'Data node handshake failed.'}`);
        } finally {
            setIsDnaProcessing(false);
        }
    };

    const handleSaveImagingRecord = async (observations: string) => {
        try {
            const baseUrl = getApiBase();
            const response = await fetch(`${baseUrl}${API_ENDPOINTS.AI}/records/imaging/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                },
                body: JSON.stringify({
                    userId: CURRENT_USER_ID,
                    patientId: CURRENT_PATIENT_ID,
                    imagePath: selectedFile?.name,
                    prediction: analysisResult?.prediction,
                    confidence: analysisResult?.probability,
                    observations,
                    analysisId: analysisResult?.analysis_id
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert('✅ Imaging record saved successfully!');
            } else {
                alert(`❌ Failed to save record: ${data.message || 'Unknown Server Error'}`);
            }
        } catch (error: any) {
            console.error('Save error:', error);
            alert(`❌ Connection Error: ${error.message || 'Failed to reach clinical node.'}`);
        }
    };

    const handleSaveSymptomRecord = async (symptomText: string, aiResponse: any) => {
        try {
            const baseUrl = getApiBase();
            const response = await fetch(`${baseUrl}${API_ENDPOINTS.AI}/records/symptom/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                },
                body: JSON.stringify({
                    userId: CURRENT_USER_ID,
                    patientId: CURRENT_PATIENT_ID,
                    symptomText,
                    aiResponse
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert('✅ Symptom analysis saved to patient record!');
            } else {
                alert(`❌ Failed to save record: ${data.message || 'Unknown Server Error'}`);
            }
        } catch (error: any) {
            console.error('Save error:', error);
            alert(`❌ Connection Error: ${error.message || 'Failed to reach clinical node.'}`);
        }
    };

    const handleSaveGenomicsRecord = async (interpretation: string, variants: string[], summary: string) => {
        try {
            const baseUrl = getApiBase();
            const response = await fetch(`${baseUrl}${API_ENDPOINTS.AI}/records/genomics/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                },
                body: JSON.stringify({
                    userId: CURRENT_USER_ID,
                    patientId: CURRENT_PATIENT_ID,
                    fileName: vcfFile?.name,
                    variants,
                    summary,
                    interpretation
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert('✅ Genomics record saved successfully!');
            } else {
                alert(`❌ Failed to save record: ${data.message || 'Unknown Server Error'}`);
            }
        } catch (error: any) {
            console.error('Save error:', error);
            alert(`❌ Connection Error: ${error.message || 'Failed to reach clinical node.'}`);
        }
    };

    const handleSendGeneralChat = async () => {
        if (!chatInput.trim() && !chatPdf) return;

        const userMsg: Message = { id: Date.now().toString(), type: 'user', text: chatInput || (chatPdf ? `📄 [Analyzing Document: ${chatPdf.name}]` : "") };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsChatThinking(true);

        const formData = new FormData();
        formData.append('prompt', chatInput || "Analyze this medical document.");
        if (chatPdf) {
            formData.append('pdf_doc', chatPdf);
        }

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

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'MedGemma Node timed out' }));
                throw new Error(errorData.detail || `Server error ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'accepted' && data.analysisId) {
                let completed = false;
                const analysisId = data.analysisId;
                console.log(`🤖 AI Chat job accepted: ${analysisId}`);

                while (!completed) {
                    await new Promise(r => setTimeout(r, 5000));
                    const statusUrl = `${getApiBase()}${API_ENDPOINTS.AI}/status/${analysisId}`;
                    console.log(`⏱️ Polling chat status for ${analysisId}...`);

                    const statusRes = await fetch(statusUrl, {
                        headers: { 'Authorization': 'Bearer clinical-access-token-2026', 'bypass-tunnel-reminder': 'true' }
                    });

                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        console.log(`📊 Chat Status: ${statusData.status}`);
                        if (statusData.status === 'completed') {
                            completed = true;
                            const botMsg: Message = {
                                id: (Date.now() + 1).toString(),
                                type: 'bot',
                                text: statusData.result?.ai_response || statusData.result?.result?.ai_response || "AI reasoning complete. Deep clinical patterns identified."
                            };
                            setChatMessages(prev => [...prev, botMsg]);
                        } else if (statusData.status === 'failed') {
                            completed = true;
                            throw new Error(statusData.error || "MedGemma reasoning failed.");
                        }
                    }
                }
            } else {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    text: data.result?.ai_response || data.result?.result?.ai_response || "AI reasoning complete. Deep clinical patterns identified."
                };
                setChatMessages(prev => [...prev, botMsg]);
            }
            setChatPdf(null);
        } catch (error: any) {
            console.error("General AI Chat failed", error);
            alert(`❌ AI Chat Error: ${error.message || 'MedGemma Node handshake failure.'}`);
        } finally {
            setIsChatThinking(false);
        }
    };

    const triggerTemporalAnalysis = async () => {
        setIsTemporalProcessing(true);
        const formData = new FormData();
        formData.append('userId', CURRENT_PATIENT_ID);
        formData.append('observation', temporalObservation);

        try {
            const baseUrl = getApiBase();
            const url = `${baseUrl}${API_ENDPOINTS.AI}/module4/temporal`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Temporal node unavailable' }));
                throw new Error(errorData.detail || `Server error ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'accepted' && data.analysisId) {
                let completed = false;
                const analysisId = data.analysisId;
                console.log(`⏳ Temporal job accepted: ${analysisId}`);

                while (!completed) {
                    await new Promise(r => setTimeout(r, 5000));
                    const statusUrl = `${getApiBase()}${API_ENDPOINTS.AI}/status/${analysisId}`;
                    const statusRes = await fetch(statusUrl, {
                        headers: { 'Authorization': 'Bearer clinical-access-token-2026', 'bypass-tunnel-reminder': 'true' }
                    });

                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        if (statusData.status === 'completed') {
                            completed = true;
                            setTemporalResult(statusData.result);
                        } else if (statusData.status === 'failed') {
                            completed = true;
                            throw new Error(statusData.error || "Temporal analysis failed.");
                        }
                    }
                }
            } else {
                setTemporalResult(data);
            }
        } catch (error: any) {
            console.error("Temporal Analysis failed", error);
            alert(`❌ Temporal Node Error: ${error.message || 'Failed to sync clinical history.'}`);
        } finally {
            setIsTemporalProcessing(false);
        }
    };


    return (
        <div className="flex h-screen bg-[#F5F0E9] text-black font-main antialiased overflow-hidden">
            {/* Sidebar - Use Royal Blue */}
            <aside className="hidden lg:flex w-24 border-r border-[#D9CBC2] bg-[#112250] flex-col items-center py-12 shrink-0 z-50">
                <button
                    onClick={() => setView('overview')}
                    className="w-14 h-14 rounded-2xl bg-[#E0C58F] flex items-center justify-center shadow-lg mb-12 hover:scale-105 transition-all border border-[#D9CBC2]"
                >
                    <Activity className="text-black w-7 h-7" />
                </button>

                <nav className="flex-1 space-y-10">
                    <SidebarIcon icon={<User />} active={view === 'overview'} onClick={() => setView('overview')} label="Overview" />
                    <SidebarIcon icon={<Database />} active={view === 'linkage'} onClick={() => setView('linkage')} label="Access" />
                    <SidebarIcon icon={<HistoryIcon />} active={view === 'history'} onClick={() => setView('history')} label="History" />
                    <SidebarIcon icon={<MessagesSquare />} active={view === 'aichat'} onClick={() => setView('aichat')} label="AI Chat" />
                    <SidebarIcon icon={<FileText />} active={false} onClick={() => { }} label="Settings" />
                </nav>

                <div className="mt-auto space-y-10">
                    <button className="w-12 h-12 rounded-2xl border border-[#3C507D]/30 flex items-center justify-center text-[#E0C58F] hover:bg-[#3C507D] transition-all">
                        <Bell size={24} />
                    </button>
                    <Link to="/login" className="w-12 h-12 rounded-2xl border border-[#D9CBC2]/20 text-white hover:bg-[#3C507D] flex items-center justify-center transition-all bg-transparent">
                        <LogOut size={24} />
                    </Link>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#112250] border-t border-[#D9CBC2]/20 flex items-center justify-around px-6 z-50">
                <button onClick={() => setView('overview')} className={`p-3 rounded-xl transition-all ${view === 'overview' ? 'bg-[#E0C58F] text-black shadow-lg' : 'text-white/40 hover:text-[#E0C58F]'}`}>
                    <User size={24} />
                </button>
                <button onClick={() => setView('linkage')} className={`p-3 rounded-xl transition-all ${view === 'linkage' ? 'bg-[#E0C58F] text-black shadow-lg' : 'text-white/40 hover:text-[#E0C58F]'}`}>
                    <Database size={24} />
                </button>
                <button onClick={() => setView('history')} className={`p-3 rounded-xl transition-all ${view === 'history' ? 'bg-[#E0C58F] text-black shadow-lg' : 'text-white/40 hover:text-[#E0C58F]'}`}>
                    <HistoryIcon size={24} />
                </button>
                <button onClick={() => setView('linkage')} className="p-3 rounded-xl text-white/40 hover:text-[#E0C58F]">
                    <Bell size={24} />
                </button>
                <Link to="/login" className="p-3 rounded-xl text-rose-400">
                    <LogOut size={24} />
                </Link>
            </div>

            {/* Main Content Area */}
            <main className={`flex-1 overflow-y-auto custom-scrollbar relative ${isStandalone() ? 'pt-0 pb-24' : ''}`}>
                <MobileAppHeader title="CareFusion MD" />

                {/* Global Luxury Background Texture */}
                <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply z-0">
                    <img
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000"
                        alt="bg"
                        className="w-full h-full object-cover"
                    />
                </div>

                <AnimatePresence mode="wait">
                    {view === 'overview' && (
                        <motion.section
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-10 lg:p-16 space-y-16 relative z-10"
                        >
                            <header className="space-y-6">
                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#D9CBC2]/20 border border-[#D9CBC2] rounded-xl">
                                    <Zap size={16} className="text-[#3C507D]" />
                                    <span className="text-[12px] font-bold text-black uppercase tracking-wide">Physician Terminal Activated</span>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-2">
                                        <h1 className="text-4xl md:text-6xl font-black text-black tracking-tight">
                                            Medical <span className="text-[#3C507D]">Intelligence.</span>
                                        </h1>
                                        <p className="text-2xl text-black font-bold opacity-60">Authenticated: Dr. Sarah Chen</p>
                                    </div>
                                    <button
                                        onClick={() => setShowBridgeSettings(true)}
                                        className="flex items-center gap-4 px-6 py-4 bg-white border-2 border-[#D9CBC2] rounded-2xl hover:border-[#112250] transition-all group shadow-sm"
                                    >
                                        <RefreshCw size={20} className="text-[#112250] group-hover:rotate-180 transition-transform duration-500" />
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Clinical Bridge</p>
                                            <p className="text-xs font-bold text-black">{getApiBase().includes('localhost') ? 'LOCAL_NODE' : 'HANDSHAKE_ACTIVE'}</p>
                                        </div>
                                    </button>
                                </div>

                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <StatCard label="Active Syncs" val="08" icon={<Activity size={24} />} />
                                <StatCard label="Peer Nodes" val="144" icon={<Database size={24} />} />
                                <StatCard label="System Load" val="12%" icon={<Zap size={24} />} />
                                <StatCard label="Security" val="High" icon={<Lock size={24} />} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                <div className="lg:col-span-8 space-y-10">
                                    <h2 className="text-2xl font-black text-black uppercase tracking-tight">Recent Patient Links</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {patients.map(p => (
                                            <div key={p.id} className="glass-card group p-8 bg-white border-2 border-[#D9CBC2]/30 hover:border-[#E0C58F] transition-all cursor-pointer shadow-sm">
                                                <div className="flex items-center gap-5 mb-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-[#F5F0E9] border border-[#D9CBC2] flex items-center justify-center font-black text-black text-lg shadow-inner">{p.avatar}</div>
                                                    <div>
                                                        <h4 className="text-xl font-bold text-black">{p.name}</h4>
                                                        <p className="text-sm font-bold text-black opacity-60 uppercase tracking-widest mt-1">{p.lastAccessed}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest ${p.status === 'Critical' ? 'bg-[#E0C58F] text-black border border-[#D9CBC2]' : 'bg-[#D9CBC2] text-black border border-[#D9CBC2]'}`}>{p.status}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPatient(p);
                                                            setView('dossier');
                                                        }}
                                                        className="text-black font-bold text-sm hover:underline"
                                                    >
                                                        Open File →
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="lg:col-span-4">
                                    <div className="glass-card p-10 bg-[#E0C58F] text-black border-none shadow-xl h-full flex flex-col justify-between">
                                        <div className="space-y-8">
                                            <Fingerprint size={56} className="text-black mb-8" />
                                            <h3 className="text-3xl font-black leading-tight text-black">Sync New <br /> Patient Lab</h3>
                                            <p className="text-black font-medium leading-relaxed opacity-60">Enter the patient's 9-digit handshake code to begin high-fidelity clinical reasoning.</p>
                                        </div>
                                        <button onClick={() => setView('linkage')} className="btn-premium bg-[#112250] text-[#E0C58F] w-full mt-10 py-5 shadow-lg group font-black uppercase tracking-widest">Start Sync Portal</button>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {
                        view === 'linkage' && (
                            <motion.section
                                key="linkage"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                className="flex-1 flex flex-col items-center justify-center p-10 lg:p-20"
                            >
                                <div className="glass-card max-w-2xl w-full p-12 lg:p-16 bg-white border-2 border-[#D9CBC2] shadow-2xl text-center space-y-12">
                                    <div className="w-20 h-20 rounded-2xl bg-[#F5F0E9] border border-[#D9CBC2] flex items-center justify-center text-[#112250] mx-auto shadow-inner">
                                        <Fingerprint size={40} />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-3xl font-black text-black uppercase tracking-tight">Access Patient Lab</h2>
                                        <p className="text-black font-bold uppercase tracking-widest text-xs opacity-60">Enter Verification Handshake Code</p>
                                    </div>
                                    <div className="space-y-10">
                                        <input
                                            type="text"
                                            placeholder="XXX - XXX - XXX"
                                            value={syncCode}
                                            onChange={(e) => setSyncCode(e.target.value.toUpperCase())}
                                            className="w-full bg-[#F5F0E9] border-2 border-[#D9CBC2] rounded-3xl px-8 py-6 text-3xl font-black tracking-[0.2em] text-black text-center focus:border-[#E0C58F] focus:bg-white outline-none transition-all shadow-inner uppercase"
                                            maxLength={11}
                                        />
                                        <button
                                            onClick={handleConnect}
                                            disabled={syncCode.length !== 11 || isEstablishing}
                                            className="btn-premium bg-[#112250] text-[#E0C58F] w-full py-6 text-xl shadow-xl font-black uppercase tracking-widest shadow-[#112250]/30"
                                        >
                                            {isEstablishing ? <RefreshCw className="animate-spin text-[#E0C58F]" /> : "Verify and Establish Bridge"}
                                        </button>
                                    </div>
                                    <div onClick={() => setView('overview')} className="text-black font-bold text-sm cursor-pointer hover:underline opacity-60">Cancel and Return</div>
                                </div>
                            </motion.section>
                        )
                    }

                    {
                        view === 'workspace' && (
                            <motion.section
                                key="workspace"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full flex overflow-hidden bg-[#F5F0E9]"
                            >
                                {/* Secondary Sidebar */}
                                <div className="w-80 border-r border-[#D9CBC2] bg-white p-10 overflow-y-auto shrink-0 flex flex-col gap-10">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-[#3C507D] uppercase tracking-widest">Active Patient</h3>
                                        <div className="flex items-center gap-5 p-5 glass-card bg-[#F5F0E9]/50 border-[#D9CBC2] shadow-sm">
                                            <div className="w-12 h-12 rounded-xl bg-[#E0C58F] flex items-center justify-center text-black font-bold text-lg">SW</div>
                                            <div>
                                                <h4 className="text-base font-bold text-black">Sarah Williams</h4>
                                                <p className="text-[10px] font-bold text-black uppercase tracking-widest mt-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#112250] animate-pulse" /> LIVE STREAM</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col gap-8">
                                        <h3 className="text-xs font-bold text-[#3C507D] uppercase tracking-widest">Analysis Lab</h3>
                                        <div className="flex flex-col gap-4">
                                            <ModuleCard label="Symptom AI" icon={<AudioLines />} active={activeModule === 'symptoms'} onClick={() => setActiveModule('symptoms')} />
                                            <ModuleCard label="Imaging Analysis" icon={<ImageIcon />} active={activeModule === 'imaging'} onClick={() => setActiveModule('imaging')} />
                                            <ModuleCard label="DNA Sequence" icon={<Dna />} active={activeModule === 'genomics'} onClick={() => setActiveModule('genomics')} />
                                            <ModuleCard label="Health Drift" icon={<Clock />} active={activeModule === 'temporal'} onClick={() => setActiveModule('temporal')} />
                                        </div>
                                    </div>

                                    <button onClick={() => setView('overview')} className="btn-premium bg-transparent border-2 border-[#D9CBC2] text-[#112250] w-full py-4 flex items-center gap-2 justify-center font-bold hover:bg-[#D9CBC2]/20">
                                        <X size={18} /> Exit Lab
                                    </button>
                                </div>

                                {/* Node Workspace area */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="max-w-6xl mx-auto p-12 min-h-full flex flex-col">
                                        <AnimatePresence mode="wait">
                                            {activeModule === 'symptoms' ? (
                                                <motion.div key="chat-node" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-8">
                                                    <div className="flex-1 glass-card bg-white border-2 border-[#3C507D] rounded-[3rem] p-8 space-y-8 min-h-[35rem] flex flex-col shadow-2xl">
                                                        <div className="flex-1 border-b border-[#D9CBC2] py-6 overflow-y-auto custom-scrollbar space-y-8">
                                                            {messages.map((m, idx) => (
                                                                <div key={m.id} className="space-y-4">
                                                                    <ChatMessage type={m.type} text={m.text} />
                                                                    {m.richData && (
                                                                        <SymptomResult
                                                                            data={m.richData}
                                                                            onSave={() => {
                                                                                // Find the previous user message for symptom text
                                                                                const prevText = messages[idx - 1]?.text || 'User input';
                                                                                handleSaveSymptomRecord(prevText, m.richData);
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {isThinking && (
                                                                <div className="flex justify-start">
                                                                    <div className="bg-[#F5F0E9] border-2 border-[#D9CBC2] p-4 rounded-2xl flex gap-1">
                                                                        <div className="w-2 h-2 bg-[#E0C58F] rounded-full animate-bounce" />
                                                                        <div className="w-2 h-2 bg-[#E0C58F] rounded-full animate-bounce [animation-delay:0.2s]" />
                                                                        <div className="w-2 h-2 bg-[#E0C58F] rounded-full animate-bounce [animation-delay:0.4s]" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 pt-6">
                                                            <div className="flex-1 relative">
                                                                <input
                                                                    type="text"
                                                                    value={inputText}
                                                                    onChange={(e) => setInputText(e.target.value)}
                                                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                                    placeholder="Type symptom manifest..."
                                                                    className="w-full bg-[#F5F0E9] border-2 border-[#D9CBC2] rounded-2xl px-6 py-4 text-[#112250] outline-none focus:border-[#E0C58F] transition-all font-medium"
                                                                />
                                                                <button onClick={handleSendMessage} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3C507D] hover:scale-110 transition-transform">
                                                                    <Send size={20} />
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={handleVoiceToggle}
                                                                className={`p-4 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all ${isRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#E0C58F] text-black border border-[#D9CBC2]'}`}
                                                                title={isRecording ? "Stop Recording" : "Start Voice Analysis"}
                                                            >
                                                                <Mic size={24} className={isRecording ? "text-white" : "text-black"} />
                                                            </button>
                                                            <button className="p-4 rounded-2xl bg-[#D9CBC2] text-[#112250] border border-[#3C507D]/20 hover:bg-white transition-all">
                                                                <Upload size={24} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : activeModule === 'imaging' ? (
                                                <motion.div key="image-node" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                                                    <div className="glass-card w-full bg-[#112250] border-[#3C507D] p-10 flex flex-col gap-8 shadow-2xl relative overflow-hidden text-[#F5F0E9]">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="space-y-1">
                                                                <h2 className="text-2xl font-bold text-[#E0C58F]">Medical Image Analysis</h2>
                                                                <p className="text-[#D9CBC2] text-xs font-medium uppercase tracking-widest">AI-powered image diagnosis with heatmap visualization</p>
                                                            </div>
                                                            {selectedFile && !isUploading && (
                                                                <button
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-[#E0C58F]/10 text-[#E0C58F] border border-[#E0C58F]/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#E0C58F] hover:text-[#112250] transition-all"
                                                                >
                                                                    <RefreshCw size={14} /> Re-upload
                                                                </button>
                                                            )}
                                                        </div>

                                                        {selectedFile ? (
                                                            <ImagingResult
                                                                file={selectedFile}
                                                                result={analysisResult}
                                                                loading={isUploading}
                                                                onSave={handleSaveImagingRecord}
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-[#3C507D] rounded-[2rem] bg-[#3C507D]/10 group hover:border-[#E0C58F] transition-all">
                                                                <div className="w-20 h-20 rounded-full bg-[#E0C58F]/10 border border-[#E0C58F]/20 flex items-center justify-center text-[#E0C58F] mb-6">
                                                                    <ImageIcon size={40} />
                                                                </div>
                                                                <h4 className="text-xl font-bold text-white mb-2">Radiology Node Initialized</h4>
                                                                <p className="text-[#D9CBC2] text-xs font-medium mb-10 max-w-xs text-center uppercase tracking-widest leading-loose">Upload X-Ray, CT, or MRI scans for high-fidelity clinical reasoning</p>
                                                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                                                                <button onClick={() => fileInputRef.current?.click()} className="btn-premium bg-[#E0C58F] text-[#112250] px-16 py-5 text-lg font-black uppercase tracking-[0.2em]">Select Medical Scan</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ) : activeModule === 'genomics' ? (
                                                <motion.div key="dna-node" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                                                    <div className="glass-card w-full bg-[#112250] border-[#3C507D] p-10 flex flex-col gap-8 shadow-2xl min-h-[50rem] text-[#F5F0E9]">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="space-y-1">
                                                                <h2 className="text-2xl font-bold text-[#E0C58F]">DNA Disease Analysis</h2>
                                                                <p className="text-[#D9CBC2] text-xs font-medium uppercase tracking-widest">Genetic variant analysis from VCF files</p>
                                                            </div>
                                                            {vcfFile && (
                                                                <button onClick={() => { setVcfFile(null); setDnaResult(null); }} className="text-[#D9CBC2] hover:text-white transition-colors"><X size={20} /></button>
                                                            )}
                                                        </div>

                                                        {vcfFile ? (
                                                            <DnaResult
                                                                file={vcfFile}
                                                                result={dnaResult}
                                                                loading={isDnaProcessing}
                                                                onAnalyze={triggerDnaAnalysis}
                                                                onSave={handleSaveGenomicsRecord}
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-[#3C507D] rounded-[2rem] bg-[#3C507D]/10 group hover:border-[#E0C58F] transition-all">
                                                                <div className="w-20 h-20 rounded-full bg-[#E0C58F]/10 border border-[#E0C58F]/20 flex items-center justify-center text-[#E0C58F] mb-6">
                                                                    <Dna size={40} />
                                                                </div>
                                                                <h4 className="text-xl font-bold text-white mb-2">Genomics Node Initialized</h4>
                                                                <p className="text-[#D9CBC2] text-xs font-medium mb-10 max-w-xs text-center uppercase tracking-widest leading-loose">Upload VCF or text-based genetic manifests for alignment</p>
                                                                <input type="file" className="hidden" ref={vcfInputRef} onChange={handleDnaUpload} accept=".vcf,.txt" />
                                                                <button onClick={() => vcfInputRef.current?.click()} className="btn-premium bg-[#E0C58F] text-[#112250] px-16 py-5 text-lg font-black uppercase tracking-[0.2em]">Select Genomic Record</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div key="temporal-node" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col p-10 h-full overflow-y-auto custom-scrollbar">
                                                    <div className="max-w-4xl mx-auto w-full space-y-12">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <h4 className="text-4xl font-black uppercase tracking-tight text-[#112250]">Health Drift</h4>
                                                                <p className="text-[#3C507D] font-bold uppercase tracking-[0.2em] text-[10px]">Longitudinal Clinical Progression Monitoring</p>
                                                            </div>
                                                            <div className="p-6 bg-[#3C507D]/10 rounded-3xl border border-[#3C507D]/20 shadow-inner">
                                                                <Clock size={40} className={`text-[#112250] ${isTemporalProcessing ? 'animate-spin' : ''}`} />
                                                            </div>
                                                        </div>

                                                        {!temporalResult ? (
                                                            <div className="space-y-8">
                                                                <div className="p-8 bg-[#112250] text-[#F5F0E9] rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group">
                                                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                                                        <Timer size={120} />
                                                                    </div>
                                                                    <div className="flex items-center gap-4 border-b border-[#3C507D]/30 pb-4">
                                                                        <Timer className="text-[#E0C58F]" />
                                                                        <span className="font-bold text-xs uppercase tracking-widest text-[#E0C58F]">New Insight Integration</span>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Enter current clinical observations to correlate against history:</p>
                                                                        <textarea
                                                                            value={temporalObservation}
                                                                            onChange={(e) => setTemporalObservation(e.target.value)}
                                                                            placeholder="Enter new patterns, symptoms, or test results..."
                                                                            className="w-full min-h-[120px] bg-[#3C507D]/20 border-2 border-[#3C507D]/30 rounded-2xl p-6 text-white outline-none focus:border-[#E0C58F]/50 transition-all font-medium text-sm resize-none"
                                                                        />
                                                                    </div>
                                                                    <div className="flex gap-4">
                                                                        <div className="h-1 flex-1 bg-[#3C507D]/50 rounded-full overflow-hidden">
                                                                            {isTemporalProcessing && <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="h-full w-full bg-[#E0C58F]" />}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={triggerTemporalAnalysis}
                                                                        disabled={isTemporalProcessing}
                                                                        className="w-full py-5 bg-[#E0C58F] text-[#112250] font-black uppercase tracking-[0.3em] text-sm rounded-2xl hover:bg-white transition-all shadow-xl disabled:opacity-50"
                                                                    >
                                                                        {isTemporalProcessing ? "Analyzing Biometric Drift..." : "Execute Longitudinal Scan"}
                                                                    </button>
                                                                </div>

                                                                <div className="p-10 border-2 border-dashed border-[#D9CBC2] rounded-[2.5rem] bg-white/50 space-y-6">
                                                                    <div className="flex items-center gap-3 opacity-40">
                                                                        <HistoryIcon size={16} />
                                                                        <span className="text-[10px] font-bold uppercase tracking-widest">History Summary</span>
                                                                    </div>
                                                                    <p className="text-black/40 text-sm italic font-medium">Connect clinical nodes to build a temporal heatmap of patient health over months or years. The prediction engine identifies drift patterns before symptoms become critical.</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <TemporalResult
                                                                result={temporalResult}
                                                                onReset={() => setTemporalResult(null)}
                                                                onSave={() => alert('Longitudinal drift analysis saved to persistent ledger.')}
                                                            />
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.section>
                        )
                    }

                    {
                        view === 'dossier' && (
                            <DossierView
                                patient={selectedPatient}
                                onBack={() => setView('overview')}
                                onWorkspace={() => setView('workspace')}
                            />
                        )
                    }

                    {
                        view === 'aichat' && (
                            <motion.section
                                key="aichat"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-10 lg:p-16 h-full flex flex-col"
                            >
                                <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-10">
                                    <header className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-[#112250] flex items-center justify-center text-[#E0C58F] shadow-xl">
                                                <Bot size={32} />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-black tracking-tight">MedGemma Assistant</h2>
                                                <p className="text-sm font-bold text-[#3C507D] uppercase tracking-widest">Medical Reasoning Engine v1.5 (4B)</p>
                                            </div>
                                        </div>
                                        <p className="text-black/60 font-medium leading-relaxed max-w-2xl">
                                            Clinical reasoning agent designed for secure medical document summarization and disease pattern analysis.
                                        </p>
                                    </header>

                                    <div className="flex-1 bg-white border-2 border-[#D9CBC2] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8">
                                            {chatMessages.map(m => (
                                                <ChatMessage key={m.id} type={m.type} text={m.text} />
                                            ))}
                                            {isChatThinking && (
                                                <div className="flex justify-start">
                                                    <div className="bg-[#F5F0E9] border-2 border-[#D9CBC2] p-4 rounded-2xl flex gap-1">
                                                        <div className="w-2 h-2 bg-[#E0C58F] rounded-full animate-bounce" />
                                                        <div className="w-2 h-2 bg-[#E0C58F] rounded-full animate-bounce [animation-delay:0.2s]" />
                                                        <div className="w-2 h-2 bg-[#E0C58F] rounded-full animate-bounce [animation-delay:0.4s]" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-8 bg-[#F5F0E9]/30 border-t border-[#D9CBC2]">
                                            {chatPdf && (
                                                <div className="mb-4 flex items-center justify-between p-4 bg-[#E0C58F]/20 border border-[#E0C58F] rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="text-[#112250]" />
                                                        <span className="text-sm font-bold text-black">{chatPdf.name}</span>
                                                    </div>
                                                    <button onClick={() => setChatPdf(null)} className="text-rose-600 hover:scale-110 transition-transform"><X size={18} /></button>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4">
                                                <input type="file" className="hidden" ref={chatPdfInputRef} accept=".pdf" onChange={(e) => setChatPdf(e.target.files?.[0] || null)} />
                                                <button onClick={() => chatPdfInputRef.current?.click()} className="p-4 bg-white border border-[#D9CBC2] rounded-2xl text-[#112250] hover:bg-white transition-all shadow-sm group">
                                                    <Upload size={24} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        value={chatInput}
                                                        onChange={(e) => setChatInput(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSendGeneralChat()}
                                                        placeholder="Ask MedGemma anything..."
                                                        className="w-full bg-white border-2 border-[#D9CBC2] rounded-2xl px-6 py-4 text-[#112250] outline-none focus:border-[#E0C58F] transition-all font-medium"
                                                    />
                                                    <button onClick={handleSendGeneralChat} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3C507D] hover:scale-110 transition-transform">
                                                        <Send size={24} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        )
                    }
                </AnimatePresence>
            </main>

            {/* Bridge Configuration Modal */}
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
                                    <h3 className="text-2xl font-black text-black">Bridge Settings</h3>
                                </div>
                                <button onClick={() => setShowBridgeSettings(false)} className="p-2 hover:bg-[#F5F0E9] rounded-xl transition-all text-black">
                                    <X size={24} />
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
                                    }}
                                    className="w-full bg-[#112250] text-[#E0C58F] py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    VERIFY SYSTEM LINKAGE
                                </button>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('carefusion_tunnel_url');
                                        setNewTunnelUrl('');
                                        setShowBridgeSettings(false);
                                    }}
                                    className="w-full text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                                >
                                    RESET TO DEFAULT
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Specialized Result Formatters ---

const DossierView = ({ patient, onBack, onWorkspace }: { patient: Patient | null, onBack: () => void, onWorkspace: () => void }) => {
    const [activeTab, setActiveTab] = useState('records');
    const [savedRecords, setSavedRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<string[]>(['General']);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const fetchCategories = async () => {
        if (!patient) return;
        try {
            const baseUrl = getApiBase();
            const response = await fetch(`${baseUrl}${API_ENDPOINTS.AI}/records/categories/${patient.id}`, {
                headers: { 'Authorization': 'Bearer clinical-access-token-2026', 'bypass-tunnel-reminder': 'true' }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setCategories(['General', ...data.categories.filter((c: string) => c !== 'General')]);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchRecords = async () => {
        if (!patient) return;
        setIsLoading(true);
        try {
            const baseUrl = getApiBase();
            // Fetch ALL records for this patient identity
            const response = await fetch(`${baseUrl}${API_ENDPOINTS.AI}/records/patient/${patient.id}`, {
                headers: {
                    'Authorization': 'Bearer clinical-access-token-2026',
                    'bypass-tunnel-reminder': 'true'
                }
            });

            const data = await response.json();
            if (data.status === 'success') {
                setSavedRecords(data.records);
                setError(null);
            } else {
                setError(data.message || 'Failed to retrieve data nodes.');
            }
        } catch (error) {
            console.error('Failed to fetch records:', error);
            setError('System Linkage Failure: Could not synchronize with the clinical database.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
        fetchCategories();
    }, [patient]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'imaging': return <ImageIcon size={18} className="text-black" />;
            case 'genomics': return <Dna size={18} className="text-black" />;
            case 'symptom': return <Brain size={18} className="text-black" />;
            default: return <FileText size={18} className="text-black" />;
        }
    };

    const getTitle = (record: any) => {
        if (record.recordType === 'imaging') return `Scan Analysis: ${record.moduleData?.prediction || 'General'}`;
        if (record.recordType === 'genomics') return `Genomic Report: ${record.moduleData?.variants?.length || 0} variants`;
        if (record.recordType === 'symptom') return `Symptom Reasoning Cache`;
        return record.title || "Clinical Document";
    };

    if (!patient) return null;

    return (
        <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-10 lg:p-16 space-y-12"
        >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-[#D9CBC2]">
                <div className="flex items-center gap-8">
                    <button onClick={onBack} className="p-4 rounded-2xl bg-white border border-[#D9CBC2] text-black hover:bg-[#F5F0E9] transition-all shadow-sm">
                        <ChevronRight size={24} className="rotate-180 text-black" />
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-[#112250] text-[#E0C58F] flex items-center justify-center text-2xl font-black shadow-xl">{patient.avatar}</div>
                        <div>
                            <h1 className="text-4xl font-black text-black tracking-tight">{patient.name}</h1>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs font-bold text-black opacity-60 uppercase tracking-widest">PATIENT ID: {patient.id}-PRT-2026</span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${patient.status === 'Critical' ? 'bg-[#E0C58F] text-black' : 'bg-[#D9CBC2] text-black'}`}>
                                    {patient.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onWorkspace} className="btn-premium bg-[#112250] text-[#E0C58F] px-8 py-4 text-sm font-black uppercase tracking-widest shadow-lg border border-[#3C507D]">New Analysis Node</button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Dossier Navigation */}
                <div className="lg:col-span-3 space-y-4">
                    <DossierNavButton active={activeTab === 'records'} onClick={() => setActiveTab('records')} icon={<FileSearch size={20} />} label="Past Records" />
                    <DossierNavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<HistoryIcon size={20} />} label="Medical History" />
                    < DossierNavButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={<FileText size={20} />} label="Documents" />
                    <DossierNavButton active={activeTab === 'videos'} onClick={() => setActiveTab('records')} icon={<Video size={20} />} label="Video Consults" />
                    <DossierNavButton active={activeTab === 'cancer'} onClick={() => setActiveTab('records')} icon={<FolderArchive size={20} />} label="Cancer Talks" />

                    <div className="pt-6 mt-6 border-t border-[#D9CBC2]">
                        <h3 className="text-[10px] font-black text-black opacity-30 uppercase tracking-[0.2em] mb-4 px-4">Condition Folders</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedCategory('All')}
                                className={`w-full text-left px-5 py-3 rounded-xl text-xs font-bold transition-all ${selectedCategory === 'All' ? 'bg-[#112250] text-[#E0C58F] shadow-lg' : 'text-black/60 hover:bg-[#F5F0E9]'}`}
                            >
                                All Records
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`w-full text-left px-5 py-3 rounded-xl text-xs font-bold transition-all truncate flex items-center gap-3 ${selectedCategory === cat ? 'bg-[#112250] text-[#E0C58F] shadow-lg' : 'text-black/60 hover:bg-[#F5F0E9]'}`}
                                >
                                    <Folder size={14} className={selectedCategory === cat ? 'text-[#E0C58F]' : 'text-black/40'} />
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Dossier Content */}
                <div className="lg:col-span-9 space-y-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black opacity-30" size={18} />
                            <input type="text" placeholder="Search clinical records..." className="w-full bg-white border-2 border-[#D9CBC2] rounded-2xl py-3 pl-12 pr-6 text-sm font-medium outline-none focus:border-[#E0C58F] text-black transition-all shadow-inner" />
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-3 rounded-xl bg-white border border-[#D9CBC2] text-black hover:bg-[#F5F0E9] transition-all shadow-sm"><Filter size={20} /></button>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-6">
                                <RefreshCw className="animate-spin text-black opacity-40" size={32} />
                                <p className="text-black font-black uppercase tracking-[0.2em] text-xs">Retrieving Data Nodes...</p>
                            </div>
                        ) : error ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-6 border-2 border-[#E0C58F] rounded-[3rem] bg-[#E0C58F]/5">
                                <ShieldAlert className="text-black" size={48} />
                                <p className="text-black font-black uppercase tracking-[0.1em] text-sm">{error}</p>
                                <button onClick={fetchRecords} className="px-8 py-3 bg-[#112250] text-[#E0C58F] rounded-xl font-black uppercase tracking-widest text-xs shadow-lg">Retry Sync</button>
                            </div>
                        ) : savedRecords.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-[#D9CBC2] rounded-[3rem]">
                                <Database className="text-black opacity-20" size={48} />
                                <p className="text-black font-bold uppercase tracking-[0.1em] text-xs opacity-40">No records found for this patient identity.</p>
                            </div>
                        ) : savedRecords
                            .filter((r: any) => {
                                // First apply category filter
                                if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;

                                // Then apply tab filter
                                if (activeTab === 'records') return true;
                                if (activeTab === 'history') return false; // History has its own section
                                return r.recordType === activeTab.slice(0, -1);
                            })
                            .map((record: any) => (
                                <motion.div
                                    key={record._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 bg-white border-2 border-[#D9CBC2]/20 rounded-3xl hover:border-[#E0C58F] transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-[#F5F0E9] text-black flex items-center justify-center shadow-inner group-hover:bg-[#E0C58F]/20 transition-colors">
                                            {getIcon(record.recordType)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-black text-lg">{getTitle(record)}</h4>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-xs font-bold text-black opacity-40 uppercase tracking-widest">{new Date(record.timestamp).toLocaleDateString()}</span>
                                                <span className="w-1 h-1 rounded-full bg-[#D9CBC2]" />
                                                <span className="text-xs font-black text-black uppercase tracking-widest opacity-80">{record.status || 'Analyzed'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const baseUrl = getApiBase();
                                                    const response = await fetch(`${baseUrl}${API_ENDPOINTS.AI}/records/${record._id}/pdf`, {
                                                        headers: {
                                                            'Authorization': 'Bearer clinical-access-token-2026',
                                                            'bypass-tunnel-reminder': 'true'
                                                        }
                                                    });
                                                    if (!response.ok) throw new Error('Failed to generate report');
                                                    const blob = await response.blob();
                                                    const downloadUrl = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = downloadUrl;
                                                    a.download = `clinical-report-${record._id}.txt`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    a.remove();
                                                } catch (error: any) {
                                                    console.error('Download error:', error);
                                                    alert(`❌ Download Error: ${error.message}`);
                                                }
                                            }}
                                            className="p-3 rounded-xl bg-[#F5F0E9] text-black opacity-0 group-hover:opacity-100 transition-all hover:bg-[#E0C58F]"
                                            title="Download Report"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <ChevronRight className="text-[#D9CBC2] group-hover:text-black transition-colors" size={24} />
                                    </div>
                                </motion.div>
                            ))
                        }

                        {activeTab === 'documents' && (
                            <div className="space-y-8">
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-black uppercase tracking-tight">Clinical Document Vault</h3>
                                        <span className="text-xs font-bold text-black opacity-40 uppercase tracking-widest">Storage Node: LOCAL_STORAGE_v2</span>
                                    </div>
                                    <FileUpload
                                        patientId={patient.id || CURRENT_PATIENT_ID}
                                        onUploadSuccess={() => {
                                            fetchRecords(); // Refresh the list if needed
                                        }}
                                    />
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.section>
    );
};


const DossierNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 font-bold text-sm tracking-tight ${active ? 'bg-[#E0C58F] text-black shadow-lg border-2 border-[#112250]' : 'bg-white text-black border-2 border-[#D9CBC2] hover:border-[#E0C58F]'}`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-[#112250] text-[#E0C58F]' : 'bg-[#F5F0E9] text-black'}`}>{icon}</div>
        <span className="text-black uppercase tracking-wider text-[10px] font-black">{label}</span>
    </button>
);

/**
 * PARSER: Converts raw AI text with A. B. C. sections into structured JSX
 */
const ClinicalReportFormatter = ({ text }: { text: string }) => {
    // Check if it's markdown-style or the old decorative style
    const isMarkdown = text.includes('###') || text.includes('**');

    if (isMarkdown) {
        const sections = text.split(/(### [^\n]+)/);
        return (
            <div className="space-y-6 py-2">
                {sections.map((section, idx) => {
                    if (section.startsWith('###')) {
                        return (
                            <div key={idx} className="flex items-center gap-3 pt-4 border-b border-[#D9CBC2]/30 pb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3C507D]">{section.replace('###', '').trim()}</h4>
                            </div>
                        );
                    }
                    if (!section.trim()) return null;

                    // Simple markdown-to-JSX for bold and bullets
                    const lines = section.split('\n').filter(l => l.trim());
                    return (
                        <div key={idx} className="text-sm font-medium leading-relaxed text-black/90 space-y-2">
                            {lines.map((line, lIdx) => {
                                let content: any = line.trim();
                                let isBullet = content.startsWith('•') || content.startsWith('*');

                                if (isBullet) {
                                    if (content.startsWith('•')) content = content.substring(1).trim();
                                    else if (content.startsWith('*')) content = content.substring(1).trim();
                                }

                                // Bold parsing
                                const parts = String(content).split(/(\*\*[^*]+\*\*)/g);
                                const renderedContent = parts.map((part, pIdx) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return <span key={pIdx} className="font-black text-[#112250]">{part.slice(2, -2)}</span>;
                                    }
                                    return <span key={pIdx}>{part}</span>;
                                });

                                return (
                                    <div key={lIdx} className={`${isBullet ? 'pl-4 relative' : ''}`}>
                                        {isBullet && <span className="absolute left-0 text-[#112250]">•</span>}
                                        {renderedContent}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        );
    }

    // Fallback to old decorative section parser
    const sections = text.split(/─{20,}\n([A-Z]\. [^\n]+)\n─{20,}/);

    if (sections.length < 2) {
        return <p className="whitespace-pre-wrap">{text}</p>;
    }

    const processedSections: { title: string, content: string }[] = [];
    for (let i = 1; i < sections.length; i += 2) {
        processedSections.push({
            title: sections[i],
            content: sections[i + 1]?.trim() || ''
        });
    }

    return (
        <div className="space-y-8 py-2">
            {processedSections.map((s, idx) => (
                <div key={idx} className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-[#D9CBC2]/30" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3C507D] px-2">{s.title}</h4>
                        <div className="h-px flex-1 bg-[#D9CBC2]/30" />
                    </div>
                    <div className="text-sm font-medium leading-relaxed text-black/90 pl-2">
                        {s.content.split('\n').filter(line => line.trim() !== '').map((line, lIdx) => (
                            <div key={lIdx} className={`${line.trim().startsWith('-') ? 'pl-4 relative mb-1' : 'mb-2'}`}>
                                {line.trim().startsWith('-') && <span className="absolute left-0 text-[#112250]">•</span>}
                                {line.trim().startsWith('-') ? line.trim().substring(1).trim() : line}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const SymptomResult = ({ data, onSave }: { data: any, onSave: () => void }) => {
    const [showLogs, setShowLogs] = useState(false);
    const observations = data?.symptoms || ["Stable baseline identified", "Neural reasoning active"];
    const diagnosis = data?.recommendation || "Requires further sequencing";

    return (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="ml-10 p-6 glass-card bg-white border-2 border-[#D9CBC2] shadow-xl space-y-6 max-w-xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-black">
                    <Brain size={20} className="text-[#112250]" />
                    <span className="font-black uppercase tracking-widest text-[10px] text-black">Clinical Reasoning Data</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        className="p-1.5 rounded-lg border border-[#D9CBC2] hover:bg-[#F5F0E9] transition-all text-[#112250]"
                        title="View Reasoning Trace"
                    >
                        <Search size={14} />
                    </button>
                    <button
                        onClick={onSave}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#E0C58F] text-black rounded-lg text-[9px] font-black uppercase tracking-widest border border-[#112250] hover:bg-[#D9CBC2] transition-all shadow-sm"
                    >
                        <Save size={12} /> Save Analysis
                    </button>
                </div>
            </div>

            {showLogs && data.logs && (
                <div className="p-4 bg-black rounded-xl font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-60 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-2 border-b border-emerald-900 pb-1">
                        <Terminal size={10} />
                        <span>CLINICAL_LOG_STREAM_v2.0</span>
                    </div>
                    {data.logs}
                </div>
            )}

            <div className="space-y-6">
                <div className="space-y-3">
                    <p className="text-[10px] font-bold text-black opacity-40 uppercase tracking-widest">Key Findings</p>
                    <div className="flex flex-wrap gap-2">
                        {Array.isArray(observations) ? observations.map((o, i) => (
                            <span key={i} className="px-4 py-2 bg-[#F5F0E9] border-2 border-[#D9CBC2] rounded-xl text-[11px] font-black text-black shadow-sm">{o}</span>
                        )) : <span className="text-sm font-medium text-black">{JSON.stringify(observations)}</span>}
                    </div>
                </div>
                <div className="space-y-4">
                    <p className="text-[10px] font-bold text-black opacity-60 uppercase tracking-widest italic">Neural Predictions</p>

                    {data?.top_5_predictions && data.top_5_predictions.length > 0 ? (
                        <div className="space-y-3">
                            {data.top_5_predictions.map((p: any, idx: number) => (
                                <div key={idx} className={`p-4 rounded-2xl border-2 transition-all ${idx === 0 ? 'bg-[#E0C58F] border-[#112250] shadow-lg' : 'bg-[#F5F0E9] border-[#D9CBC2] opacity-80'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className={`font-black italic leading-tight ${idx === 0 ? 'text-lg text-black' : 'text-sm text-[#112250]'}`}>
                                            {p.disease}
                                        </p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${idx === 0 ? 'bg-black text-[#E0C58F] border-black' : 'bg-white text-black border-[#D9CBC2]'}`}>
                                            {(p.prob * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase tracking-tight ${idx === 0 ? 'text-black/60' : 'text-[#3C507D]'}`}>
                                        Context: {p.bucket} {idx === 0 && '• Primary Hypothesis'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 bg-[#E0C58F] border-2 border-[#112250] rounded-2xl shadow-lg text-black">
                            <p className="text-lg font-black italic text-black leading-tight">
                                {typeof diagnosis === 'string' ? diagnosis : JSON.stringify(diagnosis)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const ImagingResult = ({ file, result, loading, onSave }: { file: File, result: any, loading: boolean, onSave: (observations: string) => void }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const [observations, setObservations] = useState('');
    const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);

    if (loading) {
        return (
            <div className="w-full flex-1 flex flex-col items-center justify-center space-y-12 py-10">
                <div className="relative">
                    <div className="w-48 h-48 rounded-[2rem] overflow-hidden border-2 border-[#E0C58F]/20 shadow-2xl relative">
                        <img src={imageUrl} alt="Analyzing" className="w-full h-full object-cover opacity-50 grayscale" />
                        <motion.div
                            initial={{ top: '-10%' }}
                            animate={{ top: '110%' }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-[#E0C58F] shadow-[0_0_15px_#E0C58F] z-10"
                        />
                    </div>
                </div>
                <div className="w-full max-w-md space-y-6">
                    <div className="flex justify-center">
                        <motion.div
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="bg-[#E0C58F] text-black px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-[#112250] flex items-center gap-3 shadow-lg"
                        >
                            <RefreshCw className="animate-spin" size={16} /> Analyzing Scan Manifest...
                        </motion.div>
                    </div>
                    <div className="h-1 w-full bg-[#3C507D]/30 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 10 }}
                            className="h-full bg-[#E0C58F]"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-12">
            {/* Image Analysis Header removed dead button */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <h4 className="text-black font-bold text-xs uppercase tracking-widest">AI Heatmap Comparison</h4>
                        <p className="text-black/60 text-[10px] font-medium uppercase tracking-tight">Drag slider to reveal AI attention.</p>
                    </div>
                    <div className="relative aspect-square bg-[#0a1435] rounded-[2.5rem] overflow-hidden border-2 border-[#3C507D] shadow-2xl group">
                        <img src={imageUrl} alt="Original" className="w-full h-full object-contain" />
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                        >
                            <img src={imageUrl} alt="Heatmap" className="w-full h-full object-contain mix-blend-multiply opacity-80" style={{ filter: 'hue-rotate(-50deg) saturate(3) contrast(1.2)' }} />
                            <div className="absolute inset-0 bg-rose-600/30 mix-blend-color" />
                        </div>
                        <div
                            className="absolute inset-y-0 w-1 bg-[#E0C58F] z-20 cursor-ew-resize group"
                            style={{ left: `${sliderPos}%` }}
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#E0C58F] rounded-full border-4 border-[#112250] shadow-xl flex items-center justify-center text-[#112250] scale-100 group-hover:scale-110 transition-transform">
                                <Activity size={18} />
                            </div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderPos}
                            onChange={(e) => setSliderPos(parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <h4 className="text-black font-bold text-xs uppercase tracking-widest">Original Reference</h4>
                        <p className="text-black/40 text-[10px] font-medium uppercase tracking-tight">Unmodified source image for clinical verification.</p>
                    </div>
                    <div className="aspect-square bg-white rounded-[2.5rem] overflow-hidden border-2 border-[#D9CBC2] flex items-center justify-center shadow-2xl">
                        <img src={imageUrl} alt="Reference" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>
            </div>

            <div className="space-y-8 pt-8 border-t border-[#D9CBC2]">
                <div className="space-y-6">
                    <div className="space-y-1">
                        <p className="text-black text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Result Prediction</p>
                        <h3 className={`text-2xl font-black ${result?.prediction === 'NORMAL' ? 'text-black' : 'text-rose-600'}`}>
                            {result?.prediction || 'NORMAL'}
                        </h3>
                    </div>
                    <div className="space-y-1">
                        <p className="text-black text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Result Probability</p>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-black text-black">{(result?.probability * 100 || 99.7).toFixed(1)}%</span>
                            <span className="text-black text-[9px] font-bold uppercase tracking-widest opacity-40">Confidence threshold: {result?.threshold || 0.44}</span>
                        </div>
                    </div>
                </div>
                <div className="p-8 bg-white border border-[#D9CBC2] rounded-[2.5rem] shadow-inner space-y-6">
                    <div className="flex items-center gap-3">
                        <FileText size={16} className="text-[#112250]" />
                        <h5 className="text-xs font-bold text-black uppercase tracking-[0.2em]">Physician's Clinical Observations</h5>
                    </div>
                    <textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Add clinical findings, differential diagnosis, or recommendations..."
                        className="w-full min-h-[10rem] bg-[#F5F0E9] border-2 border-[#D9CBC2] rounded-2xl p-6 text-black outline-none focus:border-[#E0C58F] transition-all font-medium text-sm resize-none placeholder:text-black/30"
                    />
                    <button onClick={() => onSave(observations)} className="w-full py-4 bg-[#E0C58F] text-black font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-[#D9CBC2] transition-all flex items-center justify-center gap-3 shadow-lg border border-[#D9CBC2]">
                        <Save size={16} /> Save to Patient Record
                    </button>
                </div>
            </div>
        </div>
    );
};

const DnaResult = ({ file, result, loading, onAnalyze, onSave }: { file: File, result: any, loading: boolean, onAnalyze: () => void, onSave: (interpretation: string, variants: string[], summary: string) => void }) => {
    const [notes, setNotes] = useState('');

    return (
        <div className="w-full space-y-10">
            <div className="p-4 bg-[#D9CBC2]/20 border border-[#D9CBC2] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-black">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-widest text-black">File Ready: {file.name}</span>
                </div>
                <div className="w-4 h-4 rounded-full border-2 border-[#112250] border-t-transparent animate-spin opacity-50" />
            </div>

            <button
                onClick={onAnalyze}
                disabled={loading}
                className="w-full py-4 bg-[#112250] text-[#E0C58F] font-black uppercase tracking-[0.2em] text-sm rounded-xl hover:bg-[#0a1435] transition-all shadow-xl disabled:opacity-50"
            >
                {loading ? "Initializing Genetic Correlator..." : "Analyze DNA"}
            </button>

            <div className="space-y-10">
                <div className="space-y-1">
                    <h3 className="text-lg font-black text-black uppercase tracking-[0.2em]">Genomic Variant Analysis</h3>
                    <p className="text-black text-[9px] font-bold uppercase tracking-widest opacity-40">Ref ID: DNA-GNM-928-SKW | 29/1/2026</p>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-6">
                        <Dna size={48} className="text-[#3C507D] animate-spin" />
                        <p className="text-black text-[10px] font-bold uppercase tracking-[0.3em]">Sequencing Variant Records...</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-black uppercase tracking-widest">Clinical Summary</h4>
                            <div className="p-6 bg-white border border-[#D9CBC2] rounded-xl text-black font-medium text-sm">
                                {result?.summary || "No specific summary provided."}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-black uppercase tracking-widest">Detected Variants</h4>
                            <div className="space-y-4">
                                {result?.error ? (
                                    <div className="p-6 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-700 font-bold text-sm">
                                        <p className="flex items-center gap-2 mb-1"><ShieldAlert size={16} /> Analysis Error</p>
                                        <p className="opacity-80">{result.message || result.error}</p>
                                    </div>
                                ) : result?.genetic_findings && result.genetic_findings.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {result.genetic_findings.map((v: any, i: number) => {
                                            const isPathogenic = v.status === 'Pathogenic';
                                            return (
                                                <div key={i} className={`p-6 bg-white border-2 rounded-2xl transition-all shadow-sm ${isPathogenic ? 'border-rose-200 hover:border-rose-400' : 'border-[#D9CBC2]/30 hover:border-[#112250]/30'}`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPathogenic ? 'bg-rose-50' : 'bg-cyan-50'}`}>
                                                                {isPathogenic ? <ShieldAlert size={20} className="text-rose-600" /> : <Database size={20} className="text-cyan-600" />}
                                                            </div>
                                                            <div>
                                                                <h5 className="text-base font-black text-black">{v.gene || 'Genetic Locus'}</h5>
                                                                <p className="text-[10px] font-bold text-black opacity-40 uppercase tracking-widest">{v.rsid || 'NO_RSID'}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 text-white text-[9px] font-black uppercase tracking-widest rounded-lg ${isPathogenic ? 'bg-rose-600' : 'bg-cyan-600'}`}>
                                                            {v.status || 'Variant'}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <p className="text-[9px] font-bold text-black opacity-40 uppercase tracking-widest mb-1">Variant Identity</p>
                                                            <p className="text-xs font-bold text-black truncate" title={v.variant}>{v.variant}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-bold text-black opacity-40 uppercase tracking-widest mb-1">Associated Condition</p>
                                                            <p className="text-xs font-bold text-black">{v.disease || 'Undetermined'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-bold text-black opacity-40 uppercase tracking-widest mb-1">Allele Frequency</p>
                                                            <p className="text-xs font-bold text-black">
                                                                {typeof v.frequency === 'number'
                                                                    ? `${(v.frequency * 100).toFixed(4)}%`
                                                                    : (v.frequency || 'N/A')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-white border border-[#D9CBC2] rounded-xl text-black font-medium text-sm text-center">
                                        No clinically significant variants detected in this manifest.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-white border border-[#D9CBC2] rounded-[2.5rem] shadow-inner space-y-6">
                            <div className="flex items-center gap-3">
                                <FileText size={16} className="text-[#112250]" />
                                <h5 className="text-[10px] font-bold text-black uppercase tracking-[0.2em]">Clinician's Interpretation & Notes</h5>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Enter findings, clinical correlation, or follow-up plan..."
                                className="w-full min-h-[10rem] bg-[#F5F0E9] border-2 border-[#D9CBC2] rounded-2xl p-6 text-black outline-none focus:border-[#E0C58F]/30 transition-all font-medium text-sm resize-none placeholder:text-black/30"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                            <button onClick={() => onSave(notes, result?.genetic_findings || [], result?.summary || '')} className="py-4 bg-[#E0C58F] text-black font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-[#D9CBC2] transition-all shadow-xl border border-[#D9CBC2]">
                                Save to Patient Record
                            </button>
                            <button onClick={() => alert('Download feature integrated with patient records. Please save first.')} className="py-4 bg-white border border-[#D9CBC2] text-black font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-[#F5F0E9] transition-all">
                                Download PDF Report
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TemporalResult = ({ result, onReset, onSave }: { result: any, onReset: () => void, onSave: () => void }) => {
    const risk = result?.risk_analysis || {};
    const findings = result?.temporal_findings || {};
    const events = result?.timeline_events || [];

    const getRiskColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'high':
            case 'elevated':
            case 'critical': return 'text-rose-600 bg-rose-50 border-rose-200';
            case 'moderate': return 'text-[#E0C58F] bg-[#E0C58F]/10 border-[#E0C58F]/20';
            default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        }
    };

    const getEventIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'symptom analysis': return <Brain size={14} />;
            case 'image analysis': return <FileDown size={14} />;
            case 'dna analysis': return <Dna size={14} />;
            default: return <Activity size={14} />;
        }
    };

    return (
        <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Risk Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-8 rounded-[2rem] border-2 shadow-sm space-y-4 ${getRiskColor(risk.overall_risk_level)}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Risk Level</span>
                        <ShieldAlert size={18} />
                    </div>
                    <p className="text-3xl font-black uppercase tracking-tight">{risk.overall_risk_level || 'Stable'}</p>
                </div>

                <div className="p-8 bg-white rounded-[2rem] border-2 border-[#D9CBC2]/30 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Trajectory</span>
                        {risk.risk_trajectory === 'increasing' ? <TrendingUp size={18} className="text-rose-600" /> : <TrendingDown size={18} className="text-emerald-600" />}
                    </div>
                    <p className="text-3xl font-black uppercase tracking-tight text-[#112250]">{risk.risk_trajectory || 'Stable'}</p>
                </div>

                <div className="p-8 bg-[#112250] rounded-[2rem] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E0C58F]/60">Analysis Conf.</span>
                        <Info size={18} className="text-[#E0C58F]" />
                    </div>
                    <p className="text-3xl font-black uppercase tracking-tight text-[#E0C58F]">{((risk.confidence || 0) * 100).toFixed(0)}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Clinical Narrative - Left 2/3 */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Bot size={20} className="text-[#112250]" />
                            <h5 className="text-xs font-black uppercase tracking-[0.2em] text-[#112250]">Clinical Temporal Narrative</h5>
                        </div>
                        <div className="p-10 bg-white border-2 border-[#D9CBC2]/50 rounded-[3rem] shadow-inner text-black">
                            <ClinicalReportFormatter text={result.explanation || "System analyzing longitudinal datasets..."} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 px-4">Detected Patterns</h5>
                            <div className="space-y-4">
                                {findings.symptom_persistence?.length > 0 ? findings.symptom_persistence.map((p: any, i: number) => (
                                    <div key={i} className="p-6 bg-[#F5F0E9] border border-[#D9CBC2] rounded-2xl flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-black">{p.symptom}</p>
                                            <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest">{p.duration_days} Day Dur. | {p.occurrences} Events</p>
                                        </div>
                                        <Activity size={14} className="text-[#112250]" />
                                    </div>
                                )) : (
                                    <div className="p-6 bg-[#F5F0E9] border border-[#D9CBC2] rounded-2xl text-center">
                                        <p className="text-xs font-bold text-black/40 uppercase tracking-widest">No persistent symptoms</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 px-4">Historical Correlates</h5>
                            <div className="space-y-4">
                                {findings.disease_relations?.length > 0 ? findings.disease_relations.map((r: any, i: number) => (
                                    <div key={i} className="p-6 bg-[#112250] text-[#E0C58F] rounded-2xl space-y-2 shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Past Disease Tie</p>
                                            <Zap size={12} className="animate-pulse" />
                                        </div>
                                        <p className="text-xs font-bold">{r.disease}</p>
                                        <p className="text-[8px] font-medium leading-tight opacity-80 line-clamp-2">{r.context}</p>
                                    </div>
                                )) : (
                                    <div className="p-6 border-2 border-dashed border-[#D9CBC2] rounded-2xl text-center">
                                        <p className="text-xs font-bold text-black/20 uppercase tracking-widest">No Direct Past Ties</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 px-4">Diagnostic Integrity</h5>
                            <div className="space-y-4">
                                {findings.diagnostic_gaps?.length > 0 ? findings.diagnostic_gaps.map((g: any, i: number) => (
                                    <div key={i} className="p-6 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Procedural Gap Identified</p>
                                        <p className="text-xs font-bold text-black">{g.recommendation}</p>
                                    </div>
                                )) : (
                                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Workup Complete</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Timeline - Right 1/3 */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <HistoryIcon size={20} className="text-[#112250]" />
                        <h5 className="text-xs font-black uppercase tracking-[0.2em] text-[#112250]">Audit Timeline</h5>
                    </div>
                    <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-[#D9CBC2]">
                        {events.length > 0 ? events.map((event: any, idx: number) => (
                            <div key={idx} className="relative">
                                <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-[#112250] border-4 border-[#F5F0E9] shadow-sm" />
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-[#112250] opacity-40 uppercase tracking-widest">{event.date}</p>
                                        <span className="px-1.5 py-0.5 rounded bg-[#F5F0E9] text-[8px] font-black text-[#112250] uppercase tracking-tighter border border-[#D9CBC2]/50">
                                            {event.event_type}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-white border border-[#D9CBC2]/30 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-bold text-black truncate w-40">{event.summary}</p>
                                            <div className="text-[#112250] opacity-30">{getEventIcon(event.event_type)}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${event.risk_level === 'high' ? 'bg-rose-500' : event.risk_level === 'medium' ? 'bg-[#E0C58F]' : 'bg-emerald-500'}`} />
                                            <p className="text-[9px] font-bold text-black/50 uppercase tracking-widest">{event.risk_level} Risk</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-10 text-center text-black/20 italic text-sm">No historical data found</div>
                        )}
                        {/* Current Observation Node */}
                        <div className="relative pt-4">
                            <div className="absolute -left-[25px] top-5 w-2.5 h-2.5 rounded-full bg-rose-600 border-4 border-[#F5F0E9] ring-4 ring-rose-600/20 animate-pulse" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Active Observation</p>
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl shadow-sm">
                                    <p className="text-xs font-bold text-rose-900 italic">"Processing new clinical input..."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-10">
                <button
                    onClick={onSave}
                    className="flex-1 py-5 bg-[#112250] text-[#E0C58F] font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3"
                >
                    <Save size={16} /> Save to Patient Registry
                </button>
                <button
                    onClick={onReset}
                    className="px-10 py-5 border-2 border-[#112250] text-[#112250] font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-[#112250] hover:text-white transition-all"
                >
                    Analyze New Event
                </button>
            </div>
        </div>
    );
};

// Sub-components
const SidebarIcon = ({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) => (
    <div className="relative group cursor-pointer" onClick={onClick}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-[#E0C58F] text-black shadow-lg border border-[#D9CBC2]' : 'bg-transparent text-white/70 hover:text-[#E0C58F]'}`}>
            {icon}
        </div>
        <span className="absolute left-full ml-6 px-3 py-1.5 bg-[#E0C58F] text-black text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] shadow-xl border border-[#D9CBC2]">{label}</span>
    </div>
);

const ModuleCard = ({ label, icon, active, onClick }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void }) => (
    <div onClick={onClick} className={`glass-card p-5 flex items-center gap-5 cursor-pointer transition-all duration-300 ${active ? 'bg-[#E0C58F] text-black border-2 border-[#D9CBC2] shadow-lg' : 'bg-white text-black border-[#D9CBC2] hover:border-[#E0C58F]'}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all ${active ? 'bg-[#112250] text-[#E0C58F]' : 'bg-[#F5F0E9] text-black shadow-inner'}`}>{icon}</div>
        <span className="font-bold text-sm tracking-tight text-black">{label}</span>
    </div>
);

const ChatMessage = ({ type, text }: { type: 'bot' | 'user', text: string }) => (
    <div className={`flex ${type === 'bot' ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[85%] p-6 rounded-2xl text-base font-medium leading-relaxed shadow-sm transition-all ${type === 'bot' ? 'bg-white border-2 border-[#D9CBC2] text-black rounded-bl-none w-full' : 'bg-[#112250] text-[#E0C58F] rounded-br-none'}`}>
            {type === 'bot' ? <ClinicalReportFormatter text={text} /> : text}
        </div>
    </div>
);

const StatCard = ({ label, val, icon }: { label: string, val: string, icon: React.ReactNode }) => (
    <div className="glass-card p-8 bg-white border-2 border-[#D9CBC2] shadow-sm hover:border-[#E0C58F] transition-all group">
        <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-bold text-black opacity-60 uppercase tracking-widest">{label}</span>
            <div className="p-3 rounded-xl bg-[#F5F0E9] text-[#112250] shadow-inner">{icon}</div>
        </div>
        <div className="text-4xl font-black text-black tracking-tight">{val}</div>
    </div>
);

export default DoctorDashboard;
