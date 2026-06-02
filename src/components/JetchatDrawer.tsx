/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Channel, Character } from '../types';
import { 
  Hash, MessageSquare, Cpu, Sparkles, LogIn, Laptop,
  HelpCircle, Settings, UserPlus, Sliders, Layers, User, Terminal
} from 'lucide-react';

interface JetchatDrawerProps {
  channels: Channel[];
  characters: Character[];
  activeTarget: { type: 'channel' | 'dm'; id: string };
  onSelectChannel: (id: string) => void;
  onSelectCharacter: (id: string) => void;
  onMenuClick: (tab: 'chat' | 'labs' | 'hub' | 'sandbox') => void;
  onClose: () => void;
}

export default function JetchatDrawer({
  channels,
  characters,
  activeTarget,
  onSelectChannel,
  onSelectCharacter,
  onMenuClick,
  onClose,
}: JetchatDrawerProps) {
  return (
    <div className="w-64 h-full bg-[#121318] border-r border-[#2E3440] flex flex-col font-sans select-none text-sm text-gray-300">
      {/* Brand Header */}
      <div className="p-4 bg-[#1A1C23] border-b border-[#2E3440] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#76B900] flex items-center justify-center text-gray-950 font-bold text-shadow">
          J
        </div>
        <div>
          <h2 className="font-extrabold text-[#ECEFF4] tracking-tight leading-none">Jetchat NIM</h2>
          <span className="text-[10px] text-gray-400 font-mono">v3.5.21_NVIDIA</span>
        </div>
      </div>

      {/* Main Lists Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Section: Channels */}
        <div>
          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
            CHANNELS
          </span>
          <div className="space-y-1">
            {channels.map((chan) => {
              const isSel = activeTarget.type === 'channel' && activeTarget.id === chan.id;
              return (
                <button
                  key={chan.id}
                  onClick={() => {
                    onSelectChannel(chan.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                    isSel
                      ? 'bg-[#2E3440] text-white border-l-2 border-[#76B900]'
                      : 'hover:bg-[#1A1C30]/40 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{chan.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Companions (Candy.ai vibe) */}
        <div>
          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2 flex items-center justify-between">
            <span>COMPANIONS (DMs)</span>
            <span className="text-[9px] bg-pink-500/20 text-pink-400 px-1 py-0.2 rounded font-mono">AI</span>
          </span>
          <div className="space-y-1">
            {characters.map((char) => {
              const isSel = activeTarget.type === 'dm' && activeTarget.id === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => {
                    onSelectCharacter(char.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                    isSel
                      ? 'bg-[#2E3440] text-white border-l-2 border-[#76B900]'
                      : 'hover:bg-[#1A1C30]/40 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {char.avatar.startsWith('http') ? (
                    <img
                      src={char.avatar}
                      alt={char.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover shrink-0 select-none shadow-sm ring-1 ring-white/10"
                    />
                  ) : (
                    <span className="text-base shrink-0 select-none">{char.avatar}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold truncate">{char.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="block text-[9px] text-gray-500 truncate mt-0.5">
                      {char.tagline}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation Actions */}
      <div className="p-3 bg-[#1A1C23] border-t border-[#2E3440] space-y-1 shrink-0">
        <button
          onClick={() => {
            onMenuClick('sandbox');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg bg-pink-900/20 hover:bg-[#202231] text-pink-300 hover:text-white transition-all border border-pink-500/10"
        >
          <Terminal className="w-4 h-4 text-pink-400" />
          <span>Code & ROOT Sandbox</span>
        </button>

        <button
          onClick={() => {
            onMenuClick('hub');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-[#2E3440] text-gray-300 hover:text-white transition-colors"
        >
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>Browse Companions</span>
        </button>

        <button
          onClick={() => {
            onMenuClick('labs');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-[#2E3440] text-gray-300 hover:text-white transition-colors"
        >
          <Sliders className="w-4 h-4 text-[#76B900]" />
          <span>Inference Settings</span>
        </button>
      </div>
    </div>
  );
}
