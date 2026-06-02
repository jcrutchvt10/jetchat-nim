var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
var getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY matches missing state. Defaulting to mock/demo logic or empty responses.");
  }
  return new import_genai.GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};
app.post("/api/chat", async (req, res) => {
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
      customEndpoint
    } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array is required." });
      return;
    }
    const history = messages.slice(-15);
    const effectiveApiKey = apiKey || process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY;
    if (useNvidia && effectiveApiKey) {
      const formattedHistory = history.map((m) => ({
        role: m.senderId === "user" ? "user" : "assistant",
        content: m.content
      }));
      const nMessages = [
        { role: "system", content: systemInstruction || "You are a helpful companion." },
        ...formattedHistory
      ];
      let endpointUrl = customEndpoint || "https://integrate.api.nvidia.com/v1";
      if (!endpointUrl.endsWith("/chat/completions")) {
        if (endpointUrl.endsWith("/")) {
          endpointUrl = endpointUrl.slice(0, -1);
        }
        endpointUrl = `${endpointUrl}/chat/completions`;
      }
      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${effectiveApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelId || "meta/llama-3.1-70b-instruct",
          messages: nMessages,
          temperature: temperature ?? 0.7,
          top_p: topP ?? 0.9,
          max_tokens: maxTokens ?? 512
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Nvidia NIM API Error (${response.status}): ${errText}`);
      }
      const raw = await response.json();
      const content = raw.choices?.[0]?.message?.content || "";
      const latencyMs = Date.now() - startTime;
      const tokensUsed = raw.usage?.completion_tokens || raw.usage?.total_tokens || Math.ceil(content.length / 4.1);
      res.json({
        content: content.trim(),
        modelUsed: raw.model || modelId,
        inferenceSource: "nvidia-nim",
        latencyMs,
        tokensUsed
      });
      return;
    } else {
      const ai = getGeminiClient();
      let chatPromptContext = "";
      if (systemInstruction) {
        chatPromptContext += `### System Core Guidelines:
${systemInstruction}

`;
      }
      chatPromptContext += `### Chat History Context:
`;
      history.forEach((m) => {
        chatPromptContext += `${m.senderId === "user" ? "User" : m.senderName}: ${m.content}
`;
      });
      chatPromptContext += `
Generate the next response as the Character. Maintain their personality, slang, tags, tone, and formatting strictly. Keep responses conversational, concise (under 4-5 sentences), and engaging.
Next character response:`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatPromptContext,
        config: {
          temperature: temperature ?? 0.7,
          topP: topP ?? 0.9,
          maxOutputTokens: maxTokens ?? 512,
          safetySettings: [
            { category: import_genai.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: import_genai.HarmBlockThreshold.BLOCK_NONE },
            { category: import_genai.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: import_genai.HarmBlockThreshold.BLOCK_NONE },
            { category: import_genai.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: import_genai.HarmBlockThreshold.BLOCK_NONE },
            { category: import_genai.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: import_genai.HarmBlockThreshold.BLOCK_NONE }
          ]
        }
      });
      const latencyMs = Date.now() - startTime;
      const responseText = response.text || "";
      let cleanedText = responseText.trim();
      const prefixToRemove = `${history[history.length - 1]?.senderName || "Character"}:`;
      if (cleanedText.startsWith(prefixToRemove)) {
        cleanedText = cleanedText.substring(prefixToRemove.length).trim();
      }
      const tokensUsed = Math.ceil(cleanedText.length / 4.1);
      res.json({
        content: cleanedText,
        modelUsed: useNvidia ? `meta/llama-3.1-70b-instruct (Gemini fallback)` : "gemini-3.5-flash",
        inferenceSource: useNvidia ? "nvidia-nim-simulated" : "gemini",
        latencyMs,
        tokensUsed
      });
      return;
    }
  } catch (error) {
    console.error("Server side API error:", error);
    res.status(500).json({
      error: error.message || "An error occurred during conversational inference."
    });
  }
});
app.post("/api/characters/generate", async (req, res) => {
  try {
    const { idea } = req.body;
    if (!idea) {
      res.status(400).json({ error: "Concept/Idea prompt is required." });
      return;
    }
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
        responseMimeType: "application/json"
      }
    });
    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error) {
    console.error("Error generating companion:", error);
    res.status(500).json({ error: error.message || "Failed to generate character metadata." });
  }
});
app.post("/api/filesystem", async (req, res) => {
  try {
    const { dirPath, rootEnabled } = req.body;
    const projectRoot = process.cwd();
    let targetPath = dirPath || projectRoot;
    if (!rootEnabled) {
      const resolvedPath = import_path.default.resolve(targetPath);
      if (!resolvedPath.startsWith(projectRoot)) {
        targetPath = projectRoot;
      }
    }
    const absolutePath = import_path.default.resolve(targetPath);
    if (!import_fs.default.existsSync(absolutePath)) {
      res.status(404).json({ error: `Directory not found: ${targetPath}` });
      return;
    }
    const stat = import_fs.default.statSync(absolutePath);
    if (!stat.isDirectory()) {
      res.status(400).json({ error: `Path: ${targetPath} is not a directory.` });
      return;
    }
    const rawFiles = import_fs.default.readdirSync(absolutePath);
    const files = [];
    if (absolutePath !== "/" && absolutePath !== "C:\\") {
      const parentPath = import_path.default.dirname(absolutePath);
      files.push({
        name: ".. (Parent Directory)",
        path: parentPath,
        isDirectory: true,
        size: 0,
        mtime: /* @__PURE__ */ new Date(),
        isParent: true
      });
    }
    if (!rootEnabled && absolutePath === projectRoot) {
      files.push({
        name: "sdcard",
        path: import_path.default.join(projectRoot, "src"),
        // redirect to src for interesting dev browsing
        isDirectory: true,
        size: 4096,
        mtime: /* @__PURE__ */ new Date()
      }, {
        name: "system",
        path: import_path.default.join(projectRoot, "assets"),
        isDirectory: true,
        size: 4096,
        mtime: /* @__PURE__ */ new Date()
      });
    }
    for (const f of rawFiles) {
      try {
        const full = import_path.default.join(absolutePath, f);
        const fStat = import_fs.default.statSync(full);
        if (f.startsWith(".") && !rootEnabled) {
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
        files.push({
          name: f,
          path: import_path.default.join(absolutePath, f),
          isDirectory: false,
          size: 0,
          mtime: /* @__PURE__ */ new Date(),
          error: true
        });
      }
    }
    res.json({
      currentPath: absolutePath,
      rootEnabled,
      files
    });
  } catch (error) {
    console.error("Filesystem scan error:", error);
    res.status(500).json({ error: error.message || "Error processing path." });
  }
});
app.post("/api/filesystem/read", async (req, res) => {
  try {
    const { filePath, rootEnabled } = req.body;
    if (!filePath) {
      res.status(400).json({ error: "File path parameter is required." });
      return;
    }
    const absolutePath = import_path.default.resolve(filePath);
    const projectRoot = process.cwd();
    if (!rootEnabled && !absolutePath.startsWith(projectRoot)) {
      res.status(403).json({ error: "Access Denied. Turn on ROOT Mode to browse outside of sandboxed directories." });
      return;
    }
    if (!import_fs.default.existsSync(absolutePath)) {
      res.status(404).json({ error: "Specified file does not exist." });
      return;
    }
    const stat = import_fs.default.statSync(absolutePath);
    if (!stat.isFile()) {
      res.status(400).json({ error: "Selected path is a directory, not a file." });
      return;
    }
    if (stat.size > 1024 * 1024) {
      res.status(400).json({ error: "File too large to render inside emulator (Limit 1MB)." });
      return;
    }
    const content = import_fs.default.readFileSync(absolutePath, "utf8");
    res.json({
      path: absolutePath,
      content
    });
  } catch (error) {
    console.error("File read error:", error);
    res.status(500).json({ error: error.message || "Error loading file content." });
  }
});
app.post("/api/agentic-ai/code", async (req, res) => {
  try {
    const { prompt, currentFile, fileContent, rootEnabled } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required." });
      return;
    }
    const ai = getGeminiClient();
    const systemPrompt = `You are AideX, an advanced autonomous Agentic AI programmer working inside an integrated G-Phone emulation environment.
Active Sandbox Permissions: ${rootEnabled ? "SYSTEM-WIDE SUPERUSER ROOT (/) ACCESS" : "LOCAL USER LAND (/sdcard) ISOLATED ACCESS"}.

Your task is to write high-fidelity files, explain scripts, and help the user browse and code in this Linux container environment.
When providing code, ALWAYS wrap complete, functional files in markdown blocks. Avoid hand-wavy placeholders; write execute-ready scripts.
Integrate modern standards and keep explanations concise and terminal-like.`;
    let inputBuilder = `User Request: "${prompt}"

`;
    if (currentFile) {
      inputBuilder += `Current Active File Selection: "${currentFile}"
Content:
\`\`\`
${fileContent || ""}
\`\`\`

`;
    }
    inputBuilder += `Please output complete script files, instructions, or directory optimization logs.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: inputBuilder,
      config: {
        temperature: 0.15,
        systemInstruction: systemPrompt
      }
    });
    res.json({
      response: response.text || "AideX resolved request successfully with null feedback."
    });
  } catch (error) {
    console.error("Agentic AI endpoint failed:", error);
    res.status(500).json({ error: error.message || "Agentic system offline." });
  }
});
var startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Jetchat Server booting successfully on port ${PORT}`);
  });
};
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
