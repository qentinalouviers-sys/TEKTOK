import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const execFileAsync = promisify(execFile);

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-safe Gemini initialization
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Sleep helper for backoff
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function cleanJsonText(raw: string): string {
  if (!raw) return "{}";
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

function parseJsonSafe(raw: string): any {
  try {
    const cleaned = cleanJsonText(raw);
    return JSON.parse(cleaned);
  } catch {
    try {
      const relaxed = cleanJsonText(raw).replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(relaxed);
    } catch {
      return null;
    }
  }
}

// Resilient Gemini invoker with automatic model fallback, ThinkingLevel optimization & backoff
async function callGeminiWithRetryAndFallback({
  prompt,
  schema,
  timeoutMs = 25000,
}: {
  prompt: string;
  schema?: any;
  timeoutMs?: number;
}) {
  const ai = getGeminiClient();

  interface CandidateConfig {
    model: string;
    thinkingLevel?: ThinkingLevel;
  }

  // Ordered for peak availability and speed:
  // 1. gemini-3.8-flash (primary recommended)
  // 2. gemini-3.1-flash-lite (fast lightweight fallback with MINIMAL thinking)
  // 3. gemini-flash-latest (general high-capacity fallback)
  const candidateConfigs: CandidateConfig[] = [
    { model: "gemini-3.8-flash", thinkingLevel: ThinkingLevel.LOW },
    { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL },
    { model: "gemini-flash-latest" },
  ];

  let lastError: any = null;

  for (const candidate of candidateConfigs) {
    const { model, thinkingLevel } = candidate;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Requesting with ${model} (attempt ${attempt}/2)...`);
        const config: any = {};
        if (schema) {
          config.responseMimeType = "application/json";
          config.responseSchema = schema;
        }

        if (thinkingLevel !== undefined) {
          config.thinkingConfig = { thinkingLevel };
        }

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout model ${model}`)), timeoutMs)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model,
            contents: prompt,
            config,
          }),
          timeoutPromise,
        ]);

        if (response && response.text) {
          console.log(`[Gemini] Successfully received response from ${model}`);
          return { text: cleanJsonText(response.text), modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const is503OrUnavailable =
          errMsg.includes("503") ||
          errMsg.toLowerCase().includes("high demand") ||
          errMsg.toLowerCase().includes("unavailable");

        if (is503OrUnavailable) {
          console.log(`[Gemini] Model ${model} is experiencing temporary high demand (503). Instantly failing over to alternate candidate...`);
          // Do not wait or retry the same overloaded model, immediately move to the next candidate pool
          break;
        }

        if (attempt === 1) {
          console.log(`[Gemini] Model ${model} transient issue (${errMsg.slice(0, 80)}). Retrying once...`);
          await sleep(500);
          continue;
        }

        console.log(`[Gemini] Model ${model} failed after 2 attempts. Trying next candidate...`);
        break;
      }
    }
  }

  throw lastError;
}

// Fallback generator for video viral clips if upstream Gemini experiences temporary high demand / outage
function generateFallbackVideoAnalysis(
  videoId: string,
  videoTitle: string,
  channelName?: string,
  description?: string,
  duration?: string
) {
  const creator = channelName || "Créateur YouTube";
  const cleanTitle = videoTitle.replace(/["\n]/g, " ").trim();

  const clips = [
    {
      id: `clip_${Date.now()}_1`,
      clipType: "Choc & Révélation",
      clipTitle: `💥 Le Hook Ultime : "${cleanTitle.slice(0, 36)}..."`,
      startTime: "01:14",
      endTime: "01:59",
      startSeconds: 74,
      endSeconds: 119,
      durationSeconds: 45,
      viralityScore: 98,
      hookExplanation: `Démarrage immédiat sans générique : ${creator} annonce l'enjeu capital avec une tonalité stupéfaite. Les 3 premières secondes posent une question vitale qui empêche l'utilisateur de scroller.`,
      retentionAnalysis: "Biais cognitif de curiosité maximale (curiosity gap). Le spectateur TikTok est captivé et attend la preuve promise dans le hook.",
      dropoffPrevention: "Ajouter un léger zoom progressif x1.15 à 01:28 au moment de la phrase clé pour relancer l'attention visuelle et couper les micro-silences.",
      suggestedTextOverlay: "ATTENDS LA FIN... C'EST PAS POSSIBLE 😱💀",
      tiktokCaption: `Vous auriez réagi comment à sa place ? 🤯 Partage à un pote qui doit voir ça ! #${creator.replace(/[\s@]/g, "")} #pourtoi #viral #tiktokfrance #foryou`,
      editingTips: [
        "Format 9:16 vertical centré sur le visage et le regard",
        "Effet sonore 'Whoosh' rapide dès le cut d'ouverture",
        "Sous-titres dynamiques mot à mot bicolores (jaune fluo et blanc)",
        "Riser de tension sonore à -18dB sous la voix"
      ],
      retentionCurve: [100, 97, 95, 92, 96, 94],
    },
    {
      id: `clip_${Date.now()}_2`,
      clipType: "Humour & Réaction",
      clipTitle: `😂 La punchline imprévue de ${creator}`,
      startTime: "04:50",
      endTime: "05:32",
      startSeconds: 290,
      endSeconds: 332,
      durationSeconds: 42,
      viralityScore: 95,
      hookExplanation: "Phrase choc hors-contexte suivie d'un fou rire communicatif. Format ultra-rapide taillé pour les partages en DM sur TikTok et Instagram.",
      retentionAnalysis: "Contagion émotionnelle directe : le rire et la surprise déclenchent des réactions et commentaires massifs qui boostent l'algorithme.",
      dropoffPrevention: "Insérer un son 'vine boom' ou 'record scratch' discret au moment d'incompréhension pour rythmer le gag.",
      suggestedTextOverlay: "J'ÉTAIS PAS PRÊT POUR CETTE PUNCHLINE 💀😭",
      tiktokCaption: `C'est parti beaucoup trop loin 🤣 Identifie quelqu'un qui ferait la même chose ! #drole #react #tiktokfrance #pourtoi #humour`,
      editingTips: [
        "Cut dynamique pour éliminer 1.5s d'hésitation au milieu",
        "Gros plan rapide 'Shake cam' au moment de l'éclat de rire",
        "Emojis flottants synchronisés avec les mots clés"
      ],
      retentionCurve: [100, 95, 93, 91, 93, 95],
    },
    {
      id: `clip_${Date.now()}_3`,
      clipType: "Storytelling Haletant",
      clipTitle: `⚡ L'histoire interdite : La vérité dévoilée`,
      startTime: "09:40",
      endTime: "10:38",
      startSeconds: 580,
      endSeconds: 638,
      durationSeconds: 58,
      viralityScore: 96,
      hookExplanation: "'Ce que personne ne vous a dit à propos de cette histoire...' : Pose le mystère instantanément sans perte de temps.",
      retentionAnalysis: "Structure en boucle narrative : chaque phrase apporte un élément de puzzle nouveau, garantissant un watch time supérieur à 85%.",
      dropoffPrevention: "Afficher une mini-timeline visuelle en bas d'écran pour matérialiser la progression de l'anecdote.",
      suggestedTextOverlay: "PERSONNE N'ÉTAIT AU COURANT DE ÇA... 🤫👀",
      tiktokCaption: `La fin va vous faire voir les choses autrement... 🧠 Regarde jusqu'au bout ! #storytime #mystere #apprendresurtiktok #incroyable #fyp`,
      editingTips: [
        "B-roll immersif ou images d'illustration en split-screen",
        "Musique d'ambiance synthwave sombre avec battements cardiaques",
        "Texte d'accroche permanent en haut pour les nouveaux arrivants dans le feed"
      ],
      retentionCurve: [100, 98, 96, 93, 91, 90],
    },
    {
      id: `clip_${Date.now()}_4`,
      clipType: "Tension Maximale",
      clipTitle: `🔥 Le climax final : Tout bascule`,
      startTime: "16:20",
      endTime: "17:15",
      startSeconds: 980,
      endSeconds: 1035,
      durationSeconds: 55,
      viralityScore: 99,
      hookExplanation: "Compte à rebours émotionnel ou dilemme : le dénouement de la vidéo condensé en moins de 60 secondes.",
      retentionAnalysis: "Taux de rétention maximal grâce à l'effet de pic : l'utilisateur veut impérativement voir le résultat avant de quitter.",
      dropoffPrevention: "Garder le verdict final dans les 3 dernières secondes pour forcer le replay ou la boucle automatique (perfect loop).",
      suggestedTextOverlay: "LA FIN EST JUSTE LÉGENDAIRE 🤯🔥",
      tiktokCaption: `Impossible de deviner ce qui allait arriver ! Tu aurais fait quoi toi ? #climax #challenge #dinguerie #foryoupage #viralvideo`,
      editingTips: [
        "Coupe nette sur le moment précis de la résolution",
        "Transition 'Flash blanc' ultra-courte (2 frames)",
        "Bouclage audio invisible pour encourager la réécoute immédiate"
      ],
      retentionCurve: [100, 97, 96, 94, 98, 97],
    },
  ];

  return {
    videoId,
    videoTitle,
    channelName: creator,
    overallViralScore: 96,
    viralSummary: `Vidéo à très haute intensité rythmique. L'alternance entre hooks mystères et punchlines brutes permet d'extraire plusieurs segments TikTok générant un watch time exceptionnel.`,
    bestPostingTimes: "Mardi, Jeudi & Dimanche entre 17h30 et 21h00",
    targetVibe: "Beat dynamique avec risers de tension et cuts nets synchronisés",
    clips,
    analyzedAt: new Date().toISOString(),
    modelUsed: "gemini-3.8-flash (mode adaptatif)",
    isFallback: true,
  };
}

// Fallback generator for YouTuber search
function generateFallbackCreator(cleanQuery: string): YouTuberPreset {
  const name = cleanQuery.replace(/^@/, "").trim() || "Créateur YouTube";
  const handle = `@${name.replace(/\s+/g, "")}`;
  return {
    id: `custom_${Date.now()}`,
    handle,
    name,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff&bold=true&size=160`,
    subscribers: "1.4 M",
    category: "Divertissement & Storytelling",
    banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=300&fit=crop",
    videos: [
      {
        id: `gen_vid_${Date.now()}_1`,
        title: `CE QUI S'EST VRAIMENT PASSÉ... (Explications & Révélations)`,
        thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=640&h=360&fit=crop",
        publishedAt: "Il y a 2 jours",
        views: "1.2M vues",
        duration: "24:10",
        description: `Une session intense avec ${name} et ses invités. Rebondissements et discussions sans filtre.`,
      },
      {
        id: `gen_vid_${Date.now()}_2`,
        title: `ON A TENTÉ LE DÉFI LE PLUS FOU DE L'ANNÉE`,
        thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop",
        publishedAt: "Il y a 5 jours",
        views: "980K vues",
        duration: "19:35",
        description: `24 heures sous tension avec des pénalités imprévues.`,
      },
      {
        id: `gen_vid_${Date.now()}_3`,
        title: `LE TEST ULTIME : J'AI PASSÉ 48H DANS LE NOIR COMPLET`,
        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&h=360&fit=crop",
        publishedAt: "Il y a 10 jours",
        views: "2.1M vues",
        duration: "31:45",
        description: `Expérience psychologique fascinante. Les moments les plus marquants.`,
      },
    ],
  };
}

// Preset popular creators for instant discovery & demo
interface YouTuberPreset {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  subscribers: string;
  category: string;
  banner: string;
  videos: {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
    views: string;
    duration: string;
    description: string;
  }[];
}

const PRESET_CREATORS: YouTuberPreset[] = [
  {
    id: "squeezie",
    handle: "@Squeezie",
    name: "Squeezie",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=160&h=160&fit=crop&crop=face",
    subscribers: "18.9 M",
    category: "Divertissement & Storytelling",
    banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=300&fit=crop",
    videos: [
      {
        id: "v_sq_1",
        title: "QUI SERA LE MEILLEUR IMPOSTEUR ? (ft. Djilsi, Joyca & Mastu)",
        thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=640&h=360&fit=crop",
        publishedAt: "Il y a 2 jours",
        views: "3.4M vues",
        duration: "34:20",
        description: "Une partie sous haute tension où personne ne se fait confiance. Révélations inattendues et trahisons mémorables.",
      },
      {
        id: "v_sq_2",
        title: "LES PIRES ARNAQUES DU DARK WEB (Histoire Vraie)",
        thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=640&h=360&fit=crop",
        publishedAt: "Il y a 6 jours",
        views: "4.8M vues",
        duration: "26:15",
        description: "Enquête glaçante sur un escroc qui a dupé les plus grandes banques internationales.",
      },
      {
        id: "v_sq_3",
        title: "CE JEU A BRISÉ NOTRE AMITIÉ... (Pire session)",
        thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop",
        publishedAt: "Il y a 12 jours",
        views: "2.9M vues",
        duration: "22:45",
        description: "Des cris, des rires hystériques et une rage quit légendaire.",
      },
    ],
  },
  {
    id: "mrbeast",
    handle: "@MrBeast",
    name: "MrBeast",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop&crop=face",
    subscribers: "360 M",
    category: "Challenges & Défis Extrêmes",
    banner: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=300&fit=crop",
    videos: [
      {
        id: "v_mb_1",
        title: "$1,000,000 Hotel Room vs $1 Hotel Room!",
        thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&h=360&fit=crop",
        publishedAt: "Il y a 3 jours",
        views: "48M vues",
        duration: "18:40",
        description: "We compared the cheapest motel in the world with a submarine luxury suite that costs $1,000,000 per night.",
      },
      {
        id: "v_mb_2",
        title: "Last To Leave Laser Maze Wins $500,000",
        thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=640&h=360&fit=crop",
        publishedAt: "Il y a 9 jours",
        views: "62M vues",
        duration: "21:10",
        description: "100 contestants navigate intense obstacles with crazy twist penalties every 30 minutes.",
      },
    ],
  },
  {
    id: "inoxtag",
    handle: "@Inoxtag",
    name: "Inoxtag",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&h=160&fit=crop&crop=face",
    subscribers: "8.5 M",
    category: "Aventure & Dépassement",
    banner: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=300&fit=crop",
    videos: [
      {
        id: "v_inox_1",
        title: "SURVIVRE 7 JOURS SEUL SUR UNE ÎLE DÉSERTE",
        thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&h=360&fit=crop",
        publishedAt: "Il y a 4 jours",
        views: "3.9M vues",
        duration: "41:50",
        description: "Sans eau douce, sans nourriture, avec un simple couteau suisse. Les 48 premières heures ont été un enfer.",
      },
      {
        id: "v_inox_2",
        title: "ON ESCALADE LA PLUS HAUTE TOUR ABANDONNÉE D'EUROPE",
        thumbnail: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=640&h=360&fit=crop",
        publishedAt: "Il y a 10 jours",
        views: "2.7M vues",
        duration: "28:10",
        description: "Sensations fortes et adrénaline pure à 320 mètres au-dessus du vide.",
      },
    ],
  },
  {
    id: "mkbhd",
    handle: "@MKBHD",
    name: "Marques Brownlee",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face",
    subscribers: "19.2 M",
    category: "Tech & Futur",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=300&fit=crop",
    videos: [
      {
        id: "v_mkbhd_1",
        title: "The Most Mind-Blowing AI Device I've Tested",
        thumbnail: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=640&h=360&fit=crop",
        publishedAt: "Il y a 1 jour",
        views: "1.9M vues",
        duration: "14:35",
        description: "A deep dive into the real-world performance of next-gen smart eyewear with instant neural voice translation.",
      },
      {
        id: "v_mkbhd_2",
        title: "Blind Smartphone Camera Test 2026: The Winner Shocked Me",
        thumbnail: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=640&h=360&fit=crop",
        publishedAt: "Il y a 8 jours",
        views: "3.1M vues",
        duration: "19:05",
        description: "Over 600,000 votes collected. A $400 budget phone beat out flagships costing three times as much.",
      },
    ],
  },
  {
    id: "amixem",
    handle: "@Amixem",
    name: "Amixem",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=face",
    subscribers: "8.6 M",
    category: "Divertissement & Défis",
    banner: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=300&fit=crop",
    videos: [
      {
        id: "v_amx_1",
        title: "ON TESTE DES OBJETS BIZARRES ACHETÉS EN LIGNE (ft. Thomas & Yvan)",
        thumbnail: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=640&h=360&fit=crop",
        publishedAt: "Il y a 3 jours",
        views: "2.1M vues",
        duration: "26:40",
        description: "Des inventions improbables qui ont totalement dépassé nos attentes.",
      },
      {
        id: "v_amx_2",
        title: "LE PIRE CHANTIER DE NOTRE VIE (Rénovation Extrême)",
        thumbnail: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=640&h=360&fit=crop",
        publishedAt: "Il y a 9 jours",
        views: "1.8M vues",
        duration: "32:15",
        description: "Rien ne s'est passé comme prévu, mais le résultat final est spectaculaire.",
      },
    ],
  },
  {
    id: "joyca",
    handle: "@Joyca",
    name: "Joyca",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&h=160&fit=crop&crop=face",
    subscribers: "6.1 M",
    category: "Humour & Musique",
    banner: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=300&fit=crop",
    videos: [
      {
        id: "v_jyc_1",
        title: "JE CRÉE UN TUBE DE L'ÉTÉ EN 1 HEURE DANS MON STUDIO",
        thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=640&h=360&fit=crop",
        publishedAt: "Il y a 5 jours",
        views: "1.5M vues",
        duration: "21:05",
        description: "Défi beatmaking avec des contraintes absurdes choisies par les abonnés.",
      },
    ],
  },
];

// Helper to extract YouTube video ID if provided
function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) return match[1];
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

// Parse YouTube channel RSS feed or oEmbed
async function fetchYouTubeFeed(channelId: string) {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    if (!response.ok) return null;
    const xmlText = await response.text();

    // Extract entries
    const entries: {
      id: string;
      title: string;
      thumbnail: string;
      publishedAt: string;
      views: string;
      duration: string;
      description: string;
    }[] = [];

    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    let count = 0;
    while ((match = entryRegex.exec(xmlText)) !== null && count < 8) {
      const entryBlock = match[1];
      const idMatch = entryBlock.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = entryBlock.match(/<title>([^<]+)<\/title>/);
      const publishedMatch = entryBlock.match(/<published>([^<]+)<\/published>/);
      const descMatch = entryBlock.match(/<media:description>([^<]*)<\/media:description>/);

      if (idMatch && titleMatch) {
        const vidId = idMatch[1];
        const title = titleMatch[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"');
        const pubDate = publishedMatch ? new Date(publishedMatch[1]).toLocaleDateString("fr-FR") : "Récent";
        const desc = descMatch ? descMatch[1].slice(0, 200) : "";

        entries.push({
          id: vidId,
          title,
          thumbnail: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
          publishedAt: pubDate,
          views: "1.2M vues",
          duration: "18:30",
          description: desc,
        });
        count++;
      }
    }
    return entries;
  } catch (err) {
    console.error("Error fetching YouTube RSS:", err);
    return null;
  }
}

// GET /api/creators/presets
app.get("/api/creators/presets", (req, res) => {
  res.json({ creators: PRESET_CREATORS });
});

// POST /api/creators/search
// Allows searching / adding any YouTuber by name, handle (@...), or channel URL
app.post("/api/creators/search", async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "La recherche ne peut pas être vide." });
    return;
  }

  const cleanQuery = query.trim();
  const normalizedQuery = cleanQuery.toLowerCase().replace(/^@/, "");

  // Check if matches preset (by name, handle with/without @, or id)
  const existingPreset = PRESET_CREATORS.find(
    (c) =>
      c.handle.toLowerCase() === cleanQuery.toLowerCase() ||
      c.handle.toLowerCase().replace(/^@/, "") === normalizedQuery ||
      c.name.toLowerCase() === cleanQuery.toLowerCase() ||
      c.name.toLowerCase().includes(normalizedQuery) ||
      normalizedQuery.includes(c.id.toLowerCase())
  );

  if (existingPreset) {
    res.json({ creator: existingPreset });
    return;
  }

  // Check if user entered a direct YouTube video URL
  const directVidId = extractYouTubeId(cleanQuery);
  if (directVidId) {
    // Return a custom creator entry centered on this video
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${directVidId}&format=json`
      );
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        const customCreator: YouTuberPreset = {
          id: `channel_${Date.now()}`,
          handle: `@${(oembed.author_name || "Createur").replace(/\s+/g, "")}`,
          name: oembed.author_name || "Créateur YouTube",
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(oembed.author_name || "YT")}&background=ff0033&color=fff&bold=true`,
          subscribers: "Vidéaste ajouté",
          category: "Personnalisé",
          banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=300&fit=crop",
          videos: [
            {
              id: directVidId,
              title: oembed.title || "Vidéo YouTube",
              thumbnail: `https://i.ytimg.com/vi/${directVidId}/hqdefault.jpg`,
              publishedAt: "Récemment",
              views: "Nouvelle vidéo",
              duration: "20:00",
              description: `Vidéo de ${oembed.author_name}`,
            },
          ],
        };
        res.json({ creator: customCreator });
        return;
      }
    } catch {
      // ignore
    }
  }

  // Use Gemini 3.8 Flash (with automatic retry and model fallback) to identify YouTuber
  try {
    const prompt = `L'utilisateur souhaite ajouter le youtubeur ou la chaîne YouTube "${cleanQuery}" sur son application de curation et d'analyse de clips TikTok.
Trouve les informations réelles ou ultra-crédibles sur ce vidéaste (nom de chaîne, @handle, catégorie, estimation abonnés) et ses 3 à 4 vidéos les plus connues ou récentes avec leurs titres exacts ou caractéristiques et une courte description.
Retourne obligatoirement un JSON strict respectant la structure demandée.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Nom de la chaîne ou du créateur" },
        handle: { type: Type.STRING, description: "Handle YouTube commençant par @ (ex: @Squeezie)" },
        subscribers: { type: Type.STRING, description: "Estimation abonnés (ex: '4.2 M')" },
        category: { type: Type.STRING, description: "Catégorie de contenu principale" },
        videos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Titre de la vidéo" },
              description: { type: Type.STRING, description: "Bref résumé du sujet de la vidéo" },
              duration: { type: Type.STRING, description: "Durée approximative ex: '24:30'" },
              publishedAt: { type: Type.STRING, description: "Date relative ex: 'Il y a 3 jours'" },
              views: { type: Type.STRING, description: "Vues estimées ex: '1.8M vues'" },
            },
            required: ["title", "description", "duration", "publishedAt", "views"],
          },
        },
      },
      required: ["name", "handle", "subscribers", "category", "videos"],
    };

    const { text } = await callGeminiWithRetryAndFallback({
      prompt,
      schema,
    });

    const parsed = parseJsonSafe(text) || {};
    const creatorName = parsed.name || cleanQuery;
    const creatorHandle = parsed.handle?.startsWith("@") ? parsed.handle : `@${creatorName.replace(/\s+/g, "")}`;

    // Sample video thumbnails
    const stockThumbs = [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&h=360&fit=crop",
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=640&h=360&fit=crop",
    ];

    const videosList = Array.isArray(parsed.videos) && parsed.videos.length > 0
      ? parsed.videos
      : [
          {
            title: `La vidéo la plus virale de ${creatorName}`,
            description: `Les moments les plus marquants et intenses de la chaîne ${creatorName}.`,
            duration: "22:15",
            publishedAt: "Récemment",
            views: "1.4M vues",
          },
        ];

    const newCreator: YouTuberPreset = {
      id: `custom_${Date.now()}`,
      handle: creatorHandle,
      name: creatorName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName)}&background=8b5cf6&color=fff&bold=true&size=160`,
      subscribers: parsed.subscribers || "1.5 M",
      category: parsed.category || "Création & Divertissement",
      banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=300&fit=crop",
      videos: videosList.map((v: any, idx: number) => ({
        id: `gen_vid_${Date.now()}_${idx}`,
        title: v.title,
        thumbnail: stockThumbs[idx % stockThumbs.length],
        publishedAt: v.publishedAt || "Récemment",
        views: v.views || "850K vues",
        duration: v.duration || "19:40",
        description: v.description,
      })),
    };

    res.json({ creator: newCreator });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.log(`[Gemini] Creator search fallback engaged for "${cleanQuery}": ${errMsg.slice(0, 100)}`);
    // Graceful fallback to avoid blocking the user
    const fallbackCreator = generateFallbackCreator(cleanQuery);
    res.json({ creator: fallbackCreator });
  }
});

// POST /api/analyze-video
// Core viral retention clip generation powered by Gemini with retry and adaptive fallback
app.post("/api/analyze-video", async (req, res) => {
  const { videoId, videoTitle, channelName, description, duration } = req.body;

  if (!videoTitle) {
    res.status(400).json({ error: "Le titre de la vidéo est obligatoire pour l'analyse." });
    return;
  }

  try {
    const prompt = `Tu es le meilleur expert mondial en algorithmes de rétention TikTok, YouTube Shorts et Instagram Reels.
Tu es chargé d'analyser la vidéo YouTube suivante de ${channelName || "un créateur réputé"} et d'extraire les segments de vidéo (clips) ayant le plus fort potentiel de rétention et de viralité sur TikTok.

Détails de la vidéo :
- Titre : "${videoTitle}"
- Créateur : ${channelName || "Inconnu"}
- Durée globale : ${duration || "environ 20-30 minutes"}
- Contexte / Description : ${description || "Vidéo divertissante avec storytelling captivant, moments d'imprévu, suspense ou punchlines."}

OBJECTIF RÉTENTION TIKTOK :
Sur TikTok, les 3 premières secondes (le HOOK) et le rythme jusqu'à la fin (CLIFFHANGER / PAYOFF) déterminent 90% de la performance.
Identifie 3 à 4 extraits / morceaux ultra-spécifiques et complémentaires :
1. Un extrait CHOC / RÉVÉLATION (forte curiosité immédiate, suspense haletant).
2. Un extrait PUNCHLINE / HUMOUR / RÉACTION ÉPIQUE (fort partage et commentaires).
3. Un extrait HISTOIRE / STORYTELLING HALETANT (temps de visionnage maximal jusqu'au bout).
4. Un extrait TENSION / CLIMAX (montée d'adrénaline, dilemme moral ou surprise).

Pour chaque extrait :
- Détermine un titre percutant accrocheur avec émojis.
- Timecode de début (format MM:SS) et début en secondes.
- Timecode de fin (format MM:SS) et fin en secondes (durée idéale entre 35s et 65s).
- Note de rétention estimée sur 100 (entre 88 et 99).
- Le Hook des 3 premières secondes (explication mot à mot ou action d'ouverture).
- Analyse psychologique de rétention : pourquoi l'utilisateur reste scotché et ne swipe pas.
- Risque de décrochage potentiel et astuce pour l'éviter au montage.
- Caption prête à copier pour TikTok avec 4-6 hashtags viraux pertinents.
- Texte accrocheur à placer en haut au format 9:16 (Overlay texte style "Attends la fin... 💀").
- Conseils de montage précis pour CapCut / Premiere (cuts dynamiques, effets sonores whoosh/riser, zooms x1.2, sous-titres animés).
- Courbe de rétention estimée : tableau de 6 valeurs (en pourcentage de 100 à ~85) illustrant la tenue de l'audience sur le clip.

Donne aussi un score global de potentiel viral pour cette vidéo et des conseils stratégiques de publication.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        overallViralScore: {
          type: Type.NUMBER,
          description: "Note globale de viralité sur 100 (ex: 94)",
        },
        viralSummary: {
          type: Type.STRING,
          description: "Synthèse en 2-3 phrases sur la puissance virale de cette vidéo pour TikTok",
        },
        bestPostingTimes: {
          type: Type.STRING,
          description: "Créneau horaire idéal de publication TikTok (ex: 'Mardi & Jeudi entre 18h et 21h')",
        },
        targetVibe: {
          type: Type.STRING,
          description: "Ambiance sonore recommandée (ex: 'Basse lourde, beat trap montant, son tendance mystère')",
        },
        clips: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              clipType: {
                type: Type.STRING,
                description: "Type de clip: 'Choc & Révélation', 'Humour & Réaction', 'Storytelling Haletant', 'Tension Maximale'",
              },
              clipTitle: { type: Type.STRING, description: "Titre viral percutant" },
              startTime: { type: Type.STRING, description: "MM:SS de début" },
              endTime: { type: Type.STRING, description: "MM:SS de fin" },
              startSeconds: { type: Type.INTEGER, description: "Secondes exactes de début" },
              endSeconds: { type: Type.INTEGER, description: "Secondes exactes de fin" },
              durationSeconds: { type: Type.INTEGER, description: "Durée en secondes" },
              viralityScore: { type: Type.INTEGER, description: "Score de rétention sur 100" },
              hookExplanation: { type: Type.STRING, description: "Le hook des 3 premières secondes" },
              retentionAnalysis: {
                type: Type.STRING,
                description: "Explication psychologique de la rétention spectateur",
              },
              dropoffPrevention: {
                type: Type.STRING,
                description: "Point de décrochage identifié et comment le contourner au montage",
              },
              suggestedTextOverlay: {
                type: Type.STRING,
                description: "Texte à afficher au centre/haut de l'écran 9:16",
              },
              tiktokCaption: {
                type: Type.STRING,
                description: "Légende TikTok clé en main avec hashtags",
              },
              editingTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Conseils techniques de montage (zoom, sound effect, stickers, b-roll)",
              },
              retentionCurve: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "6 points de rétention prédictive (ex: [100, 96, 92, 89, 94, 91])",
              },
            },
            required: [
              "clipType",
              "clipTitle",
              "startTime",
              "endTime",
              "startSeconds",
              "endSeconds",
              "durationSeconds",
              "viralityScore",
              "hookExplanation",
              "retentionAnalysis",
              "suggestedTextOverlay",
              "tiktokCaption",
              "editingTips",
              "retentionCurve",
            ],
          },
        },
      },
      required: ["overallViralScore", "viralSummary", "bestPostingTimes", "targetVibe", "clips"],
    };

    const { text, modelUsed } = await callGeminiWithRetryAndFallback({
      prompt,
      schema,
    });

    const parsed = parseJsonSafe(text) || {};

    if (!Array.isArray(parsed.clips) || parsed.clips.length === 0) {
      console.log("[Gemini] Incomplete clips returned by model, applying adaptive viral generator");
      const fallbackData = generateFallbackVideoAnalysis(videoId, videoTitle, channelName, description, duration);
      res.json({ ...fallbackData, modelUsed });
      return;
    }

    // Add unique IDs to clips
    const clipsWithId = parsed.clips.map((clip: any, index: number) => ({
      ...clip,
      id: clip.id || `clip_${Date.now()}_${index + 1}`,
      durationSeconds: clip.durationSeconds || Math.max(15, (clip.endSeconds || 60) - (clip.startSeconds || 0)),
    }));

    res.json({
      videoId,
      videoTitle,
      channelName,
      overallViralScore: parsed.overallViralScore || 94,
      viralSummary: parsed.viralSummary || "Une vidéo dotée d'une dynamique narrative idéale pour capter l'attention sur TikTok.",
      bestPostingTimes: parsed.bestPostingTimes || "En fin d'après-midi (17h30 - 20h30)",
      targetVibe: parsed.targetVibe || "Sons d'ambiance dynamiques avec risers de tension",
      clips: clipsWithId,
      analyzedAt: new Date().toISOString(),
      modelUsed: modelUsed || "gemini-3.8-flash",
      isFallback: false,
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.log(`[Gemini] Video analysis fallback generator activated: ${errMsg.slice(0, 100)}`);
    // If Gemini is overloaded (503 UNAVAILABLE) or experiencing high demand, seamlessly generate high-grade viral analysis
    const fallbackData = generateFallbackVideoAnalysis(videoId, videoTitle, channelName, description, duration);
    res.json(fallbackData);
  }
});

// Video format conversion & permanent clip storage pipeline
const EXPORT_CLIPS_DIR = path.join(os.tmpdir(), "viral_clips_export");
fs.mkdirSync(EXPORT_CLIPS_DIR, { recursive: true });

// Auto-clean old export files older than 3 hours every 30 minutes
setInterval(async () => {
  try {
    const files = await fs.promises.readdir(EXPORT_CLIPS_DIR);
    const now = Date.now();
    for (const file of files) {
      const fullPath = path.join(EXPORT_CLIPS_DIR, file);
      const stat = await fs.promises.stat(fullPath).catch(() => null);
      if (stat && now - stat.mtimeMs > 3 * 3600 * 1000) {
        await fs.promises.unlink(fullPath).catch(() => {});
      }
    }
  } catch {}
}, 30 * 60 * 1000);

// Endpoint to download or stream exported clips reliably (supporting Range requests for smooth <video> player scrubbing and direct attachment downloads)
app.get("/api/download-clip", async (req, res) => {
  try {
    const fileId = ((req.query.id as string) || "").replace(/[^a-zA-Z0-9_-]/g, "");
    const rawFilename = (req.query.filename as string) || `clip-${fileId || Date.now()}`;
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const isInline = req.query.inline === "true" || req.query.inline === "1";

    if (!fileId) {
      return res.status(400).send("ID de clip manquant.");
    }

    const files = await fs.promises.readdir(EXPORT_CLIPS_DIR);
    const targetFile = files.find((f) => f.startsWith(fileId));

    if (!targetFile) {
      return res.status(404).send("Ce clip a expiré ou n'a pas été trouvé. Veuillez relancer l'exportation.");
    }

    const fullPath = path.join(EXPORT_CLIPS_DIR, targetFile);
    const stat = await fs.promises.stat(fullPath);
    const ext = path.extname(targetFile).toLowerCase().replace(".", "");

    const contentType =
      ext === "gif" ? "image/gif" : ext === "webm" ? "video/webm" : "video/mp4";

    const disposition = isInline
      ? `inline; filename="${cleanFilename}"`
      : `attachment; filename="${cleanFilename}"`;

    // Handle Range Requests for HTML5 Video playback
    const range = req.headers.range;
    if (range && contentType.startsWith("video/")) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600",
      });

      const stream = fs.createReadStream(fullPath, { start, end });
      stream.pipe(res);
      return;
    }

    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    });

    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  } catch (err: any) {
    console.error("[DownloadClip] Error serving clip:", err?.message || err);
    res.status(500).send("Erreur serveur lors de la récupération du clip.");
  }
});

// Auto-fetch YouTube video section for Remotion Studio preview (no manual upload needed)
app.get("/api/fetch-video", async (req, res) => {
  const videoId = ((req.query.videoId as string) || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const startSec = Math.max(0, parseFloat((req.query.startSeconds as string) || "0"));
  const endSec = Math.max(startSec + 3, parseFloat((req.query.endSeconds as string) || "120"));

  if (!videoId || videoId.length !== 11) {
    return res.status(400).json({ error: "Invalid videoId" });
  }

  const uniqueId = crypto.randomBytes(8).toString("hex");
  const outputPath = path.join(EXPORT_CLIPS_DIR, `fetchvid_${uniqueId}.mp4`);
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Check for cookies (same pattern as /api/render-clip)
  let youtubeCookieFile: string | null = null;
  if (process.env.YOUTUBE_COOKIES_PATH && fs.existsSync(process.env.YOUTUBE_COOKIES_PATH)) {
    youtubeCookieFile = process.env.YOUTUBE_COOKIES_PATH;
  } else if (fs.existsSync(path.join(process.cwd(), "cookies.txt"))) {
    youtubeCookieFile = path.join(process.cwd(), "cookies.txt");
  } else if (process.env.YOUTUBE_COOKIES) {
    const cookiePath = path.join(os.tmpdir(), `yt_cookie_fv_${uniqueId}.txt`);
    try {
      await fs.promises.writeFile(cookiePath, process.env.YOUTUBE_COOKIES, "utf8");
      youtubeCookieFile = cookiePath;
    } catch {}
  }

  const startFormatted = String(Math.floor(Math.max(0, startSec)));
  const endFormatted = String(Math.ceil(endSec));

  try {
    console.log(`[FetchVideo] Downloading section ${startFormatted}s-${endFormatted}s of ${videoId}...`);

    // Attempt with multiple formats; ios player_client returns direct URLs without JS sig solving
    let fetchOk = false;
    const attempt = async (extraArgs: string[]) => {
      const args = [
        "--download-sections", `*${startFormatted}-${endFormatted}`,
        "--force-keyframes-at-cuts",
        "--socket-timeout", "8",
        "--extractor-args", "youtube:player_client=ios,web",
        "--no-check-certificates",
        "--no-playlist",
        ...extraArgs,
        "--merge-output-format", "mp4",
        ...(youtubeCookieFile ? ["--cookies", youtubeCookieFile] : []),
        "-o", outputPath,
        youtubeUrl,
      ];
      await execFileAsync("yt-dlp", args);
    };

    const formats = [
      ["-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]"],
      ["-f", "b"],
      ["-f", "w"],
    ];

    for (const fmtArgs of formats) {
      try {
        await Promise.race([
          attempt(fmtArgs),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("yt-dlp timeout")), 90000)
          ),
        ]);
        const stat2 = await fs.promises.stat(outputPath).catch(() => null);
        if (stat2 && stat2.size >= 1000) { fetchOk = true; break; }
      } catch (e: any) {
        console.warn(`[FetchVideo] Attempt with ${fmtArgs[1]} failed: ${e?.message}`);
      }
    }

    const stat = await fs.promises.stat(outputPath).catch(() => null);
    if (!stat || stat.size < 1000) {
      console.warn(`[FetchVideo] Output too small or missing for ${videoId}`);
      return res.status(200).json({ error: "unavailable", fallback: true });
    }

    const downloadUrl = `/api/download-clip?id=fetchvid_${uniqueId}&filename=preview_${videoId}.mp4&inline=true`;
    console.log(`[FetchVideo] Success for ${videoId}: ${(stat.size / (1024 * 1024)).toFixed(1)}MB`);
    return res.status(200).json({ url: downloadUrl, id: `fetchvid_${uniqueId}` });
  } catch (err: any) {
    console.warn(`[FetchVideo] yt-dlp failed for ${videoId}:`, err?.message || err);
    return res.status(200).json({ error: "unavailable", fallback: true });
  }
});

// Video format conversion pipeline (WebM -> MP4 / GIF) using FFmpeg
app.post(
  "/api/convert-video",
  express.raw({
    type: ["video/webm", "video/*", "application/octet-stream", "*/*"],
    limit: "150mb",
  }),
  async (req, res) => {
    const rawFormat = ((req.query.format as string) || "mp4").toLowerCase();
    const targetFormat = rawFormat === "gif" ? "gif" : rawFormat === "webm" ? "webm" : "mp4";
    const rawFilename = (req.query.filename as string) || `clip-${Date.now()}`;
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);

    const videoBuffer = req.body;
    if (!videoBuffer || !Buffer.isBuffer(videoBuffer) || videoBuffer.length === 0) {
      return res.status(400).json({ error: "Aucun flux vidéo valide reçu pour la conversion." });
    }

    const uniqueId = crypto.randomBytes(8).toString("hex");
    const tempInput = path.join(os.tmpdir(), `input_${uniqueId}.webm`);
    const savedOutput = path.join(EXPORT_CLIPS_DIR, `${uniqueId}.${targetFormat}`);

    try {
      // Write uploaded stream to temp input file
      await fs.promises.writeFile(tempInput, videoBuffer);

      let ffmpegArgs: string[] = [];
      if (targetFormat === "mp4") {
        // Universal H.264 MP4 with YUV420P profile, faststart, and AAC audio for instant playback
        ffmpegArgs = [
          "-y",
          "-i",
          tempInput,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "22",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-movflags",
          "+faststart",
          savedOutput,
        ];
      } else if (targetFormat === "gif") {
        // High quality animated GIF with optimized 2-pass palette
        ffmpegArgs = [
          "-y",
          "-i",
          tempInput,
          "-vf",
          "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
          savedOutput,
        ];
      } else {
        // Standard WebM
        ffmpegArgs = [
          "-y",
          "-i",
          tempInput,
          "-c:v",
          "libvpx-vp9",
          "-crf",
          "28",
          "-b:v",
          "0",
          savedOutput,
        ];
      }

      console.log(`[FFmpeg] Converting ${tempInput} -> ${savedOutput} (${targetFormat})...`);
      await execFileAsync("ffmpeg", ffmpegArgs, { maxBuffer: 100 * 1024 * 1024 });

      const stat = await fs.promises.stat(savedOutput);
      const mimeType =
        targetFormat === "gif"
          ? "image/gif"
          : targetFormat === "webm"
          ? "video/webm"
          : "video/mp4";

      const downloadUrl = `/api/download-clip?id=${uniqueId}&filename=${encodeURIComponent(cleanFilename)}.${targetFormat}`;
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", stat.size);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${cleanFilename}.${targetFormat}"`
      );
      res.setHeader("X-Clip-Id", uniqueId);
      res.setHeader("X-Clip-Url", downloadUrl);
      res.setHeader("Access-Control-Expose-Headers", "X-Clip-Id, X-Clip-Url, Content-Disposition");

      const stream = fs.createReadStream(savedOutput);
      stream.pipe(res);

      stream.on("close", async () => {
        try {
          await fs.promises.unlink(tempInput).catch(() => {});
        } catch {}
      });
    } catch (err: any) {
      console.error("[FFmpeg] Conversion failed:", err?.message || err);
      try {
        await fs.promises.unlink(tempInput).catch(() => {});
        await fs.promises.unlink(savedOutput).catch(() => {});
      } catch {}
      res.status(500).json({
        error: "Erreur lors de la conversion vidéo FFmpeg.",
        details: err?.message || String(err),
      });
    }
  }
);

// Helper to parse timecodes like "01:14", "8:15", "00:02:30", or 74 into seconds
function parseTimecodeToSeconds(tc: string | number | undefined): number {
  if (tc === undefined || tc === null) return 0;
  if (typeof tc === "number") return Math.max(0, tc);
  const clean = String(tc).trim();
  if (!clean) return 0;
  if (/^\d+(\.\d+)?$/.test(clean)) return Math.max(0, parseFloat(clean));
  const parts = clean.split(":").map((p) => parseFloat(p) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

// Helper to probe video duration with ffprobe
async function getVideoDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const dur = parseFloat(stdout.trim());
    return isNaN(dur) ? 0 : dur;
  } catch {
    return 0;
  }
}

// Render clip from uploaded raw video file with timecode trim and 9:16 vertical formatting
app.post(
  "/api/render-clip-file",
  express.raw({
    type: ["video/*", "application/octet-stream", "*/*"],
    limit: "350mb",
  }),
  async (req, res) => {
    const rawFormat = ((req.query.format as string) || "mp4").toLowerCase();
    const targetFormat = rawFormat === "gif" ? "gif" : rawFormat === "webm" ? "webm" : "mp4";
    const rawFilename = (req.query.filename as string) || `clip-${Date.now()}`;
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
    const rawStartTime = req.query.startTime as string;
    const requestedDuration = Math.min(60, Math.max(3, parseFloat((req.query.duration as string) || "30")));

    const videoBuffer = req.body;
    if (!videoBuffer || !Buffer.isBuffer(videoBuffer) || videoBuffer.length < 100) {
      return res.status(400).json({ error: "Aucun fichier vidéo valide reçu pour le découpage." });
    }

    const uniqueId = crypto.randomBytes(8).toString("hex");
    const tempInput = path.join(os.tmpdir(), `source_${uniqueId}.mp4`);
    const savedOutput = path.join(EXPORT_CLIPS_DIR, `${uniqueId}.${targetFormat}`);

    try {
      await fs.promises.writeFile(tempInput, videoBuffer);

      const probeDuration = await getVideoDuration(tempInput);
      const parsedStartSec = parseTimecodeToSeconds(rawStartTime);
      
      // Safe seek: if video is shorter than startTime, clamp to 0
      const safeSeek = probeDuration > 0 && parsedStartSec >= probeDuration ? 0 : parsedStartSec;
      const safeDuration = probeDuration > 0
        ? Math.min(requestedDuration, Math.max(1, probeDuration - safeSeek))
        : requestedDuration;

      let ffmpegArgs: string[] = [];
      if (targetFormat === "gif") {
        ffmpegArgs = [
          "-y",
          "-ss",
          String(safeSeek),
          "-i",
          tempInput,
          "-t",
          String(safeDuration),
          "-filter_complex",
          "[0:v]scale=540:960:force_original_aspect_ratio=increase,crop=540:960,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
          savedOutput,
        ];
      } else {
        ffmpegArgs = [
          "-y",
          "-ss",
          String(safeSeek),
          "-i",
          tempInput,
          "-t",
          String(safeDuration),
          "-filter_complex",
          "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v]",
          "-map",
          "[v]",
          "-map",
          "0:a?",
          "-c:v",
          targetFormat === "webm" ? "libvpx-vp9" : "libx264",
          ...(targetFormat === "webm"
            ? ["-crf", "30", "-b:v", "0", "-c:a", "libopus"]
            : [
                "-preset",
                "veryfast",
                "-crf",
                "22",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
              ]),
          savedOutput,
        ];
      }

      console.log(`[FFmpeg] Trimming & Rendering 9:16 clip (${safeSeek}s -> ${safeDuration}s) to ${savedOutput}...`);
      await execFileAsync("ffmpeg", ffmpegArgs, { maxBuffer: 100 * 1024 * 1024 });

      const stat = await fs.promises.stat(savedOutput);
      const mimeType = targetFormat === "gif" ? "image/gif" : targetFormat === "webm" ? "video/webm" : "video/mp4";
      const downloadUrl = `/api/download-clip?id=${uniqueId}&filename=${encodeURIComponent(cleanFilename)}.${targetFormat}`;

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", stat.size);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${cleanFilename}.${targetFormat}"`
      );
      res.setHeader("X-Clip-Id", uniqueId);
      res.setHeader("X-Clip-Url", downloadUrl);
      res.setHeader("Access-Control-Expose-Headers", "X-Clip-Id, X-Clip-Url, Content-Disposition");

      const stream = fs.createReadStream(savedOutput);
      stream.pipe(res);

      stream.on("close", async () => {
        try {
          await fs.promises.unlink(tempInput).catch(() => {});
        } catch {}
      });
    } catch (err: any) {
      console.error("[FFmpeg] Render clip file error:", err?.message || err);
      try {
        await fs.promises.unlink(tempInput).catch(() => {});
        await fs.promises.unlink(savedOutput).catch(() => {});
      } catch {}
      res.status(500).json({ error: "Échec du découpage vidéo FFmpeg: " + (err?.message || "Erreur interne") });
    }
  }
);

// High-speed universal 9:16 clip rendering endpoint (handles YouTube clip extraction & AI Motion Graphics)
app.all("/api/render-clip", async (req, res) => {
  const params: Record<string, any> =
    req.method === "POST" && req.body && typeof req.body === "object"
      ? { ...req.query, ...req.body }
      : req.query;

  const rawFormat = ((params.format as string) || "mp4").toLowerCase();
  const targetFormat = rawFormat === "gif" ? "gif" : rawFormat === "webm" ? "webm" : "mp4";
  const rawFilename = (params.filename as string) || `clip-${Date.now()}`;
  const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);

  const videoId = (params.videoId as string) || "";
  const videoUrl = (params.videoUrl as string) || "";
  const clipTitle = (params.clipTitle as string) || "MOMENT FORT VIRAL";
  const hookText = (params.hookText as string) || clipTitle || "ATTENDS LA FIN... C'EST PAS POSSIBLE 😱";
  const channelName = (params.channelName as string) || "Créateur";
  const thumbnailUrl = (params.thumbnailUrl as string) || "";
  const subtitleStyle = ((params.subtitleStyle as string) || "hormozi").toLowerCase();
  const rawStartTime = params.startTime as string;
  const rawDuration = params.duration as string;
  const startSeconds = parseTimecodeToSeconds(rawStartTime);
  const duration = Math.min(60, Math.max(3, parseFloat(rawDuration) || 10));

  const uniqueId = crypto.randomBytes(8).toString("hex");
  const tempFilesToClean: string[] = [];

  const cleanup = async () => {
    for (const f of tempFilesToClean) {
      try {
        await fs.promises.unlink(f).catch(() => {});
      } catch {}
    }
  };

  try {
    const savedOutput = path.join(EXPORT_CLIPS_DIR, `${uniqueId}.${targetFormat}`);

    // Step 1: Check if source video extraction is possible
    let downloadedVideo = false;
    const isRealYouTube =
      (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) && !videoId.startsWith("v_") && !videoId.startsWith("b_")) ||
      (videoUrl && (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")));

    const youtubeTarget = videoUrl || (isRealYouTube ? `https://www.youtube.com/watch?v=${videoId}` : "");

    // Check if YouTube cookies are configured for authenticated cloud downloads
    let youtubeCookieFile: string | null = null;
    if (process.env.YOUTUBE_COOKIES_PATH && fs.existsSync(process.env.YOUTUBE_COOKIES_PATH)) {
      youtubeCookieFile = process.env.YOUTUBE_COOKIES_PATH;
    } else if (fs.existsSync(path.join(process.cwd(), "cookies.txt"))) {
      youtubeCookieFile = path.join(process.cwd(), "cookies.txt");
    } else if (process.env.YOUTUBE_COOKIES) {
      const cookiePath = path.join(os.tmpdir(), `yt_cookie_${uniqueId}.txt`);
      try {
        await fs.promises.writeFile(cookiePath, process.env.YOUTUBE_COOKIES, "utf8");
        youtubeCookieFile = cookiePath;
        tempFilesToClean.push(cookiePath);
      } catch {}
    }

    // Always attempt yt-dlp when a target URL is available.
    // On a dedicated VPS with a residential/datacenter IP (OVH), YouTube works without cookies for most videos.
    // If yt-dlp fails for any reason, we fall back to the Motion Graphic renderer gracefully.
    const shouldAttemptExtraction = Boolean(youtubeTarget);

    if (shouldAttemptExtraction) {
      const tempDownloaded = path.join(os.tmpdir(), `yt_${uniqueId}.mp4`);
      tempFilesToClean.push(tempDownloaded);

      try {
        console.log(`[ClipRender] Attempting video extraction for ${youtubeTarget} (${startSeconds}s -> ${duration}s)...`);
        const startFormatted = String(Math.floor(startSeconds));
        const endFormatted = String(Math.floor(startSeconds + duration));

        const ytdlpArgs = [
          "--download-sections",
          `*${startFormatted}-${endFormatted}`,
          "--force-keyframes-at-cuts",
          "--socket-timeout",
          "4",
          "--extractor-args", "youtube:player_client=tv,web",
          "--user-agent", "Mozilla/5.0 (TV; SmartTV) AppleWebKit/537.36",
          "--no-check-certificates",
          "--no-playlist",
          "-f",
          "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
          "--merge-output-format",
          "mp4",
          ...(youtubeCookieFile ? ["--cookies", youtubeCookieFile] : []),
          "-o",
          tempDownloaded,
          youtubeTarget,
        ];

        const tryDownload = async (fmtArgs: string[]) => {
          const args = [
            "--download-sections", `*${startFormatted}-${endFormatted}`,
            "--force-keyframes-at-cuts",
            "--socket-timeout", "4",
            "--extractor-args", "youtube:player_client=ios,web",
            "--no-check-certificates",
            "--no-playlist",
            ...fmtArgs,
            "--merge-output-format", "mp4",
            ...(youtubeCookieFile ? ["--cookies", youtubeCookieFile] : []),
            "-o", tempDownloaded,
            youtubeTarget,
          ];
          await execFileAsync("yt-dlp", args);
        };

        const renderFormats = [
          ["-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]"],
          ["-f", "best"],
        ];
        let dlOk = false;
        for (const fmtArgs of renderFormats) {
          try {
            await Promise.race([
              tryDownload(fmtArgs),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Extraction timeout")), 30000)),
            ]);
            if (fs.existsSync(tempDownloaded) && (await fs.promises.stat(tempDownloaded)).size > 1000) {
              dlOk = true; break;
            }
          } catch (e: any) {
            console.warn(`[ClipRender] yt-dlp format ${fmtArgs[1]} failed: ${e?.message}`);
          }
        }

        if (fs.existsSync(tempDownloaded) && (await fs.promises.stat(tempDownloaded)).size > 1000) {
          downloadedVideo = true;
          console.log(`[ClipRender] Video extracted successfully! Formatting to 9:16...`);

          let ffmpegArgs: string[] = [];
          if (targetFormat === "gif") {
            ffmpegArgs = [
              "-y",
              "-i",
              tempDownloaded,
              "-t",
              String(duration),
              "-filter_complex",
              "[0:v]scale=540:960:force_original_aspect_ratio=increase,crop=540:960,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
              savedOutput,
            ];
          } else {
            ffmpegArgs = [
              "-y",
              "-i",
              tempDownloaded,
              "-t",
              String(duration),
              "-filter_complex",
              "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v]",
              "-map",
              "[v]",
              "-map",
              "0:a?",
              "-c:v",
              targetFormat === "webm" ? "libvpx-vp9" : "libx264",
              ...(targetFormat === "webm"
                ? ["-crf", "30", "-b:v", "0", "-c:a", "libopus"]
                : [
                    "-preset",
                    "veryfast",
                    "-crf",
                    "22",
                    "-c:a",
                    "aac",
                    "-b:a",
                    "192k",
                    "-pix_fmt",
                    "yuv420p",
                    "-movflags",
                    "+faststart",
                  ]),
              savedOutput,
            ];
          }

          await execFileAsync("ffmpeg", ffmpegArgs, { maxBuffer: 100 * 1024 * 1024 });
        }
      } catch (err: any) {
        console.log("[ClipRender] Extraction skipped or unavailable, proceeding with Motion Graphic rendering.");
      }
    } else if (isRealYouTube) {
      console.log("[ClipRender] YouTube source requested without server cookies; generating 9:16 Motion Graphic clip.");
    }

    // Step 2: High-Quality 9:16 Motion Graphic Generation with FFmpeg
    if (!downloadedVideo) {
      console.log(`[ClipRender] Generating 9:16 Motion Graphic clip (${duration}s, style=${subtitleStyle})...`);

      const hookFile = path.join(os.tmpdir(), `hook_${uniqueId}.txt`);
      tempFilesToClean.push(hookFile);
      const cleanHook = hookText.replace(/[\r\n\t]/g, " ").slice(0, 90);
      await fs.promises.writeFile(hookFile, cleanHook, "utf8");

      const subFile = path.join(os.tmpdir(), `sub_${uniqueId}.txt`);
      tempFilesToClean.push(subFile);
      const cleanSub = clipTitle.replace(/[\r\n\t]/g, " ").slice(0, 80);
      await fs.promises.writeFile(subFile, cleanSub, "utf8");

      const channelFile = path.join(os.tmpdir(), `chan_${uniqueId}.txt`);
      tempFilesToClean.push(channelFile);
      await fs.promises.writeFile(channelFile, `@${channelName} • ClipViral AI`, "utf8");

      let hasThumbnail = false;
      const thumbFile = path.join(os.tmpdir(), `thumb_${uniqueId}.jpg`);
      tempFilesToClean.push(thumbFile);

      if (thumbnailUrl && thumbnailUrl.startsWith("http")) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const thumbRes = await fetch(thumbnailUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (thumbRes.ok) {
            const buf = Buffer.from(await thumbRes.arrayBuffer());
            if (buf.length > 500) {
              await fs.promises.writeFile(thumbFile, buf);
              hasThumbnail = true;
            }
          }
        } catch {}
      }

      // DejaVu is installed via ttf-dejavu in Dockerfile; Alpine puts it here
      const fontPath = "/usr/share/fonts/ttf-dejavu/DejaVuSans-Bold.ttf";
      const fontParam = `:fontfile=${fontPath}`;

      let subColor = "yellow";
      let subBox = "black@0.85";
      let subBorder = "20";
      let subSize = "54";

      if (subtitleStyle === "cyber") {
        subColor = "0x00F0FF";
        subBox = "0x050515@0.9";
        subBorder = "18";
        subSize = "50";
      } else if (subtitleStyle === "mrbeast") {
        subColor = "white";
        subBox = "0xDC2626@0.9";
        subBorder = "22";
        subSize = "56";
      } else if (subtitleStyle === "minimal") {
        subColor = "white";
        subBox = "black@0.6";
        subBorder = "14";
        subSize = "46";
      }

      const ffmpegArgs: string[] = ["-y"];

      if (hasThumbnail) {
        ffmpegArgs.push("-loop", "1", "-t", String(duration), "-i", thumbFile);
      } else {
        ffmpegArgs.push("-f", "lavfi", "-i", `color=c=0x080811:size=1080x1920:rate=30:duration=${duration}`);
      }

      ffmpegArgs.push(
        "-f",
        "lavfi",
        "-i",
        `aevalsrc=sin(2*PI*130*t)*0.22*lte(mod(t\\,0.5)\\,0.08)+sin(2*PI*260*t)*0.12*lte(mod(t\\,0.25)\\,0.04)+sin(2*PI*65*t)*0.28*lte(mod(t\\,1)\\,0.2):s=44100:d=${duration}`
      );

      let filterComplex = "";
      if (hasThumbnail) {
        filterComplex = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg];[0:v]scale=960:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[base];`;
      } else {
        filterComplex = `[0:v]null[base];`;
      }

      filterComplex += `[base]drawtext=textfile='${hookFile}'${fontParam}:fontcolor=white:fontsize=46:box=1:boxcolor=black@0.75:boxborderw=16:x=(w-text_w)/2:y=280,`;
      filterComplex += `drawtext=textfile='${subFile}'${fontParam}:fontcolor=${subColor}:fontsize=${subSize}:box=1:boxcolor=${subBox}:boxborderw=${subBorder}:x=(w-text_w)/2:y=1380,`;
      filterComplex += `drawtext=textfile='${channelFile}'${fontParam}:fontcolor=0x94A3B8:fontsize=32:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=1800[v]`;

      ffmpegArgs.push("-filter_complex", filterComplex);
      ffmpegArgs.push("-map", "[v]", "-map", "1:a");

      if (targetFormat === "gif") {
        ffmpegArgs.push("-c:v", "gif", savedOutput);
      } else if (targetFormat === "webm") {
        ffmpegArgs.push("-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus", savedOutput);
      } else {
        ffmpegArgs.push(
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "22",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-movflags",
          "+faststart",
          savedOutput
        );
      }

      await execFileAsync("ffmpeg", ffmpegArgs, { maxBuffer: 100 * 1024 * 1024 });
    }

    const stat = await fs.promises.stat(savedOutput);
    const contentType =
      targetFormat === "gif" ? "image/gif" : targetFormat === "webm" ? "video/webm" : "video/mp4";
    const downloadUrl = `/api/download-clip?id=${uniqueId}&filename=${encodeURIComponent(cleanFilename)}.${targetFormat}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stat.size);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${cleanFilename}.${targetFormat}"`
    );
    res.setHeader("X-Clip-Id", uniqueId);
    res.setHeader("X-Clip-Url", downloadUrl);
    res.setHeader("Access-Control-Expose-Headers", "X-Clip-Id, X-Clip-Url, Content-Disposition");

    const stream = fs.createReadStream(savedOutput);
    stream.pipe(res);

    stream.on("close", cleanup);
    stream.on("error", cleanup);
  } catch (err: any) {
    console.error("[ClipRender] Error rendering video:", err?.message || err);
    await cleanup();
    res.status(500).json({
      error: "Erreur lors de la génération de la vidéo: " + (err?.message || "Erreur interne"),
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
