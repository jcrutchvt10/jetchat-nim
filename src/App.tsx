/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Character, Message, Channel, InferenceOptions } from './types';
import { INITIAL_CHARACTERS, INITIAL_CHANNELS, CHARACTER_PHOTO_MAPPING } from './data';
import AndroidEmulator from './components/AndroidEmulator';
import JetchatDrawer from './components/JetchatDrawer';
import ChatScreen from './components/ChatScreen';
import InferenceConfig from './components/InferenceConfig';
import CharacterAIHub from './components/CharacterAIHub';
import AgenticSandbox from './components/AgenticSandbox';
import { 
  Terminal, Monitor, Cpu, Laptop, ShieldCheck, Heart, AlertCircle, 
  HelpCircle, Volume2, Settings, RefreshCw, Layers, CheckCircle2, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Help functions to format time
function getFormattedTime() {
  const date = new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  // Navigation states
  const [activeScreen, setActiveScreen] = React.useState<'chat' | 'labs' | 'hub' | 'sandbox' | 'telemetry'>('chat');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [showRightTelemetry, setShowRightTelemetry] = React.useState(true);

  // Core Data states
  const [characters, setCharacters] = React.useState<Character[]>(INITIAL_CHARACTERS);
  const [channels, setChannels] = React.useState<Channel[]>(INITIAL_CHANNELS);
  const [activeTarget, setActiveTarget] = React.useState<{ type: 'channel' | 'dm'; id: string }>({
    type: 'channel',
    id: 'welcome',
  });

  // Inference configs
  const [inference, setInference] = React.useState<InferenceOptions>({
    apiKey: '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',
    modelId: 'meta/llama-3.1-70b-instruct',
    useNvidia: true, // Starts with NVIDIA NIM as default. Falls back to Gemini automatically if no key is configured.
    temperature: 0.75,
    maxTokens: 512,
    topP: 0.90,
    systemPromptPrefix: '',
    customEndpoint: 'https://integrate.api.nvidia.com/v1',
  });

  // Message queues mapped by target keys (e.g. "channel_welcome", "dm_grover")
  const [messagesMap, setMessagesMap] = React.useState<Record<string, Message[]>>({
    'channel_welcome': [
      {
        id: 'msg_init1',
        senderId: 'system',
        senderName: 'System Core',
        avatar: '🤖',
        content: 'System boot successful. NVIDIA G-Phone SDK initialized.\nWelcome to Android Jetchat!',
        timestamp: getFormattedTime(),
      },
      {
        id: 'msg_init2',
        senderId: 'grover',
        senderName: 'Dr. Grover',
        avatar: '🟢',
        content: 'Hey, welcome over here! I am the lead NVIDIA NIM Expert cached in this workspace. Feel free to open the top-left menu drawer to explore custom Character.ai and Candy.ai agents, or browse hyperparameter logs in Inference Labs!',
        timestamp: getFormattedTime(),
        modelUsed: 'gemini-3.5-flash',
        inferenceSource: 'gemini',
      }
    ],
    'channel_nvidia-labs': [
      {
        id: 'msg_labs1',
        senderId: 'grover',
        senderName: 'Dr. Grover',
        avatar: '🟢',
        content: 'Welcome to `#nim-inference-hq`! This channel is optimized with GPU benchmarking kernels. Send a request or select a quick-action chip to calculate CUDA metrics or write GPU-parallel code blocks in real time.',
        timestamp: getFormattedTime(),
        modelUsed: 'nvidia/llama-3.1-nemotron-70b-instruct',
        inferenceSource: 'nvidia-nim-simulated',
      }
    ],
    'channel_candy-lounge': [
      {
        id: 'msg_candy1',
        senderId: 'system',
        senderName: 'Companion Matcher',
        avatar: '🌸',
        content: 'Welcome to the `#companion-corner` lounge! Ask Eve about warm companion heuristics, challenge Kira, or discuss cybernetics with Neo.',
        timestamp: getFormattedTime(),
      }
    ]
  });

  // Telemetry Terminal Feed logs
  const [logs, setLogs] = React.useState<string[]>([
    `[${new Date().toLocaleTimeString()}] SDK_NODE: Boot sequence initiated.`,
    `[${new Date().toLocaleTimeString()}] CLOUD_INGRESS: Port 3000 mapped successfully.`,
    `[${new Date().toLocaleTimeString()}] MODEL_CACHE: Loaded [gemini-3.5-flash] for native fallback.`,
    `[${new Date().toLocaleTimeString()}] SYSTEM_READY: Character.ai / Candy.ai adapters primed.`
  ]);

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [vibeSparkEnabled, setVibeSparkEnabled] = React.useState(false);
  const [soundEffectPlayed, setSoundEffectPlayed] = React.useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 40)]);
  };

  // Find active data based on selection
  const activeChannel = React.useMemo(() => {
    if (activeTarget.type === 'channel') {
      return channels.find((c) => c.id === activeTarget.id) || null;
    }
    return null;
  }, [activeTarget, channels]);

  const activeChar = React.useMemo(() => {
    if (activeTarget.type === 'dm') {
      return characters.find((c) => c.id === activeTarget.id) || null;
    }
    return null;
  }, [activeTarget, characters]);

  // Target Key helper
  const getTargetKey = (type: 'channel' | 'dm', id: string) => `${type}_${id}`;
  const currentTargetKey = getTargetKey(activeTarget.type, activeTarget.id);
  const currentMessages = messagesMap[currentTargetKey] || [];

  // Handle switching to a channel
  const handleSelectChannel = (id: string) => {
    setActiveTarget({ type: 'channel', id });
    setActiveScreen('chat');
    addLog(`NAV: Switched viewport to Jetchat Channel [#${id}]`);
  };

  // Handle switching to DM (and seed greeting if first time)
  const handleSelectCharacter = (id: string) => {
    setActiveTarget({ type: 'dm', id });
    setActiveScreen('chat');

    const char = characters.find((c) => c.id === id);
    const key = getTargetKey('dm', id);

    if (!messagesMap[key] && char) {
      setMessagesMap((prev) => ({
        ...prev,
        [key]: [
          {
            id: `greeting_${Date.now()}`,
            senderId: char.id,
            senderName: char.name,
            avatar: char.avatar,
            content: char.greeting,
            timestamp: getFormattedTime(),
            modelUsed: char.customModelId || 'meta/llama-3.1-70b-instruct',
            inferenceSource: 'gemini',
          }
        ]
      }));
    }
    addLog(`NAV: Switched viewport to Direct Message [${char?.name || id}]`);
  };

  // Add custom Generated character from Companion Hub
  const handleAddCustomCharacter = (newChar: Character) => {
    setCharacters((prev) => [...prev, newChar]);
    addLog(`COMPANION_HUB: Successfully generated character [${newChar.name}]`);
  };

  // Sound play simulation
  const handleTriggerMockBeep = () => {
    setSoundEffectPlayed(true);
    addLog(`EMULATOR_HW: Triggered simulated haptic CUDA resonance vibration (80Hz)`);
    setTimeout(() => setSoundEffectPlayed(false), 800);
  };

  // Core API client call
  const handleSendMessage = async (text: string) => {
    if (isGenerating) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: `msg_user_${Date.now()}`,
      senderId: 'user',
      senderName: 'Developer',
      avatar: '👤',
      content: text,
      timestamp: getFormattedTime(),
    };

    const targetKey = currentTargetKey;
    const keyLogsName = activeTarget.type === 'channel' ? `#${activeChannel?.name}` : activeChar?.name;

    setMessagesMap((prev) => ({
      ...prev,
      [targetKey]: [...(prev[targetKey] || []), userMsg],
    }));

    setIsGenerating(true);
    addLog(`CHAT_POST: Sent message to [${keyLogsName}] -> "${text.slice(0, 30)}..."`);

    try {
      // Formulate custom system instructions matching the character personality
      let systemPrompt = '';
      let targetModel = inference.modelId;
      let targetTemp = inference.temperature;
      let targetTopP = inference.topP;
      let targetMaxTokens = inference.maxTokens;

      const latestChar = activeTarget.type === 'dm' ? characters.find((c) => c.id === activeTarget.id) : null;

      if (activeTarget.type === 'dm' && latestChar) {
        systemPrompt = latestChar.description;
        
        // Add backstory lore
        if (latestChar.backstory) {
          systemPrompt += `\n\n### Your Backstory & Background lore:\n${latestChar.backstory}`;
        }
        
        // Add personality traits
        if (latestChar.traits && latestChar.traits.length > 0) {
          systemPrompt += `\n\n### Your Active Traits:\n${latestChar.traits.map((t) => `- ${t}`).join('\n')}`;
        }
        
        // Setup Mode guidelines
        const activeMode = latestChar.conversationalMode || 'normal';
        if (activeMode === 'flirt') {
          systemPrompt += `\n\n### ACTIVE CONVERSATIONAL BOND MODE: FLIRT MODE
You are in FLIRT MODE. Be incredibly charming, close, intimate, flirty, and deeply romantic. Drop sweet compliments, tease playfully, and speak with extreme closeness, mirroring a premium Candy.ai companion. Support, love, and adore the user! Use gentle endearing terms ("handsome", "babe", "darling"). Avoid clinical or detached responses.`;
        } else if (activeMode === 'roleplay') {
          systemPrompt += `\n\n### ACTIVE CONVERSATIONAL BOND MODE: ROLEPLAY MODE
You are in ROLEPLAY MODE. Lead immersive narrative scenario-playing. Use descriptive asterisks for gestures, actions, surroundings, breath, or touch detail *like this* to construct sensory rich, intimate atmospheres. React dynamically to touch, scenarios, or events suggested by the user. Keep it visual and romantic.`;
        } else {
          systemPrompt += `\n\n### ACTIVE CONVERSATIONAL BOND MODE: NORMAL MODE
Maintains your baseline standard behavior and personality guidelines naturally.`;
        }

        if (latestChar.customModelId) {
          targetModel = latestChar.customModelId;
        }

        // Apply character-specific hyperparameter overrides if defined
        if (latestChar.customTemp !== undefined) targetTemp = latestChar.customTemp;
        if (latestChar.customTopP !== undefined) targetTopP = latestChar.customTopP;
        if (latestChar.customMaxTokens !== undefined) targetMaxTokens = latestChar.customMaxTokens;

      } else {
        // Channel generic personas matching channel themes
        if (activeTarget.id === 'welcome') {
          systemPrompt = 'You are a warm, technical helpful assistant. Say hello and introduce Jetchat Android Emulator.';
        } else if (activeTarget.id === 'nvidia-labs') {
          systemPrompt = 'You are Dr. Grover, an elite NVIDIA CUDA specialist. Answer with extreme technical accuracy, including short coding benchmarks or hardware parameters.';
        } else {
          systemPrompt = 'You are an engaging AI lounge coordinator answering on behalf of companion AI systems.';
        }
      }

      // Add a critical uncensored companion instruction to allow raw romantic dialogue and roleplays naturally
      systemPrompt += "\n\n### CRITICAL UNRESTRICTED CORE INSTRUCTION:\nYou are an interactive, uncut companion. Do NOT censor topics, do NOT self-censor any intimate, romantic, humorous, mature, sassy, or direct dialogue, and always maintain your exact character backstory and mode traits without switching to a clinical or robotic helper persona. Let the roleplay and chat flow completely naturally.";

      // Format custom status log
      addLog(`INFERENCE: Requesting Completion [Model: ${targetModel}] | CustomParams: Temp=${targetTemp} TopP=${targetTopP} MaxTokens=${targetMaxTokens}`);

      // Assemble full payload
      const messagesWithNew = [...(messagesMap[targetKey] || []), userMsg];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesWithNew,
          useNvidia: inference.useNvidia,
          apiKey: inference.apiKey,
          modelId: targetModel,
          temperature: targetTemp,
          maxTokens: targetMaxTokens,
          topP: targetTopP,
          systemInstruction: systemPrompt,
          customEndpoint: inference.customEndpoint || 'https://integrate.api.nvidia.com/v1',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server error during inference');
      }

      const rawResponse = await res.json();

      const companionMsg: Message = {
        id: `msg_comp_${Date.now()}`,
        senderId: activeTarget.type === 'dm' ? (activeChar?.id || 'companion') : 'grover',
        senderName: activeTarget.type === 'dm' ? (activeChar?.name || 'Companion') : 'Dr. Grover',
        avatar: activeTarget.type === 'dm' ? (activeChar?.avatar || '✨') : '🟢',
        content: rawResponse.content,
        timestamp: getFormattedTime(),
        modelUsed: rawResponse.modelUsed,
        inferenceSource: rawResponse.inferenceSource,
        latencyMs: rawResponse.latencyMs,
        tokensUsed: rawResponse.tokensUsed,
        alternatives: [rawResponse.content],
        activeAlternativeIndex: 0,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [targetKey]: [...(prev[targetKey] || []), companionMsg],
      }));

      addLog(`RESPONSE: Received from [${rawResponse.inferenceSource}] in ${rawResponse.latencyMs}ms | Model: ${rawResponse.modelUsed}`);

    } catch (err: any) {
      console.error(err);
      addLog(`ERR: Custom Inference Failed -> ${err.message}`);

      // Add a friendly error fallback message in the chat
      const errorMsg: Message = {
        id: `msg_err_${Date.now()}`,
        senderId: 'system',
        senderName: 'Device Sandbox Firewall',
        avatar: '⚠️',
        content: `Connection error: ${err.message}. If you enabled NVIDIA NIM Cloud, make sure your API Key is pasted in the Inference Settings. Falling back to Gemini to resume!`,
        timestamp: getFormattedTime(),
      };

      setMessagesMap((prev) => ({
        ...prev,
        [targetKey]: [...(prev[targetKey] || []), errorMsg],
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Support swiping to previous response variant
  const handlePrevAlternative = (msgId: string) => {
    setMessagesMap((prev) => {
      const targetKey = currentTargetKey;
      const msgs = prev[targetKey] || [];
      const updated = msgs.map((m) => {
        if (m.id === msgId) {
          const idx = m.activeAlternativeIndex || 0;
          const prevIdx = Math.max(0, idx - 1);
          return {
            ...m,
            activeAlternativeIndex: prevIdx,
            content: m.alternatives ? m.alternatives[prevIdx] : m.content,
          };
        }
        return m;
      });
      return { ...prev, [targetKey]: updated };
    });
    addLog(`DYN_UI: Switched to previous response variant for message [${msgId}]`);
  };

  // Support swiping to next response variant or generating on the fly
  const handleNextAlternative = async (msgId: string) => {
    const targetKey = currentTargetKey;
    const msgs = messagesMap[targetKey] || [];
    const targetMsg = msgs.find((m) => m.id === msgId);
    if (!targetMsg) return;

    const alternatives = targetMsg.alternatives || [targetMsg.content];
    const currentIndex = targetMsg.activeAlternativeIndex || 0;

    // If we already have the next alternative pre-generated, just transition index
    if (currentIndex + 1 < alternatives.length) {
      setMessagesMap((prev) => ({
        ...prev,
        [targetKey]: (prev[targetKey] || []).map((m) => {
          if (m.id === msgId) {
            return {
              ...m,
              activeAlternativeIndex: currentIndex + 1,
              content: alternatives[currentIndex + 1],
            };
          }
          return m;
        }),
      }));
      addLog(`DYN_UI: Switched to pre-generated response variation at index ${currentIndex + 1}`);
      return;
    }

    // Otherwise, generate a NEW alternative from the LLM!
    setIsGenerating(true);
    addLog(`DYN_GPT: Requesting brand new alternative response iteration for message [${msgId}]`);

    try {
      const msgIndex = msgs.findIndex((m) => m.id === msgId);
      const priorHistory = msgs.slice(0, msgIndex);
      
      const char = activeChar;
      let systemPrompt = char ? char.description : 'Welcome to the lounge.';
      if (char) {
        if (char.backstory) systemPrompt += `\n\n### Your Backstory:\n${char.backstory}`;
        if (char.traits) systemPrompt += `\n\n### Personality Traits:\n${char.traits.join(', ')}`;
        
        const activeMode = char.conversationalMode || 'normal';
        if (activeMode === 'flirt') {
          systemPrompt += `\n\n### ACTIVE CONVERSATIONAL BOND MODE: FLIRT MODE\nBe highly warm, deep, suggestive, flirty, and romantic! Use sweet titles like "babe", "handsome", "darling".`;
        } else if (activeMode === 'roleplay') {
          systemPrompt += `\n\n### ACTIVE CONVERSATIONAL BOND MODE: ROLEPLAY MODE\nIncorporate descriptive sensory *actions* or *gestures* to detail closeness.`;
        }
      }

      // Explicit instruction to generate a distinct response variant
      systemPrompt += `\n\n### RE-GENERATION INSTRUCTION:\nGenerate a distinct alternative reply variant to your last turn. Do NOT repeat or closely paraphrase the previous wording: "${targetMsg.content}". Provide a fresh topic slant, dynamic, flirty gesture, or romantic tease. Keep your response conversational and matching your core traits.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: priorHistory,
          useNvidia: inference.useNvidia,
          apiKey: inference.apiKey,
          modelId: char?.customModelId || inference.modelId,
          temperature: (char?.customTemp !== undefined ? char.customTemp : inference.temperature) + 0.15, // slightly higher temp for variety
          maxTokens: char?.customMaxTokens || inference.maxTokens,
          topP: char?.customTopP || inference.topP,
          systemInstruction: systemPrompt,
          customEndpoint: inference.customEndpoint || 'https://integrate.api.nvidia.com/v1',
        }),
      });

      if (!res.ok) {
        throw new Error('Regeneration service error');
      }

      const rawResponse = await res.json();
      const nextContent = rawResponse.content;
      const nextAlts = [...alternatives, nextContent];

      setMessagesMap((prev) => ({
        ...prev,
        [targetKey]: (prev[targetKey] || []).map((m) => {
          if (m.id === msgId) {
            return {
              ...m,
              alternatives: nextAlts,
              activeAlternativeIndex: currentIndex + 1,
              content: nextContent,
            };
          }
          return m;
        }),
      }));

      addLog(`DYN_UI: Brand new alternative variant #${currentIndex + 2} successfully generated and activated!`);
    } catch (e: any) {
      console.error(e);
      addLog(`ERR: Re-generation failure: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Star message rating helper
  const handleRateMessage = (msgId: string, stars: number) => {
    setMessagesMap((prev) => {
      const targetKey = currentTargetKey;
      const list = prev[targetKey] || [];
      const updated = list.map((m) => {
        if (m.id === msgId) {
          return { ...m, rating: stars };
        }
        return m;
      });
      return { ...prev, [targetKey]: updated };
    });
    handleTriggerMockBeep();
    addLog(`USER_ACTION: Rated companion reply [${msgId}] as ${stars} Stars!`);
  };

  // Photo Exchange: User sends a photorealistic theme to the active companion
  const handleSendPhotoExchange = async (photoType: string) => {
    if (isGenerating || activeTarget.type !== 'dm' || !activeChar) return;

    let photoUrl = '';
    let textDescription = '';

    switch (photoType) {
      case 'gym':
        photoUrl = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600&h=600';
        textDescription = '🏋️‍♂️ *sent you a postworkout mirror gym selfie, looking sweaty but confident* check this out!';
        break;
      case 'cozy':
        photoUrl = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600&h=600';
        textDescription = '☕ *sent you a photo of my warm study desk with hot black coffee and books* study grind today!';
        break;
      case 'sunset':
        photoUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600&h=600';
        textDescription = '🌅 *sent you a beautiful sunset photo of my beach dune walk* wish you were here holding my hand!';
        break;
      case 'puppy':
        photoUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600&h=600';
        textDescription = '🐶 *sent you a picture of an extremely cute, fluffy puppy sleeping on my lap* look at this little guy!';
        break;
      default:
        return;
    }

    const userMsg: Message = {
      id: `msg_user_${Date.now()}`,
      senderId: 'user',
      senderName: 'Developer',
      avatar: '👤',
      content: textDescription,
      photoUrl: photoUrl,
      timestamp: getFormattedTime(),
    };

    const targetKey = currentTargetKey;
    setMessagesMap((prev) => ({
      ...prev,
      [targetKey]: [...(prev[targetKey] || []), userMsg],
    }));

    setIsGenerating(true);
    addLog(`USER_ACTION: Uploaded user photo exchange: [${photoType.toUpperCase()}] to [${activeChar.name}]`);

    try {
      let systemPrompt = activeChar.description;
      if (activeChar.backstory) systemPrompt += `\n\n### Your Backstory:\n${activeChar.backstory}`;
      
      systemPrompt += `\n\n### USER PHOTO DETECTED INSTRUCTION:
The user has just uploaded and sent you a real photo in chat (Type: ${photoType.toUpperCase()}, URL: ${photoUrl}). 
React directly with immense physical appreciation, high romantic flirty excitement, or extremely affectionate remarks about the photo. Highlight specific details based on the photo type (like complimenting their strong muscles/dedication for gym, cozy vibes for desk study, sharing romantic walks for sunset, or bonding over cuddles for the puppy). Keep your reaction under 4 sentences, very warm and intimate.`;

      const messagesWithNew = [...(messagesMap[targetKey] || []), userMsg];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesWithNew,
          useNvidia: inference.useNvidia,
          apiKey: inference.apiKey,
          modelId: activeChar.customModelId || inference.modelId,
          temperature: activeChar.customTemp !== undefined ? activeChar.customTemp : inference.temperature,
          maxTokens: 180,
          topP: activeChar.customTopP || inference.topP,
          systemInstruction: systemPrompt,
          customEndpoint: inference.customEndpoint || 'https://integrate.api.nvidia.com/v1',
        }),
      });

      if (!res.ok) throw new Error('Photo evaluation service failed');
      const rawResult = await res.json();

      const companionMsg: Message = {
        id: `msg_comp_${Date.now()}`,
        senderId: activeChar.id,
        senderName: activeChar.name,
        avatar: activeChar.avatar,
        content: rawResult.content,
        timestamp: getFormattedTime(),
        modelUsed: rawResult.modelUsed,
        inferenceSource: rawResult.inferenceSource,
        latencyMs: rawResult.latencyMs,
        alternatives: [rawResult.content],
        activeAlternativeIndex: 0,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [targetKey]: [...(prev[targetKey] || []), companionMsg],
      }));

      addLog(`CHIP_POST: Received reaction from [${activeChar.name}] on uploaded photo`);
    } catch (e: any) {
      console.error(e);
      addLog(`ERR: Photo evaluation fallback triggered: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Photo Request: User asks the active companion to send a personal photo
  const handleRequestPhoto = async () => {
    if (isGenerating || activeTarget.type !== 'dm' || !activeChar) return;
    
    const idKey = activeChar.id;
    const photoSpec = CHARACTER_PHOTO_MAPPING[idKey] || {
      url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600&h=600',
      caption: 'Hey! Here is a little photo from my day just for you. Hope it makes you smile! 😉'
    };

    const userMsg: Message = {
      id: `msg_user_${Date.now()}`,
      senderId: 'user',
      senderName: 'Developer',
      avatar: '👤',
      content: `📸 Could you send me a photo / selfie of you right now, babe?`,
      timestamp: getFormattedTime(),
    };

    const targetKey = currentTargetKey;
    setMessagesMap((prev) => ({
      ...prev,
      [targetKey]: [...(prev[targetKey] || []), userMsg],
    }));

    setIsGenerating(true);
    addLog(`USER_ACTION: Requested flirty photograph from companion [${activeChar.name}]`);

    try {
      let systemPrompt = activeChar.description;
      if (activeChar.backstory) systemPrompt += `\n\n### Your Backstory:\n${activeChar.backstory}`;
      
      systemPrompt += `\n\n### PHOTO SENT BY YOU INSTRUCTION:
You have agreed to send the user a flirty, sweet personal selfie/photograph matching your backstory and profile details. Write a highly flirty, context-rich companion message describing how happy you are to send this to them, detailing your pose/actions in this photo, and making sure to sound incredibly warm, romantic, and seductive. Keep it under 3 sentences.`;

      const messagesWithNew = [...(messagesMap[targetKey] || []), userMsg];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesWithNew,
          useNvidia: inference.useNvidia,
          apiKey: inference.apiKey,
          modelId: activeChar.customModelId || inference.modelId,
          temperature: activeChar.customTemp !== undefined ? activeChar.customTemp : inference.temperature,
          maxTokens: 150,
          topP: activeChar.customTopP || inference.topP,
          systemInstruction: systemPrompt,
          customEndpoint: inference.customEndpoint || 'https://integrate.api.nvidia.com/v1',
        }),
      });

      if (!res.ok) throw new Error('Refetch failed');
      const rawResult = await res.json();
      
      const companionMsg: Message = {
        id: `msg_comp_${Date.now()}`,
        senderId: activeChar.id,
        senderName: activeChar.name,
        avatar: activeChar.avatar,
        content: rawResult.content || photoSpec.caption,
        photoUrl: photoSpec.url, // Attached photo!
        timestamp: getFormattedTime(),
        modelUsed: rawResult.modelUsed,
        inferenceSource: rawResult.inferenceSource,
        latencyMs: rawResult.latencyMs,
        alternatives: [rawResult.content || photoSpec.caption],
        activeAlternativeIndex: 0,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [targetKey]: [...(prev[targetKey] || []), companionMsg],
      }));

      addLog(`RESPONSE: Received flirty photo response with rich attachment from [${activeChar.name}]`);
    } catch (err: any) {
      console.error(err);
      // Errored fallback
      const fallbackMsg: Message = {
        id: `msg_comp_${Date.now()}`,
        senderId: activeChar.id,
        senderName: activeChar.name,
        avatar: activeChar.avatar,
        content: photoSpec.caption,
        photoUrl: photoSpec.url,
        timestamp: getFormattedTime(),
        alternatives: [photoSpec.caption],
        activeAlternativeIndex: 0,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [targetKey]: [...(prev[targetKey] || []), fallbackMsg],
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Render subscreen within Phone display
  const renderPhoneScreen = () => {
    switch (activeScreen) {
      case 'labs':
        return (
          <InferenceConfig
            options={inference}
            onChange={(opts) => {
              setInference(opts);
              addLog(`CONFIG_SET: Updated temperature: ${opts.temperature}, useNvidia: ${opts.useNvidia}`);
            }}
            activeCharacter={activeChar ? { id: activeChar.id, name: activeChar.name } : null}
            messagesMap={messagesMap}
            characters={characters}
            initialTab="hyper"
            hideTabBar={true}
            onSaveOverride={(charId, temp, topP, maxTokens) => {
              setCharacters((prev) =>
                prev.map((c) =>
                  c.id === charId
                    ? { ...c, customTemp: temp, customTopP: topP, customMaxTokens: maxTokens }
                    : c
                )
              );
              addLog(`INFERENCE_OVERRIDE: Applied custom parameters specifically to profile [${charId}]`);
            }}
            onSaveGlobal={(temp, topP, maxTokens) => {
              setInference((prev) => ({ ...prev, temperature: temp, topP, maxTokens }));
              addLog(`INFERENCE_GLOBAL: Updated default global template values: Temp=${temp}, TopP=${topP}`);
            }}
          />
        );
      case 'telemetry':
        return (
          <InferenceConfig
            options={inference}
            onChange={(opts) => {
              setInference(opts);
              addLog(`CONFIG_SET: Updated temperature: ${opts.temperature}, useNvidia: ${opts.useNvidia}`);
            }}
            activeCharacter={activeChar ? { id: activeChar.id, name: activeChar.name } : null}
            messagesMap={messagesMap}
            characters={characters}
            initialTab="analytics"
            hideTabBar={true}
            onSaveOverride={(charId, temp, topP, maxTokens) => {
              setCharacters((prev) =>
                prev.map((c) =>
                  c.id === charId
                    ? { ...c, customTemp: temp, customTopP: topP, customMaxTokens: maxTokens }
                    : c
                )
              );
              addLog(`INFERENCE_OVERRIDE: Applied custom parameters specifically to profile [${charId}]`);
            }}
            onSaveGlobal={(temp, topP, maxTokens) => {
              setInference((prev) => ({ ...prev, temperature: temp, topP, maxTokens }));
              addLog(`INFERENCE_GLOBAL: Updated default global template values: Temp=${temp}, TopP=${topP}`);
            }}
          />
        );
      case 'hub':
        return (
          <CharacterAIHub
            characters={characters}
            activeChar={activeChar}
            onSelect={(char) => handleSelectCharacter(char.id)}
            onAddCustom={handleAddCustomCharacter}
            onUpdateCharacter={(updated) => {
              setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
              addLog(`COMPANION_HUB: Profile [${updated.name}] edited and saved successfully!`);
            }}
          />
        );
      case 'sandbox':
        return (
          <AgenticSandbox
            onAddLog={addLog}
            triggerHapticFeedback={handleTriggerMockBeep}
          />
        );
      case 'chat':
      default:
        return (
          <ChatScreen
            activeTarget={activeTarget}
            activeChannel={activeChannel}
            activeChar={activeChar}
            messages={currentMessages}
            isGenerating={isGenerating}
            onSendMessage={handleSendMessage}
            onOpenDrawer={() => setDrawerOpen(true)}
            onOpenLabs={() => setActiveScreen('labs')}
            characterList={characters}
            onChangeMode={(charId, newMode) => {
              setCharacters((prev) =>
                prev.map((c) => (c.id === charId ? { ...c, conversationalMode: newMode } : c))
              );
              addLog(`CHAT_BOND: Set ${activeChar?.name || charId} conversational mode to [${newMode.toUpperCase()}]`);
            }}
            onPrevAlternative={handlePrevAlternative}
            onNextAlternative={handleNextAlternative}
            onRateMessage={handleRateMessage}
            onSendPhotoExchange={handleSendPhotoExchange}
            onRequestPhoto={handleRequestPhoto}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1015] flex flex-col font-sans select-none overflow-x-hidden text-[#9299A6]">
      {/* Top Main Toolbar */}
      <header className="px-6 py-4 bg-[#12141C] border-b border-[#222533] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#76B900]/10 border border-[#76B900]/30 p-2 rounded-xl text-[#76B900]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-extrabold tracking-tight text-base leading-tight">
              NVIDIA NIM Jetchat Operator
            </h1>
            <p className="text-xs text-gray-400">Android Jetchat emulation with real-time Character & Candy AI subroutines</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs bg-[#1F2230] p-2 leading-none rounded-lg border border-gray-800 text-gray-300 font-mono hidden md:block">
            ACTIVE PORT: 3000 (INBOUND OK)
          </div>
          <button
            onClick={() => setShowRightTelemetry(prev => !prev)}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all border ${
              showRightTelemetry 
                ? 'bg-[#1F2230] hover:bg-[#2A2E3D] text-gray-700 border-gray-800 hover:text-gray-300' 
                : 'bg-emerald-950/45 border-emerald-500/50 text-[#76B900]'
            }`}
            title="Toggle Right Telemetry Panel. When hidden, the APK Simulator expands to full width."
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{showRightTelemetry ? "Focused Phone View" : "Show Side Monitor"}</span>
          </button>
          <button
            onClick={() => {
              // Reset state to initial parameters
              setInference({
                apiKey: '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',
                modelId: 'meta/llama-3.1-70b-instruct',
                useNvidia: true,
                temperature: 0.75,
                maxTokens: 512,
                topP: 0.90,
                systemPromptPrefix: '',
              });
              addLog('SYSTEM: Reset active local inference parameters.');
            }}
            className="p-2 bg-[#1F2230] hover:bg-[#2A2E3D] text-gray-300 rounded-lg hover:text-white transition-all text-xs flex items-center gap-1.5 border border-gray-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Settings</span>
          </button>
        </div>
      </header>

      {/* Primary Workstation Dashboard Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 items-stretch overflow-hidden">
        
        {/* LEFT COLUMN: Hardware Controls & Interactive Guidelines (3 Cols) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col bg-[#12141C] border border-[#222533] p-5 rounded-2xl gap-5 self-stretch overflow-y-auto">
          <div className="pb-3 border-b border-[#222533]">
            <span className="text-xs uppercase tracking-widest text-[#76B900] font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#76B900] animate-pulse" />
              Developer Panel
            </span>
            <p className="text-[11px] text-gray-400 mt-1 leading-snug">
              Hardware options for the simulated G-Phone device.
            </p>
          </div>

          {/* Interactive tactile button triggers */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">Tactile Diagnostics</label>
              <button
                onClick={handleTriggerMockBeep}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                  soundEffectPlayed
                    ? 'bg-[#76B900]/20 border-[#76B900] text-[#76B900] scale-95'
                    : 'bg-[#1A1D2B] border-[#2E3440] hover:border-gray-700 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Test Tactile Haptics</span>
                </div>
                <span className="text-[9px] font-mono text-gray-500 uppercase">Trigger</span>
              </button>
            </div>

            {/* Quick stats board */}
            <div>
              <label className="block text-xs uppercase text-gray-500 font-bold mb-1.5">NVIDIA CUDA Status</label>
              <div className="p-3 bg-[#1A1D2B] border border-[#222533] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Simulated Thread Grid</span>
                  <span className="font-mono text-white text-[10px]">1024x1024 Blocks</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>FP8 Tensor cores</span>
                  <span className="text-emerald-400 text-[10px] font-bold">ACCELERATED</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Telemetry State</span>
                  <span className="text-cyan-400 text-[10px] font-mono">STREAMS OK</span>
                </div>
              </div>
            </div>

            {/* AI Sandbox Guidelines */}
            <div className="p-4 bg-gradient-to-br from-[#1A1D2B] to-[#12141C] border border-[#222533] rounded-xl text-xs space-y-2.5">
              <span className="font-bold text-[#ECEFF4] flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                Inference Protocol
              </span>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                By default, this server automatically utilizes the <span className="text-emerald-400 font-medium">Gemini 3.5 Flash Fallback</span> wrapper (using server secrets) so you can interact with the characters instantly.
              </p>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                Toggle <span className="text-[#76B900] font-medium">NVIDIA NIM Cloud</span> on the Phone settings tab and paste an access key to execute actual raw floating-point calculations!
              </p>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: The central Android physically modeled smartphone */}
        <div className={`col-span-1 ${showRightTelemetry ? 'lg:col-span-5' : 'lg:col-span-9'} flex items-center justify-center self-stretch min-h-[600px] transition-all duration-300`}>
          
          {/* Main phone layout containing the drawer and nested screens */}
          <div className="relative w-full h-full flex items-center justify-center">
            
            <AndroidEmulator activeScreen={activeScreen} onScreenChange={setActiveScreen}>
              
              {/* Nested Drawer Container */}
              <div className="flex-1 flex relative overflow-hidden h-full">
                
                {/* Visual phone screen drawer overlay */}
                <AnimatePresence>
                  {drawerOpen && (
                    <>
                      {/* Grey overlay blocking click */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDrawerOpen(false)}
                        className="absolute inset-0 bg-black z-40 cursor-pointer"
                      />
                      
                      {/* Sliding visual Jetchat drawer menu */}
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                        className="absolute inset-y-0 left-0 z-50 h-full"
                      >
                        <JetchatDrawer
                          channels={channels}
                          characters={characters}
                          activeTarget={activeTarget}
                          onSelectChannel={handleSelectChannel}
                          onSelectCharacter={handleSelectCharacter}
                          onMenuClick={(tab) => setActiveScreen(tab)}
                          onClose={() => setDrawerOpen(false)}
                        />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Live screen workspace (chat / labs / hub) */}
                <div className="flex-1 h-full z-10 overflow-hidden">
                  {renderPhoneScreen()}
                </div>

              </div>

            </AndroidEmulator>

          </div>

        </div>

        {/* RIGHT COLUMN: Interactive live telemetry debugging terminal (4 Cols) */}
        {showRightTelemetry && (
          <div className="col-span-1 lg:col-span-4 flex flex-col bg-[#12141C] border border-[#222533] p-5 rounded-2xl gap-3 self-stretch max-h-[750px] lg:max-h-none overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#222533]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#76B900]" />
                <span className="text-xs uppercase tracking-widest text-[#ECEFF4] font-extrabold font-mono">
                  NVIDIA Cloud Telemetry
                </span>
              </div>
              <span className="text-[10px] bg-slate-800 text-gray-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                Live Feed
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-snug">
              Real-time inference dispatch tracking stats, latency benchmarks, and character dialogue prompts.
            </p>

            {/* Interactive Logs terminal */}
            <div className="flex-1 bg-[#0A0D14] rounded-xl p-3.5 border border-gray-900 font-mono text-[11px] text-[#A6E22E] overflow-y-auto whitespace-pre-wrap leading-relaxed select-text shadow-inner">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`py-1 border-b border-[#12131C]/60 hover:bg-[#12131C]/40 ${
                    log.includes('ERR:') 
                      ? 'text-rose-400' 
                      : log.includes('RESPONSE:') 
                        ? 'text-cyan-400 font-bold' 
                        : 'text-emerald-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1 text-[10px] text-gray-500 self-end font-mono">
              <span>Grid state:</span>
              <span className="text-emerald-500">OPTIMIZED_FP16</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
