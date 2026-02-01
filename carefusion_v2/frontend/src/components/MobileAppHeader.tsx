import React from 'react';
import { Menu, User, ShieldCheck } from 'lucide-react';
import { isStandalone } from '../utils/pwa';

interface MobileAppHeaderProps {
    title: string;
    onMenuClick?: () => void;
}

const MobileAppHeader: React.FC<MobileAppHeaderProps> = ({ title }) => {
    if (!isStandalone()) return null;

    return (
        <header className="lg:hidden flex items-center justify-between px-6 bg-[#112250] text-[#E0C58F] h-16 shrink-0 z-[60] shadow-md border-b border-[#D9CBC2]/10 sticky top-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E0C58F]/20 flex items-center justify-center border border-[#E0C58F]/30">
                    <ShieldCheck size={18} className="text-[#E0C58F]" />
                </div>
                <h1 className="text-base font-black uppercase tracking-widest">{title}</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase opacity-60">Clinical Node Online</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#E0C58F] flex items-center justify-center text-black">
                    <User size={16} />
                </div>
            </div>
        </header>
    );
};

export default MobileAppHeader;
