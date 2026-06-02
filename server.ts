/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Parsers for JSON streams
app.use(express.json({ limit: '10mb' }));

// Set up server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY matches missing state. Defaulting to mock/demo logic or empty responses.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// 1. API: Core conversational routing
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      messages,
      useNvidia,
      apiKey,
      modelId,
      temperature,
      maxTokens,
      topP,
      systemInstruction,
      customEndpoint,
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    // Format message history for standard OpenAI-style (NVIDIA) and Gemini formats
    // Get last 15 messages to prevent overloading token limit
    const history = messages.slice(-15);

    const effectiveApiKey = apiKey || process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY;

    if (useNvidia && effectiveApiKey) {
      // -------------------------------------------------------------
      // ROUTE: Actual NVIDIA NIM cloud completion (OpenAI API compliant)
      // -------------------------------------------------------------
      const formattedHistory = history.map((m: any) => ({
        role: m.senderId === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      // Add system role
      const nMessages = [
        { role: 'system', content: systemInstruction || 'You are a helpful companion.' },
        ...formattedHistory,
      ];

      let endpointUrl = customEndpoint || 'https://integrate.api.nvidia.com/v1';
      // Normalize endpoint URL to build standard completions handler path
      if (!endpointUrl.endsWith('/chat/completions')) {
        if (endpointUrl.endsWith('/')) {
          endpointUrl = endpointUrl.slice(0, -1);
        }
        endpointUrl = `${endpointUrl}/chat/completions`;
      }

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId || 'meta/llama-3.1-70b-instruct',
          messages: nMessages,
          temperature: temperature ?? 0.7,
          top_p: topP ?? 0.9,
          max_tokens: maxTokens ?? 512,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Nvidia NIM API Error (${response.status}): ${errText}`);
      }

      const raw = await response.json();
      const content = raw.choices?.[0]?.message?.content || '';
      const latencyMs = Date.now() - startTime;
      const tokensUsed = raw.usage?.completion_tokens || raw.usage?.total_tokens || Math.ceil(content.length / 4.1);

      res.json({
        content: content.trim(),
        modelUsed: raw.model || modelId,
        inferenceSource: 'nvidia-nim',
        latencyMs,
        tokensUsed,
      });
      return;
    } else {
      // -------------------------------------------------------------
      // ROUTE: Gemini completions fallback using process.env.GEMINI_API_KEY
      // -------------------------------------------------------------
      const ai = getGeminiClient();

      // For Gemini, we can map history to parts
      // Note: we can use a simpler single-shot or structured dialog string representing the recent history context:
      // This is dynamic, reliable, and prevents complex multi-turn structure mismatch.
      let chatPromptContext = '';
      if (systemInstruction) {
        chatPromptContext += `### System Core Guidelines:\n${systemInstruction}\n\n`;
      }
      chatPromptContext += `### Chat History Context:\n`;
      history.forEach((m: any) => {
        chatPromptContext += `${m.senderId === 'user' ? 'User' : m.senderName}: ${m.content}\n`;
      });
      chatPromptContext += `\nGenerate the next response as the Character. Maintain their personality, slang, tags, tone, and formatting strictly. Keep responses conversational, concise (under 4-5 sentences), and engaging.\nNext character response:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: chatPromptContext,
        config: {
          temperature: temperature ?? 0.7,
          topP: topP ?? 0.9,
          maxOutputTokens: maxTokens ?? 512,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        },
      });

      const latencyMs = Date.now() - startTime;
      const responseText = response.text || '';

      // Clean up potential prefixes in response
      let cleanedText = responseText.trim();
      const prefixToRemove = `${history[history.length - 1]?.senderName || 'Character'}:`;
      if (cleanedText.startsWith(prefixToRemove)) {
        cleanedText = cleanedText.substring(prefixToRemove.length).trim();
      }

      const tokensUsed = Math.ceil(cleanedText.length / 4.1);

      res.json({
        content: cleanedText,
        modelUsed: useNvidia ? `meta/llama-3.1-70b-instruct (Gemini fallback)` : 'gemini-3.5-flash',
        inferenceSource: useNvidia ? 'nvidia-nim-simulated' : 'gemini',
        latencyMs,
        tokensUsed,
      });
      return;
    }
  } catch (error: any) {
    console.error('Server side API error:', error);
    res.status(500).json({
      error: error.message || 'An error occurred during conversational inference.',
    });
  }
});

// New endpoint: fetch all available models directly from NVIDIA NIM V1 Models API
app.get('/api/nvidia-models', async (req, res) => {
  const apiKey = req.query.apiKey || process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY;
  if (!apiKey) {
    res.json({ error: 'No API key provided.', models: [] });
    return;
  }
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`NVIDIA API returned status ${response.status}`);
    }
    const data = await response.json();
    
    // Filter and extract conversational/chat instruct models 
    const allowedKeywords = ['instruct', 'chat', 'nemotron', 'gemma', 'mixtral', 'deepseek', 'llama', 'qwen', 'phi', 'yi', 'gemma-2'];
    const fetchedList = (data.data || [])
      .map((m: any) => m.id)
      .filter((id: string) => {
        const idLower = id.toLowerCase();
        return allowedKeywords.some(kw => idLower.includes(kw)) && 
               !idLower.includes('embed') && 
               !idLower.includes('rerank');
      });
      
    // Sort alphabetically for clean UX
    fetchedList.sort();

    res.json({ models: fetchedList });
  } catch (error: any) {
    console.warn('Failed to fetch official NVIDIA models list:', error.message);
    res.json({ error: error.message, models: [] });
  }
});

// 2. API: Character Generator (Character.ai / Candy.ai style avatar descriptor or detail generator)
app.post('/api/characters/generate', async (req, res) => {
  try {
    const { idea } = req.body;
    if (!idea) {
      res.status(400).json({ error: 'Concept/Idea prompt is required.' });
      return;
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Design a Character.ai / Candy.ai style interactive chat agent based on this concept: "${idea}". 
      Return structured JSON matching this schema precisely:
      {
        "name": "Short catchy name",
        "tagline": "Short snappy motto or tagline under 60 chars",
        "description": "Full core detailed system instructions detailing persona, attitude, slang, formatting guidelines, secrets, and tone instructions written in second person 'You are...'",
        "greeting": "Sensational high-impact greeting representing their theme & personality to start the chat",
        "avatar": "One single emoji that represents them best",
        "category": "Helpers OR Anime & Gaming OR Companions OR Cyberpunk OR Science OR Boyfriends",
        "personalityType": "flirty OR supportive OR tsundere OR philosopher OR gamer OR cyberpunk OR scientist OR boyfriend",
        "backstory": "An engaging, deep background story about who they are, where they came from, and their private emotional history",
        "traits": ["trait1", "trait2", "trait3"]
      }
      Do NOT return markdown wrapper. Return only pure JSON content.`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedData = JSON.parse(response.text?.trim() || '{}');
    res.json(parsedData);
  } catch (error: any) {
    console.error('Error generating companion:', error);
    res.status(500).json({ error: error.message || 'Failed to generate character metadata.' });
  }
});

// 3. API: Filesystem exploration for simulated and root mode Android storage
app.post('/api/filesystem', async (req, res) => {
  try {
    const { dirPath, rootEnabled } = req.body;
    const projectRoot = process.cwd();
    
    // Resolve safe path
    let targetPath = dirPath || projectRoot;
    
    // Virtual sandbox files to mimic standard Android environment if not Root-Enabled
    if (!rootEnabled) {
      // Clean target path to prevent directory traversal exploits
      const resolvedPath = path.resolve(targetPath);
      if (!resolvedPath.startsWith(projectRoot)) {
        // Fallback to project root if they try to access outside files without Root
        targetPath = projectRoot;
      }
    }
    
    const absolutePath = path.resolve(targetPath);
    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({ error: `Directory not found: ${targetPath}` });
      return;
    }
    
    const stat = fs.statSync(absolutePath);
    if (!stat.isDirectory()) {
      res.status(400).json({ error: `Path: ${targetPath} is not a directory.` });
      return;
    }
    
    let rawFiles: string[] = [];
    try {
      rawFiles = fs.readdirSync(absolutePath);
    } catch (readErr: any) {
      // Return a simulated high-fidelity system index representing an Android/Linux system core
      if (rootEnabled) {
        rawFiles = ['bin', 'etc', 'home', 'lib', 'mnt', 'opt', 'proc', 'root', 'run', 'sbin', 'sys', 'tmp', 'usr', 'var', 'app'];
      } else {
        throw readErr;
      }
    }
    const files = [];
    
    // Add parent dir indicator (..) if not at the absolute root '/'
    if (absolutePath !== '/' && absolutePath !== 'C:\\') {
      const parentPath = path.dirname(absolutePath);
      files.push({
        name: '.. (Parent Directory)',
        path: parentPath,
        isDirectory: true,
        size: 0,
        mtime: new Date(),
        isParent: true
      });
    }

    // Standard Android sub-directories we mock in user space for a richer immersion
    if (!rootEnabled && absolutePath === projectRoot) {
      // Add typical Android user directories as virtual folders
      files.push({
        name: 'sdcard',
        path: path.join(projectRoot, 'src'), // redirect to src for interesting dev browsing
        isDirectory: true,
        size: 4096,
        mtime: new Date()
      }, {
        name: 'system',
        path: path.join(projectRoot, 'assets'),
        isDirectory: true,
        size: 4096,
        mtime: new Date()
      });
    }
    
    for (const f of rawFiles) {
      try {
        const full = path.join(absolutePath, f);
        const fStat = fs.statSync(full);
        
        // Hide sensitive hidden system lockers unless in rootMode
        if (f.startsWith('.') && !rootEnabled) {
          continue;
        }
        
        files.push({
          name: f,
          path: full,
          isDirectory: fStat.isDirectory(),
          size: fStat.size,
          mtime: fStat.mtime
        });
      } catch (err) {
        // Handle symbolic links or locked folders
        files.push({
          name: f,
          path: path.join(absolutePath, f),
          isDirectory: false,
          size: 0,
          mtime: new Date(),
          error: true
        });
      }
    }
    
    res.json({
      currentPath: absolutePath,
      rootEnabled,
      files
    });
  } catch (error: any) {
    console.error('Filesystem scan error:', error);
    res.status(500).json({ error: error.message || 'Error processing path.' });
  }
});

// 4. API: Read a specific file content
app.post('/api/filesystem/read', async (req, res) => {
  try {
    const { filePath, rootEnabled } = req.body;
    if (!filePath) {
      res.status(400).json({ error: 'File path parameter is required.' });
      return;
    }
    
    const absolutePath = path.resolve(filePath);
    const projectRoot = process.cwd();
    
    if (!rootEnabled && !absolutePath.startsWith(projectRoot)) {
      res.status(403).json({ error: 'Access Denied. Turn on ROOT Mode to browse outside of sandboxed directories.' });
      return;
    }
    
    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({ error: 'Specified file does not exist.' });
      return;
    }
    
    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) {
      res.status(400).json({ error: 'Selected path is a directory, not a file.' });
      return;
    }
    
    if (stat.size > 1024 * 1024) { // 1MB size limit
      res.status(400).json({ error: 'File too large to render inside emulator (Limit 1MB).' });
      return;
    }
    
    const content = fs.readFileSync(absolutePath, 'utf8');
    res.json({
      path: absolutePath,
      content
    });
  } catch (error: any) {
    console.error('File read error:', error);
    res.status(500).json({ error: error.message || 'Error loading file content.' });
  }
});

// 5. API: Agentic AI Code Generator Endpoint
app.post('/api/agentic-ai/code', async (req, res) => {
  try {
    const { prompt, currentFile, fileContent, rootEnabled } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }
    
    const ai = getGeminiClient();
    const systemPrompt = `You are AideX, an advanced autonomous Agentic AI programmer working inside an integrated G-Phone emulation environment.
Active Sandbox Permissions: ${rootEnabled ? 'SYSTEM-WIDE SUPERUSER ROOT (/) ACCESS' : 'LOCAL USER LAND (/sdcard) ISOLATED ACCESS'}.

Your task is to write high-fidelity files, explain scripts, and help the user browse and code in this Linux container environment.
When providing code, ALWAYS wrap complete, functional files in markdown blocks. Avoid hand-wavy placeholders; write execute-ready scripts.
Integrate modern standards and keep explanations concise and terminal-like.`;

    let inputBuilder = `User Request: "${prompt}"\n\n`;
    if (currentFile) {
      inputBuilder += `Current Active File Selection: "${currentFile}"\nContent:\n\`\`\`\n${fileContent || ''}\n\`\`\`\n\n`;
    }
    inputBuilder += `Please output complete script files, instructions, or directory optimization logs.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: inputBuilder,
      config: {
        temperature: 0.15,
        systemInstruction: systemPrompt
      }
    });

    res.json({
      response: response.text || 'AideX resolved request successfully with null feedback.'
    });
  } catch (error: any) {
    console.error('Agentic AI endpoint failed:', error);
    res.status(500).json({ error: error.message || 'Agentic system offline.' });
  }
});

// Initialize Vite dev middleware if not in production
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jetchat Server booting successfully on port ${PORT}`);
  });
};

startServer();
