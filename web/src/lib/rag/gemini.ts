import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclarationsTool,
} from "@google/generative-ai";
import { lookupAdmissionInfo, type AdmissionArgs } from "./admission";

function client(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Thiếu GEMINI_API_KEY");
  return new GoogleGenerativeAI(key);
}

/** Sinh embedding cho câu hỏi (task_type = retrieval_query). */
export async function embedQuery(text: string): Promise<number[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Thiếu GEMINI_API_KEY");
  const model = process.env.EMBEDDING_MODEL ?? "gemini-embedding-2";
  const dim = Number(process.env.EMBEDDING_DIM ?? "1536");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: dim,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Embedding lỗi ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!values || values.length === 0) throw new Error("Embedding trả về rỗng");
  return values;
}

/** Stream câu trả lời từ Gemini Flash theo từng đoạn text. */
export async function* streamAnswer(
  systemInstruction: string,
  userPrompt: string,
): AsyncGenerator<string> {
  const model = client().getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    systemInstruction,
    generationConfig: { temperature: 0.3 },
  });
  const result = await model.generateContentStream(userPrompt);
  for await (const chunk of result.stream) {
    const t = chunk.text();
    if (t) yield t;
  }
}

/** Trả lời một lần (không stream) — dùng cho kênh không stream như Zalo OA. */
export async function answerOnce(systemInstruction: string, userPrompt: string): Promise<string> {
  const model = client().getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    systemInstruction,
    generationConfig: { temperature: 0.3 },
  });
  const r = await model.generateContent(userPrompt);
  return r.response.text();
}

// ----- Tuyển sinh: tool tra cứu (Sprint 8) -----
export const admissionTool: FunctionDeclarationsTool = {
  functionDeclarations: [
    {
      name: "lookup_admission_info",
      description:
        "Tra cứu thông tin tuyển sinh của HPU (điểm chuẩn, chỉ tiêu, học phí) theo ngành và năm. " +
        "Gọi khi người dùng hỏi số liệu tuyển sinh cụ thể.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          nganh: { type: SchemaType.STRING, description: "Tên hoặc mã ngành" },
          nam: { type: SchemaType.NUMBER, description: "Năm tuyển sinh, ví dụ 2026" },
          loai: {
            type: SchemaType.STRING,
            description: "Loại thông tin: diem_chuan | chi_tieu | hoc_phi",
          },
        },
        required: ["nganh"],
      },
    },
  ],
};

/**
 * Trả lời câu hỏi tuyển sinh với khả năng gọi tool lookup_admission_info.
 * Không stream (function-calling 1 vòng), gọi xong trả về toàn bộ text để route stream lại.
 */
export async function answerWithAdmissionTool(
  systemInstruction: string,
  userPrompt: string,
): Promise<string> {
  const model = client().getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    systemInstruction,
    tools: [admissionTool],
    generationConfig: { temperature: 0.3 },
  });
  const chat = model.startChat();
  const first = await chat.sendMessage(userPrompt);
  const calls = first.response.functionCalls();
  if (calls && calls.length > 0) {
    const parts = calls.map((c) => ({
      functionResponse: {
        name: c.name,
        response: lookupAdmissionInfo(c.args as AdmissionArgs),
      },
    }));
    const second = await chat.sendMessage(parts);
    return second.response.text();
  }
  return first.response.text();
}
