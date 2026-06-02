/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Character {
  id: string;
  name: string;
  tagline: string;
  description: string; // The system instructions / personality core
  avatar: string; // Emoji, icon, or imageURL
  greeting: string; // First message
  category: string; // e.g. "Gaming", "Animes", "Helpers", "Companions", "Boyfriends"
  personalityType: 'flirty' | 'supportive' | 'tsundere' | 'philosopher' | 'gamer' | 'cyberpunk' | 'scientist' | 'custom' | 'boyfriend';
  status: 'Online' | 'Away' | 'Offline';
  customModelId?: string; // Optional character-specific NIM model
  accentColor?: string; // e.g., tailwind color
  
  // Custom new fields for managing rich AI profiles
  backstory?: string;
  traits?: string[]; // list of personality traits e.g. ["protective", "devoted", "playful"]
  conversationalMode?: 'normal' | 'flirt' | 'roleplay';
  
  // Parameter overrides saved per character
  customTemp?: number;
  customTopP?: number;
  customMaxTokens?: number;
}

export interface Message {
  id: string;
  senderId: string; // 'user' or character.id
  senderName: string;
  avatar: string;
  content: string;
  timestamp: string;
  isGenerating?: boolean;
  inferenceSource?: 'gemini' | 'nvidia-nim';
  modelUsed?: string;
  latencyMs?: number;
  tokensUsed?: number;
  // Character.ai dynamic interaction values
  rating?: number;              // User rating out of 4 stars
  alternatives?: string[];       // Alternative string response values
  activeAlternativeIndex?: number; // Pointer to the selected response alternative
  photoUrl?: string;             // Optional media url for photo exchanges
}

export interface InferenceOptions {
  apiKey: string;
  modelId: string;
  useNvidia: boolean; // false = use Gemini backend, true = use Nvidia NIM
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPromptPrefix: string;
  customEndpoint?: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'character-direct';
  characterId?: string; // If it's a DM with a character
}
