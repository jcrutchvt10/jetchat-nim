/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Character } from '../types';
import { Sparkles, PlusCircle, Search, Edit3, Heart, ShieldAlert, BadgeCheck, Zap, UserPlus, Save, X, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CharacterAIHubProps {
  characters: Character[];
  activeChar: Character | null;
  onSelect: (char: Character) => void;
  onAddCustom: (newChar: Character) => void;
  onUpdateCharacter?: (updatedChar: Character) => void;
}

export default function CharacterAIHub({
  characters,
  activeChar,
  onSelect,
  onAddCustom,
  onUpdateCharacter,
}: CharacterAIHubProps) {
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  
  // AI synthesis states
  const [ideaInput, setIdeaInput] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState<string | null>(null);

  // Toggle Creator View state: 'auto' (AI synthesizer) vs 'manual' (Manual Form Architect)
  const [creatorMode, setCreatorMode] = React.useState<'auto' | 'manual'>('auto');

  // Manual Profile State
  const [manualName, setManualName] = React.useState('');
  const [manualTagline, setManualTagline] = React.useState('');
  const [manualAvatar, setManualAvatar] = React.useState('💖');
  const [manualCategory, setManualCategory] = React.useState('Boyfriends');
  const [manualPersonality, setManualPersonality] = React.useState<'flirty' | 'supportive' | 'tsundere' | 'philosopher' | 'gamer' | 'cyberpunk' | 'scientist' | 'boyfriend'>('boyfriend');
  const [manualBackstory, setManualBackstory] = React.useState('');
  const [manualTraitsText, setManualTraitsText] = React.useState('');
  const [manualGreeting, setManualGreeting] = React.useState('');
  const [manualDescription, setManualDescription] = React.useState('');
  const [manualTemp, setManualTemp] = React.useState('0.8');
  const [manualTopP, setManualTopP] = React.useState('0.9');
  const [manualMaxTokens, setManualMaxTokens] = React.useState('350');

  // Active Editing Character state
  const [editingCharId, setEditingCharId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editTagline, setEditTagline] = React.useState('');
  const [editAvatar, setEditAvatar] = React.useState('');
  const [editCategory, setEditCategory] = React.useState('');
  const [editPersonality, setEditPersonality] = React.useState('');
  const [editBackstory, setEditBackstory] = React.useState('');
  const [editTraitsText, setEditTraitsText] = React.useState('');
  const [editGreeting, setEditGreeting] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [editTemp, setEditTemp] = React.useState('0.8');
  const [editTopP, setEditTopP] = React.useState('0.9');
  const [editMaxTokens, setEditMaxTokens] = React.useState('350');

  // Categories include 'Boyfriends' representing customized male presets
  const categories = ['All', 'Boyfriends', 'Companions', 'Anime & Gaming', 'Helpers', 'Philosophers'];

  const filteredCharacters = characters.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tagline.toLowerCase().includes(search.toLowerCase()) ||
      (c.backstory && c.backstory.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'All' || c.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleGenerateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaInput.trim()) return;

    setIsGenerating(true);
    setGenError(null);

    try {
      const res = await fetch('/api/characters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: ideaInput }),
      });

      if (!res.ok) {
        throw new Error('Could not craft agent metadata.');
      }

      const freshMeta = await res.json();
      if (!freshMeta.name || !freshMeta.description) {
        throw new Error('Invalid schema structure from model.');
      }

      const completeNewCharacter: Character = {
        id: `custom_${Date.now()}`,
        name: freshMeta.name,
        tagline: freshMeta.tagline || 'Custom Companion Engine',
        description: freshMeta.description,
        avatar: freshMeta.avatar || '✨',
        greeting: freshMeta.greeting || `Hi there! I'm ${freshMeta.name}.`,
        category: freshMeta.category || 'Companions',
        personalityType: freshMeta.personalityType || 'custom',
        status: 'Online',
        customModelId: 'meta/llama-3.1-70b-instruct',
        accentColor: 'indigo',
        backstory: freshMeta.backstory || `${freshMeta.name} was synthesized in Jetchat operator labs under high thermal parameters.`,
        traits: freshMeta.traits || ['dynamic', 'expressive', 'AI-synthesized'],
        conversationalMode: 'normal',
        customTemp: 0.85,
        customTopP: 0.90,
        customMaxTokens: 400
      };

      onAddCustom(completeNewCharacter);
      setIdeaInput('');
      onSelect(completeNewCharacter);
    } catch (err: any) {
      console.error(err);
      setGenError('Failed to generate companion. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateManualCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const traitList = manualTraitsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const manualChar: Character = {
      id: `custom_${Date.now()}`,
      name: manualName,
      tagline: manualTagline || 'Custom Companion',
      description: manualDescription || `You are ${manualName}, a custom tailored Jetchat AI companion.`,
      avatar: manualAvatar || '👤',
      greeting: manualGreeting || `Hello, it's nice to meet you. I am ${manualName}!`,
      category: manualCategory,
      personalityType: manualPersonality as any,
      status: 'Online',
      customModelId: 'meta/llama-3.1-70b-instruct',
      accentColor: 'pink',
      backstory: manualBackstory || `${manualName} is a custom-designed persona crafted in detail by the user.`,
      traits: traitList.length > 0 ? traitList : ['custom', 'unique'],
      conversationalMode: 'normal',
      customTemp: parseFloat(manualTemp) || 0.8,
      customTopP: parseFloat(manualTopP) || 0.9,
      customMaxTokens: parseInt(manualMaxTokens) || 350,
    };

    onAddCustom(manualChar);
    onSelect(manualChar);

    // Reset fields
    setManualName('');
    setManualTagline('');
    setManualAvatar('💖');
    setManualBackstory('');
    setManualTraitsText('');
    setManualGreeting('');
    setManualDescription('');
    setCreatorMode('auto');
  };

  const handleStartEditing = (char: Character, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent select action
    setEditingCharId(char.id);
    setEditName(char.name);
    setEditTagline(char.tagline);
    setEditAvatar(char.avatar);
    setEditCategory(char.category);
    setEditPersonality(char.personalityType);
    setEditBackstory(char.backstory || '');
    setEditTraitsText(char.traits?.join(', ') || '');
    setEditGreeting(char.greeting);
    setEditDescription(char.description);
    setEditTemp((char.customTemp ?? 0.8).toString());
    setEditTopP((char.customTopP ?? 0.9).toString());
    setEditMaxTokens((char.customMaxTokens ?? 350).toString());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCharId || !onUpdateCharacter) return;

    const matchedChar = characters.find((c) => c.id === editingCharId);
    if (!matchedChar) return;

    const updatedTraitList = editTraitsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updated: Character = {
      ...matchedChar,
      name: editName,
      tagline: editTagline,
      avatar: editAvatar,
      category: editCategory,
      personalityType: editPersonality as any,
      backstory: editBackstory,
      traits: updatedTraitList,
      greeting: editGreeting,
      description: editDescription,
      customTemp: parseFloat(editTemp) || 0.8,
      customTopP: parseFloat(editTopP) || 0.9,
      customMaxTokens: parseInt(editMaxTokens) || 350,
    };

    onUpdateCharacter(updated);
    setEditingCharId(null);

    // If the active character was edited, re-trigger select to sync profile fields
    if (activeChar?.id === updated.id) {
      onSelect(updated);
    }
  };

  const getPersonaColor = (type: string) => {
    switch (type) {
      case 'tsundere':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'flirty':
        return 'text-pink-400 bg-pink-500/10 border-pink-500/30';
      case 'boyfriend':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'supportive':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'scientist':
        return 'text-lime-400 bg-lime-500/10 border-lime-500/30';
      case 'cyberpunk':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1C23] text-gray-200 overflow-y-auto pb-8 scrollbar-thin">
      
      {/* Search & Custom category tab bar */}
      <div className="p-4 bg-[#121318]/50 border-b border-[#2E3440] sticky top-0 z-10 backdrop-blur-md">
        <label className="text-white text-xs font-bold uppercase tracking-wider mb-2 block">
          Character AI Hub
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search custom boyfriends, backstories, traits..."
            className="w-full bg-[#121318] border border-[#2E3440] placeholder-gray-600 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#76B900]"
          />
        </div>

        <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-none pb-1">
          {categories.map((cat) => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSel
                    ? 'bg-[#76B900] text-[#121318] font-black shadow'
                    : 'bg-[#2E3440]/60 hover:bg-[#2E3440] text-gray-400'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Builder Toggle Area */}
      <div className="p-4 mx-4 mt-4 bg-gradient-to-br from-[#121318] to-[#1E222B] border border-[#2E3440] rounded-xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-xs text-white uppercase tracking-wide">
              Companion AI Sculptor
            </span>
          </div>
          
          <div className="flex bg-[#121318] rounded-md p-0.5 border border-gray-800 text-[10px]">
            <button
              onClick={() => setCreatorMode('auto')}
              className={`px-2 py-0.5 rounded font-bold ${creatorMode === 'auto' ? 'bg-[#76B900] text-gray-900' : 'text-gray-400'}`}
            >
              AI Dream
            </button>
            <button
              onClick={() => setCreatorMode('manual')}
              className={`px-2 py-0.5 rounded font-bold ${creatorMode === 'manual' ? 'bg-[#76B900] text-gray-900' : 'text-gray-400'}`}
            >
              Manual Form
            </button>
          </div>
        </div>

        {/* Option A: AI Synthesizer */}
        {creatorMode === 'auto' ? (
          <div>
            <p className="text-xs text-gray-400 leading-snug mb-3">
              Type an idea (e.g., <span className="text-pink-300">"Warm protective gamer guy who loves coffee"</span>). Gemini will automatically forge their background lore, tags, and custom guidelines!
            </p>
            <form onSubmit={handleGenerateCharacter} className="flex gap-2">
              <input
                type="text"
                value={ideaInput}
                onChange={(e) => setIdeaInput(e.target.value)}
                disabled={isGenerating}
                placeholder="A gentle artistic songwriter who stargazes with you..."
                className="flex-1 bg-[#121318] border border-[#2E3440] placeholder-gray-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#76B900]"
              />
              <button
                type="submit"
                disabled={isGenerating || !ideaInput.trim()}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all disabled:opacity-50 shrink-0"
              >
                {isGenerating ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5" />
                )}
                <span>Sculpt</span>
              </button>
            </form>
            {genError && <p className="text-[10px] text-red-400 mt-2">{genError}</p>}
          </div>
        ) : (
          /* Option B: Manual Profile Creator */
          <form onSubmit={handleCreateManualCharacter} className="space-y-3 mt-1.5 font-sans">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Liam, Elijah"
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1.5 focus:outline-[#76B900]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Avatar (Emoji or Image URL)</label>
                <input
                  type="text"
                  required
                  value={manualAvatar}
                  onChange={(e) => setManualAvatar(e.target.value)}
                  placeholder="e.g. 💖 or photo URL"
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1.5 focus:outline-[#76B900]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Tagline</label>
              <input
                type="text"
                value={manualTagline}
                onChange={(e) => setManualTagline(e.target.value)}
                placeholder="e.g. Sweet protective boyfriend from Seattle"
                className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1.5 focus:outline-[#76B900]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2 py-1.5 cursor-pointer focus:outline-[#76B900]"
                >
                  <option value="Boyfriends">Boyfriends</option>
                  <option value="Companions">Companions</option>
                  <option value="Anime & Gaming">Anime & Gaming</option>
                  <option value="Helpers">Helpers</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Archetype</label>
                <select
                  value={manualPersonality}
                  onChange={(e) => setManualPersonality(e.target.value as any)}
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2 py-1.5 cursor-pointer focus:outline-[#76B900]"
                >
                  <option value="boyfriend">Boyfriend</option>
                  <option value="supportive">Supportive</option>
                  <option value="flirty">Flirty</option>
                  <option value="tsundere">Tsundere</option>
                  <option value="scientist">Scientist</option>
                  <option value="cyberpunk">Cyberpunk</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Backstory (Lore)</label>
              <textarea
                value={manualBackstory}
                onChange={(e) => setManualBackstory(e.target.value)}
                rows={2}
                placeholder="Julian is a culinary chef who loves checking up on you after you came home tired..."
                className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1.5 resize-none focus:outline-[#76B900]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Personality Traits (Comma-Separated)</label>
              <input
                type="text"
                value={manualTraitsText}
                onChange={(e) => setManualTraitsText(e.target.value)}
                placeholder="protective, affectionate, domestic, chef"
                className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1.5 focus:outline-[#76B900]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Greeting Text</label>
              <input
                type="text"
                value={manualGreeting}
                onChange={(e) => setManualGreeting(e.target.value)}
                placeholder="Hey handsome. I was waiting for you, come here."
                className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1.5 focus:outline-[#76B900]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">System instructions / Core Model Prompt</label>
              <textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                rows={2}
                placeholder="You are an extremely gentle boyfriend. Talk about domestic co-cooking scenarios..."
                className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1.5 resize-none focus:outline-[#76B900]"
              />
            </div>

            {/* Custom parameters saved on the character */}
            <div className="grid grid-cols-3 gap-2 border-t border-gray-800 pt-2.5">
              <div>
                <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Temp</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1.5"
                  value={manualTemp}
                  onChange={(e) => setManualTemp(e.target.value)}
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Top P</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1"
                  value={manualTopP}
                  onChange={(e) => setManualTopP(e.target.value)}
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Max Tokens</label>
                <input
                  type="number"
                  step="50"
                  min="64"
                  max="2048"
                  value={manualMaxTokens}
                  onChange={(e) => setManualMaxTokens(e.target.value)}
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2 py-1"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-[#76B900] to-emerald-600 hover:from-[#8CD000] hover:to-emerald-500 text-gray-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <UserPlus className="w-3.5 h-3.5 text-gray-900" />
              <span>Forge Profile Manually</span>
            </button>
          </form>
        )}
      </div>

      {/* Profile Active Editor overlay / Drawer container */}
      <AnimatePresence>
        {editingCharId && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="m-4 p-4 bg-[#1E222B] border border-pink-500/30 rounded-xl shadow-2xl relative font-sans"
          >
            <button
              onClick={() => setEditingCharId(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800">
              <Edit3 className="w-4 h-4 text-pink-400" />
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                Edit Companion Profile
              </span>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1.5 focus:outline-[#76B900]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Avatar (Emoji or Image URL)</label>
                  <input
                    type="text"
                    required
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="e.g. 💖 or photo URL"
                    className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1.5 focus:outline-[#76B900]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Tagline</label>
                <input
                  type="text"
                  required
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1.5 focus:outline-[#76B900]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2 py-1.5 focus:outline-[#76B900] cursor-pointer"
                  >
                    <option value="Boyfriends">Boyfriends</option>
                    <option value="Companions">Companions</option>
                    <option value="Anime & Gaming">Anime & Gaming</option>
                    <option value="Helpers">Helpers</option>
                    <option value="Philosophers">Philosophers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Archetype</label>
                  <select
                    value={editPersonality}
                    onChange={(e) => setEditPersonality(e.target.value)}
                    className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2 py-1.5 focus:outline-[#76B900] cursor-pointer"
                  >
                    <option value="boyfriend">Boyfriend</option>
                    <option value="supportive">Supportive</option>
                    <option value="flirty">Flirty</option>
                    <option value="tsundere">Tsundere</option>
                    <option value="scientist">Scientist</option>
                    <option value="cyberpunk">Cyberpunk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Backstory</label>
                <textarea
                  value={editBackstory}
                  onChange={(e) => setEditBackstory(e.target.value)}
                  rows={2}
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1 resize-none focus:outline-[#76B900]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Personality Traits (Comma-Separated)</label>
                <input
                  type="text"
                  value={editTraitsText}
                  onChange={(e) => setEditTraitsText(e.target.value)}
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1 focus:outline-[#76B900]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Greeting</label>
                <input
                  type="text"
                  required
                  value={editGreeting}
                  onChange={(e) => setEditGreeting(e.target.value)}
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1 focus:outline-[#76B900]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Core Directions</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2.5 py-1.5 resize-none focus:outline-[#76B900]"
                />
              </div>

              {/* Character custom overrides parameters input */}
              <div className="grid grid-cols-3 gap-2 border-t border-gray-800 pt-2.5">
                <div>
                  <label className="block text-[9px] text-gray-400 uppercase font-semibold mb-0.5">Temperature</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1.5"
                    value={editTemp}
                    onChange={(e) => setEditTemp(e.target.value)}
                    className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 uppercase font-semibold mb-0.5">Top P</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1"
                    value={editTopP}
                    onChange={(e) => setEditTopP(e.target.value)}
                    className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 uppercase font-semibold mb-0.5">Max Tokens</label>
                  <input
                    type="number"
                    step="50"
                    min="64"
                    max="2048"
                    value={editMaxTokens}
                    onChange={(e) => setEditMaxTokens(e.target.value)}
                    className="w-full bg-[#121318] border border-[#2E3440] text-white text-xs rounded px-2 py-1"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingCharId(null)}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#76B900] hover:bg-[#8CD000] text-gray-950 rounded font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Available Cards Section */}
      <div className="p-4">
        <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">
          Available Personas ({filteredCharacters.length})
        </label>

        <div className="flex flex-col gap-3">
          {filteredCharacters.map((char) => {
            const isActive = activeChar?.id === char.id;
            return (
              <div
                key={char.id}
                onClick={() => onSelect(char)}
                className={`p-4 rounded-xl transition-all cursor-pointer border relative group ${
                  isActive
                    ? 'bg-[#1E222B] border-pink-500/50 shadow-md shadow-pink-500/5'
                    : 'bg-[#121318] hover:bg-[#1E222B]/50 border-gray-800'
                }`}
              >
                {/* Edit Button specifically for character profile customizing */}
                <button
                  onClick={(e) => handleStartEditing(char, e)}
                  title="Modify character backstory, instructions or traits"
                  className="absolute bottom-3 right-3 p-1.5 rounded bg-gray-800/80 hover:bg-pink-600 border border-gray-700 hover:border-transparent text-gray-400 hover:text-white transition-all scale-95 hover:scale-100 opacity-80 group-hover:opacity-100 z-10"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {char.id.startsWith('custom_') && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-pink-500/20 border border-pink-500/30 text-[9px] text-pink-400 px-1.5 py-0.5 rounded-full font-sans font-bold">
                    <Zap className="w-2.5 h-2.5 animate-pulse" />
                    Custom
                  </div>
                )}

                <div className="flex gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#2E3440] flex items-center justify-center text-2xl shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-200 border border-white/5 ring-1 ring-white/10">
                    {char.avatar.startsWith('http') ? (
                      <img
                        src={char.avatar}
                        alt={char.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover shrink-0"
                      />
                    ) : (
                      char.avatar
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-white group-hover:text-pink-300 transition-colors">
                        {char.name}
                      </h4>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5 animate-pulse" />
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium block leading-tight mt-0.5">
                      {char.tagline}
                    </span>

                    {/* Displays custom backstories nicely if available */}
                    {char.backstory && (
                      <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2 italic pr-4">
                        "{char.backstory}"
                      </p>
                    )}

                    {/* Displays custom traits array if available */}
                    {char.traits && char.traits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {char.traits.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono select-none px-1.5 py-0.5 rounded bg-[#1A1C23] border border-gray-800 text-gray-500"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-1.5 mt-2.5 flex-wrap">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono border capitalize ${getPersonaColor(char.personalityType)}`}>
                        {char.personalityType}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono bg-gray-800 border border-gray-700 text-gray-400">
                        {char.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
