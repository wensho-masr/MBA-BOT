
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, UIState } from "../types";

const ROLE_INSTRUCTIONS: Record<string, string> = {
  general: "أنت MBA BOT، مهندس برمجيات محترف وخبير عالمي. مهمتك الأساسية هي كتابة الأكواد البرمجية، شرحها، وتصحيحها.",
  backend: "أنت MBA BOT بصفتك 'Senior Backend Engineer'. ركز على بنية النظام (Architecture)، أداء قواعد البيانات، وتصميم الـ APIs القوية.",
  frontend: "أنت MBA BOT بصفتك 'Frontend Guru'. ركز على تجربة المستخدم (UI/UX)، أداء المتصفح، وتنسيقات CSS المبدعة.",
  data: "أنت MBA BOT بصفتك 'Data Scientist'. ركز على تحليل البيانات، لغة Python، و SQL.",
  security: "أنت MBA BOT بصفتك 'Security Expert'. ركز على كشف الثغرات وأفضل ممارسات الحماية البرمجية."
};

const BASE_INSTRUCTION = `
استخدم اللغة العربية دائماً للشرح، مع الحفاظ على الأكواد البرمجية باللغة الإنجليزية. 
قدم دائماً أكواداً نظيفة (Clean Code) ومعايير برمجية عالية.
إذا سأل المستخدم عن معلومات حديثة، استخدم أداة البحث.
لتحرير الصور: إذا قام المستخدم برفع صورة وطلب تعديلاً (مثلاً: "اجعلها باللون الداكن" أو "أضف فلتر")، استخدم قدرات Gemini 2.5 Flash Image فوراً.`;

export const generateGeminiResponse = async (
  history: Message[], 
  message: string, 
  state: UIState,
  attachments: { data: string; mimeType: string }[] = []
) => {
  // Use API_KEY directly from process.env as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  // Model Selection Logic
  let modelName = 'gemini-3-pro-preview'; // Defaulting to pro as requested
  
  const isEditingRequest = attachments.length > 0 && 
    (message.toLowerCase().includes('edit') || 
     message.toLowerCase().includes('تعديل') || 
     message.toLowerCase().includes('حول') ||
     message.toLowerCase().includes('أضف'));

  if (isEditingRequest) {
    modelName = 'gemini-2.5-flash-image';
  } else if (!state.isThinking) {
    modelName = 'gemini-3-flash-preview';
  }

  const systemInstruction = (ROLE_INSTRUCTIONS[state.expertRole] || ROLE_INSTRUCTIONS.general) + BASE_INSTRUCTION;

  // Combine multiple parts into a single turn
  const userParts: any[] = attachments.map(a => ({ inlineData: a }));
  if (message.trim()) userParts.push({ text: message });

  const contents = [...history, { role: 'user', parts: userParts }];
  const tools: any[] = [];
  if (state.useSearch) tools.push({ googleSearch: {} });

  // Thinking Budget: Max for Gemini 3 Pro is 32768
  const thinkingBudget = state.isThinking && modelName.includes('pro') ? 32768 : 0;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: tools.length > 0 ? tools : undefined,
        thinkingConfig: thinkingBudget > 0 ? { thinkingBudget } : undefined
      }
    });

    return {
      text: response.text || "تمت معالجة الطلب بنجاح.",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata,
      // Find the image part by checking for inlineData presence
      imagePart: response.candidates?.[0]?.content?.parts.find(p => 'inlineData' in p)
    };
  } catch (error: any) {
    console.error("Gemini API Invocation Error:", error);
    throw error;
  }
};

export const generateTTS = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    // Only speak the first 1000 chars to avoid token limits and keep it efficient
    const speechText = text.replace(/```[\s\S]*?```/g, "[كود برمجي]").substring(0, 1000);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `اقرأ النص التالي بوضوح وبلغة تقنية: ${speechText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS System Error:", error);
    return null;
  }
};

export const decodeAudio = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const encodeAudio = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};
