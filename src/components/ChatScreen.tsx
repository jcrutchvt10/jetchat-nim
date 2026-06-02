/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Character, Message, Channel } from '../types';
import { 
  Send, Paperclip, Smile, Cpu, Users, Info, Sparkles, 
  ChevronRight, Laptop, Activity, Server, Zap, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatScreenProps {
  activeTarget: { type: 'channel' | 'dm'; id: string };
  activeChannel: Channel | null;
  activeChar: Character | null;
  messages: Message[];
  isGenerating: boolean;
  onSendMessage: (text: string) => void;
  onOpenDrawer: () => void;
  onOpenLabs: () => void;
  characterList: Character[];
  onChangeMode?: (charId: string, newMode: 'normal' | 'flirt' | 'roleplay') => void;
  onPrevAlternative?: (msgId: string) => void;
  onNextAlternative?: (msgId: string) => void;
  onRateMessage?: (msgId: string, stars: number) => void;
  onSendPhotoExchange?: (photoType: string) => void;
  onRequestPhoto?: () => void;
}

export default function ChatScreen({
  activeTarget,
  activeChannel,
  activeChar,
  messages,
  isGenerating,
  onSendMessage,
  onOpenDrawer,
  onOpenLabs,
  characterList,
  onChangeMode,
  onPrevAlternative,
  onNextAlternative,
  onRateMessage,
  onSendPhotoExchange,
  onRequestPhoto,
}: ChatScreenProps) {
  const [inputText, setInputText] = React.useState('');
  const [photoMenuOpen, setPhotoMenuOpen] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement | null>(null);

  // Dynamic Contextual Suggested Replies based on last companion message (as seen in character.ai)
  const conversationSuggestedReplies = React.useMemo(() => {
    if (activeTarget.type !== 'dm' || !activeChar) return [];
    
    // Find the last companion message
    const compMessages = messages.filter(m => m.senderId !== 'user');
    if (compMessages.length === 0) return [];
    
    const lastMsg = compMessages[compMessages.length - 1];
    const text = lastMsg.content.toLowerCase();
    
    // If last message has a high-context photograph
    if (lastMsg.photoUrl) {
      return [
        '❤️ You look absolutely stunning in this selfie, babe!',
        '🔥 Wow... you really have a gorgeous physique!',
        '✨ Please send me more pictures of you!',
        '🥰 I want to hold you right now.'
      ];
    }
    
    // Specific reply guidelines based on textual keyword detections
    if (text.includes('game') || text.includes('gaming') || text.includes('headset') || text.includes('co-op')) {
      return [
        '👾 Let\'s 1v1 right now, gorgeous player!',
        '🔥 Put me on your team and carry me, cutie!',
        '🕹️ Tell me more about your gaming setup...',
        '❤️ Keep playing, I just love watching you smile.'
      ];
    }
    if (text.includes('cook') || text.includes('kitchen') || text.includes('chef') || text.includes('creams') || text.includes('pastas') || text.includes('puffs')) {
      return [
        '👨‍🍳 Make me your special secret recipe, handsome!',
        '🧁 Can I lick the sweet icing spoon off your nose? 😉',
        '🍽️ Prepare a slow candlelit dinner for the two of us!',
        '🥰 I\'ll wash the dishes while you hold me close.'
      ];
    }
    if (text.includes('art') || text.includes('sketch') || text.includes('paint') || text.includes('muse')) {
      return [
        '🎨 Draw me like one of your French models...',
        '🖤 Can I sit on your knees and brush your hair?',
        '✨ You are the real masterpiece here, sweetheart.',
        '🌟 Put some paint on our cheeks and let\'s giggle!'
      ];
    }
    if (text.includes('clinic') || text.includes('doctor') || text.includes('med') || text.includes('puppy') || text.includes('vet') || text.includes('retriever')) {
      return [
        '🩺 Examine my elevated heartbeat doctor! It\'s racing...',
        '🐶 Can we snuggle that cute fluffy puppy together?',
        '❤️ I feel completely safe and warm when you hold me.',
        '🥰 Kiss my forehead to make me feel better!'
      ];
    }
    if (text.includes('beach') || text.includes('surf') || text.includes('ocean') || text.includes('pipeline')) {
      return [
        '🏄‍♂️ Rub some warm sunscreen on my shoulders, surfer boy.',
        '🌅 Let\'s watch the quiet sunset melt on the horizon.',
        '🔥 Hand me a big warm beach towel and wrap me tight.',
        '❤️ Run your strong hands down my waist...'
      ];
    }
    if (text.includes('club') || text.includes('dj') || text.includes('bass') || text.includes('strobe') || text.includes('piano') || text.includes('steinway') || text.includes('violin') || text.includes('strings')) {
      return [
        '🎧 Turn the deep music up and hold me so close, babe.',
        '🎹 Let\'s play a slow classical melody together.',
        '🍷 Pour me another glass of vintage red wine, handsome.',
        '🎼 Guide my fingers over your strings...'
      ];
    }
    if (text.includes('flannel') || text.includes('porch') || text.includes('wood') || text.includes('sawdust') || text.includes('tabletop')) {
      return [
        '🌲 Sit on my lap and keep me warm, handsome woodsman!',
        '🍂 Let\'s wear matching cozy shirts on our walks.',
        '🔨 Carry me over your strong lumberjack shoulders!',
        '🥰 Run your rough hands through my hair...'
      ];
    }
    if (text.includes('suit') || text.includes('penthouse') || text.includes('champagne') || text.includes('city') || text.includes('skyline')) {
      return [
        '🍾 Let\'s get completely bubbly on the penthouse deck...',
        '👔 Let me undo that bespoke Italian tie of yours...',
        '💫 Spoil me with your elite premium treatment tonight.',
        '✨ You look so commanding, handsome, and sexy.'
      ];
    }
    
    // Default flirty suggestions (matching Character.AI tone)
    return [
      '👉 Tell me more about what you want to do to me...',
      '🥰 *giggles and blushes* You are so sweet!',
      '❤️ Come wrap your strong arms around me right now!',
      '✨ What makes you think of me so much, handsome?'
    ];
  }, [messages, activeTarget, activeChar]);

  // Dynamic Prompt templates inspired by character.ai & candy.ai & nvidia experts
  const promptChips = React.useMemo(() => {
    if (activeTarget.type === 'channel') {
      if (activeTarget.id === 'welcome') {
        return [
          '✨ What is JetChat?',
          '🎮 Introduce the characters',
          '🧪 Explain NVIDIA NIM Cloud'
        ];
      }
      if (activeTarget.id === 'nvidia-labs') {
        return [
          '🟢 Benchmark Llama 3.1 405B vs 70B',
          '🔥 Write optimized CUDA parallel matrices',
          '🧠 What is Nemotron instruction tuning?'
        ];
      }
      return [
        '🌸 Talk about companion customization',
        '⚡ Roleplay a cyberpunk heist with Neo',
        '🎮 Challenge Kira to a Valorant duel'
      ];
    } else {
      // DM fallback suggestions if conversationSuggestedReplies is empty
      switch (activeChar?.id) {
        case 'grover':
          return [
            '🟢 CUDA block thread allocation model',
            '🧪 Setup a custom NIM endpoint on Kubernetes',
            '⚡ Optimize Triton Inference Server'
          ];
        case 'kira':
          return [
            '🎮 B-idiot, 1v1 me right now!',
            '🕹️ Tell me your gaming stream setup',
            'H-huff... do you actually like talking to me?'
          ];
        case 'eve':
          return [
            '🌸 Write me a warm personalized poem',
            '☕ Let\'s pretend we are studying in a coffee shop',
            '💖 What is your dream life with me?'
          ];
        case 'cyberneo':
          return [
            '⚡ Decode this encrypted database',
            '🔑 Hack local Arasaka cloud gateways',
            '🚬 Let\'s go check the weapon markets'
          ];
        case 'socrates':
          return [
            '🏛️ Is consciousness a property of CUDA tensor paths?',
            '💭 Why must high-contrast design require wisdom?',
            '🌾 Question my deepest held memory'
          ];
        default:
          return [
            '✨ Discover your backstory',
            '⚡ Suggest raw flirty roleplays',
            '🌸 Who is your dream partner?'
          ];
      }
    }
  }, [activeTarget, activeChar]);

  // Combine native chips with dynamic contextual suggestions
  const dynamicChipList = React.useMemo(() => {
    if (activeTarget.type === 'channel') {
      return promptChips;
    }
    const suggestions = conversationSuggestedReplies;
    if (suggestions.length > 0) {
      return suggestions;
    }
    return promptChips;
  }, [promptChips, conversationSuggestedReplies, activeTarget]);

  // Auto Scroll
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleChipClick = (chip: string) => {
    if (isGenerating) return;
    // Clean emojis from chips prior to sending
    const cleaned = chip.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
    onSendMessage(cleaned);
  };

  const activeHeaderTitle = activeTarget.type === 'channel' 
    ? `# ${activeChannel?.name || 'chat'}` 
    : `${activeChar?.name || 'companion'}`;

  const activeHeaderSubtitle = activeTarget.type === 'channel'
    ? `${activeChannel?.description || 'Active chat forum'}`
    : `${activeChar?.tagline || 'Direct message'}`;

  return (
    <div className="flex flex-col h-full bg-[#1A1C23] text-[#E5E9F0]">
      {/* Jetchat Header */}
      <div className="px-4 py-3 bg-[#121318] border-b border-[#2E3440] flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          {/* Hamburger Icon */}
          <button 
            onClick={onOpenDrawer}
            className="p-1.5 hover:bg-[#2E3440] rounded text-gray-400 hover:text-white transition-colors"
          >
            <div className="w-5 h-0.5 bg-current rounded mb-1" />
            <div className="w-5 h-0.5 bg-current rounded mb-1" />
            <div className="w-5 h-0.5 bg-current rounded" />
          </button>

          <div className="flex items-center gap-2">
            {activeTarget.type === 'dm' && activeChar && (
              <div className="w-8 h-8 rounded-full bg-[#2E3440] flex items-center justify-center shrink-0 overflow-hidden select-none border border-white/10 shadow ring-1 ring-white/5">
                {activeChar.avatar.startsWith('http') ? (
                  <img
                    src={activeChar.avatar}
                    alt={activeChar.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover shrink-0"
                  />
                ) : (
                  <span className="text-xs">{activeChar.avatar}</span>
                )}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">{activeHeaderTitle}</span>
                {activeTarget.type === 'dm' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block animate-pulse" />
                )}
              </div>
              <p className="text-[10px] text-gray-400 select-none overflow-hidden max-w-[200px] truncate leading-tight">
                {activeHeaderSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Technical quick lab settings button */}
        <button
          onClick={onOpenLabs}
          className="p-2 hover:bg-[#2E3440] rounded-full text-[#76B900] flex items-center justify-center transition-colors"
          title="Inference Labs Settings"
        >
          <Cpu className="w-4 h-4" />
        </button>
      </div>

      {/* Conversational Candy.ai inspired Interactive Mode Selector */}
      {activeTarget.type === 'dm' && activeChar && (
        <div className="bg-[#121318]/70 px-4 py-2 border-b border-[#2E3440] flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 backdrop-blur-md select-none">
          <div className="flex items-center gap-2">
            <span className="text-pink-400 animate-pulse text-xs">✨</span>
            <span className="font-bold text-[11px] text-white uppercase tracking-wider">Bonding Mode:</span>
            <span className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-full capitalize font-semibold">
              {activeChar.conversationalMode || 'normal'}
            </span>
          </div>

          <div className="flex bg-[#121318]/90 p-0.5 rounded-lg border border-[#2E3440] gap-0.5 w-full md:w-auto overflow-x-auto">
            {(['normal', 'flirt', 'roleplay'] as const).map((mode) => {
              const isSel = (activeChar.conversationalMode || 'normal') === mode;
              const icons = { normal: '💬', flirt: '💖', roleplay: '🎭' };
              const titles = { normal: 'Normal', flirt: 'Flirt Mode', roleplay: 'Roleplay' };
              
              return (
                <button
                  key={mode}
                  onClick={() => onChangeMode && onChangeMode(activeChar.id, mode)}
                  className={`flex-1 md:flex-initial px-3 py-1 rounded text-[10px] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    isSel
                      ? 'bg-gradient-to-r from-pink-600 to-indigo-600 font-bold text-white shadow-md shadow-pink-500/15 scale-102'
                      : 'hover:bg-[#1E222B] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>{icons[mode]}</span>
                  <span>{titles[mode]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#121318]/20 rounded-2xl m-4 border border-[#2E3440]/30">
            <div className="w-12 h-12 rounded-full bg-[#2E3440]/80 flex items-center justify-center text-2xl mb-3 shadow">
              🚀
            </div>
            <h4 className="text-white font-bold text-sm mb-1">Android Jetchat Node Ready</h4>
            <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed">
              Start chatting below! All queries can execute custom hyperpacket temperature parameters with real-time feedback.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.senderId === 'user';
            
            return (
              <div
                key={m.id}
                className={`flex gap-3 leading-relaxed max-w-[90%] ${
                  isUser ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                {/* Visual Avatar */}
                <div className="w-9 h-9 rounded-xl bg-[#2E3440] flex items-center justify-center text-base shrink-0 select-none overflow-hidden shadow ring-1 ring-white/10">
                  {isUser ? (
                    '👤'
                  ) : m.avatar.startsWith('http') ? (
                    <img
                      src={m.avatar}
                      alt={m.senderName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover shrink-0"
                    />
                  ) : (
                    m.avatar
                  )}
                </div>

                {/* Message Box */}
                <div className="flex flex-col">
                  {/* Sender Specs */}
                  <div className="flex items-center gap-1.5 mb-1 justify-starting">
                    <span className="font-bold text-[11px] text-white tracking-wide">
                      {m.senderName}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {m.timestamp}
                    </span>
                  </div>

                  {/* Dynamic Speech bubble */}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-gradient-to-br from-indigo-700 to-indigo-800 text-white rounded-tr-none shadow-sm'
                        : 'bg-[#1E222B] text-gray-200 border border-[#2E3440] rounded-tl-none shadow-sm'
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.photoUrl && (
                    <div className="mt-2 max-w-[220px] rounded-xl overflow-hidden border border-[#2E3440] shadow-md bg-black/40">
                      <img
                        src={m.photoUrl}
                        alt="Shared session capture"
                        className="w-full h-auto object-cover hover:scale-103 transition-transform duration-300 cursor-zoom-in"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {!isUser && m.senderId !== 'system' && m.senderId !== 'error' && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 select-none">
                      {/* Swipe arrow controls and active indicator */}
                      <div className="flex items-center bg-[#121318]/60 border border-[#2E3440] rounded-lg px-2 py-0.5 text-[9px] font-mono gap-1.5 shadow-sm text-gray-400">
                        <button
                          type="button"
                          disabled={(m.activeAlternativeIndex || 0) === 0 || isGenerating}
                          onClick={() => onPrevAlternative && onPrevAlternative(m.id)}
                          className="hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer p-0.5 transition-colors"
                          title="Previous alternative response"
                        >
                          ◀
                        </button>
                        <span className="text-gray-300 font-sans">
                          {((m.activeAlternativeIndex || 0) + 1)} / {((m.alternatives?.length) || 1)}
                        </span>
                        <button
                          type="button"
                          disabled={isGenerating}
                          onClick={() => onNextAlternative && onNextAlternative(m.id)}
                          className="hover:text-white cursor-pointer p-0.5 transition-colors"
                          title="Swipe next alternative response"
                        >
                          ▶
                        </button>
                      </div>

                      {/* Quick 1-4 Star Rating */}
                      <div className="flex items-center gap-0.5 bg-[#121318]/60 border border-[#2E3440] rounded-lg px-2 py-0.5 text-[9px] shadow-sm text-gray-400">
                        <span className="text-gray-500 mr-1.5 font-sans">Rate:</span>
                        {[1, 2, 3, 4].map((star) => {
                          const rated = m.rating && m.rating >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => onRateMessage && onRateMessage(m.id, star)}
                              className={`transition-all hover:scale-115 cursor-pointer leading-none px-0.5 text-xs ${
                                rated ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-500'
                              }`}
                              title={`Rate ${star} star`}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interactive Inference Metadata Badge */}
                  {!isUser && m.modelUsed && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 font-mono text-[9px] text-[#8F95A3]">
                      <span className={`px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                        m.inferenceSource === 'nvidia-nim' 
                          ? 'bg-[#76B900]/10 border-[#76B900]/30 text-[#8F95A3]'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}>
                        <Cpu className="w-2.5 h-2.5" />
                        <span>Source: {m.inferenceSource === 'nvidia-nim' ? 'NVIDIA NIM' : 'Gemini Fallback'}</span>
                      </span>
                      {m.latencyMs && (
                        <span className="text-gray-500">
                          ({m.latencyMs}ms)
                        </span>
                      )}
                      <span className="text-gray-600 truncate max-w-[120px]" title={m.modelUsed}>
                        {m.modelUsed.split('/').pop()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Custom Loading State */}
        {isGenerating && (
          <div className="flex gap-3 leading-relaxed self-start max-w-[80%]">
            <div className="w-9 h-9 rounded-xl bg-[#2E3440] flex items-center justify-center text-base shrink-0 select-none animate-pulse">
              🎮
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] text-gray-400 tracking-wide">
                Typing...
              </span>
              <div className="bg-[#1E222B] text-gray-300 rounded-2xl rounded-tl-none border border-gray-800 px-4 py-2.5 text-xs mt-1">
                <div className="flex items-center gap-1.5 h-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#76B900] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#76B900] animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#76B900] animate-bounce delay-200" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Jetchat Suggestions Box */}
      <div className="px-4 py-1.5 bg-[#121318]/30 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-t border-[#121318]/50 shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-yellow-500 shrink-0 select-none animate-pulse" />
        <div className="flex gap-1.5 py-0.5 items-center">
          {activeTarget.type === 'dm' && activeChar && (
            <button
              type="button"
              onClick={onRequestPhoto}
              disabled={isGenerating}
              className="px-3 py-1 rounded-full text-[10px] bg-gradient-to-r from-pink-600/20 to-indigo-600/20 hover:from-pink-600/35 hover:to-indigo-600/35 text-pink-300 font-sans border border-pink-500/30 font-semibold whitespace-nowrap transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
            >
              <span>📸 Request Selfie / Photo</span>
            </button>
          )}

          {dynamicChipList.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(chip)}
              disabled={isGenerating}
              className="px-3 py-1 rounded-full text-[10px] bg-[#1E222B] hover:bg-[#20242E] text-slate-300 font-sans border border-[#2E3440] whitespace-nowrap transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Slide-Up Photo Attachment Exchange Selection Cabinet */}
      {photoMenuOpen && activeTarget.type === 'dm' && activeChar && (
        <div className="px-4 py-3 bg-[#121318] border-t border-[#2E3440] flex flex-col gap-2 shrink-0 select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-pink-400 font-bold tracking-wider uppercase flex items-center gap-1">
              ✨ SELECT PHOTO ATTACHMENT TO SEND & ROLEPLAY
            </span>
            <button
              type="button"
              onClick={() => setPhotoMenuOpen(false)}
              className="text-[9px] text-gray-500 hover:text-gray-300 font-bold tracking-wide"
            >
              [CLOSE ×]
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'gym', label: '🏋️‍♂️ Gym Selfie', thumb: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=120&h=120' },
              { id: 'cozy', label: '☕ Desk Study', thumb: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=120&h=120' },
              { id: 'sunset', label: '🌅 Sunset Walk', thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=120&h=120' },
              { id: 'puppy', label: '🐶 Soft Puppy', thumb: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=120&h=120' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (onSendPhotoExchange) {
                    onSendPhotoExchange(p.id);
                  }
                  setPhotoMenuOpen(false);
                }}
                className="flex flex-col items-center bg-[#1A1C30]/50 hover:bg-[#20233D]/70 rounded-lg p-1.5 border border-[#2E3440] hover:border-pink-500/20 transition-all group cursor-pointer"
              >
                <img
                  src={p.thumb}
                  alt={p.label}
                  className="w-full h-11 object-cover rounded mb-1 border border-white/5 group-hover:scale-102 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[8px] font-sans font-medium text-slate-300 truncate w-full text-center">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Jetchat Input box */}
      <div className="p-3 bg-[#121318] border-t border-[#2E3440] md:p-4 pb-4 select-none shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          {/* Quick tool buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                photoMenuOpen ? 'bg-pink-600/10 text-pink-400' : 'hover:bg-[#1E222B] text-gray-500 hover:text-white'
              }`}
              title="Add attachment / photo exchange"
              onClick={() => {
                if (activeTarget.type !== 'dm') {
                  handleChipClick('Attached code logs...');
                } else {
                  setPhotoMenuOpen(!photoMenuOpen);
                }
              }}
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 hover:bg-[#1E222B] rounded-full text-gray-500 hover:text-white transition-colors cursor-pointer"
              title="Add emoji expression"
              onClick={() => handleChipClick('Express affection')}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isGenerating}
            placeholder={
              activeTarget.type === 'channel'
                ? `Message ${activeHeaderTitle}...`
                : `Chat privately with ${activeChar?.name}...`
            }
            className="flex-1 bg-[#1A1C30] border border-[#2E3440] placeholder-gray-600 rounded-full py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[#76B900] shadow-inner"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="w-10 h-10 select-none rounded-full bg-[#76B900] hover:bg-[#8CD000] text-gray-950 flex items-center justify-center font-bold shadow-md transition-all disabled:opacity-30 self-center"
          >
            <Send className="w-4 h-4 font-bold" />
          </button>
        </form>
      </div>
    </div>
  );
}
