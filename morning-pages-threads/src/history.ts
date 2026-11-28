import fs from "node:fs";
import path from "node:path";

// 발행한 글 기록. 최근 글을 Claude에게 보여줘 같은 말을 반복하지 않게 합니다.
const HISTORY_PATH = path.resolve("data/history.json");
const NOTES_PATH = path.resolve("data/notes.md");

export type PostKind = "info" | "daily";

export interface HistoryEntry {
  date: string;
  kind: PostKind;
  topic: string;
  text: string;
  threadsId?: string;
  noteUsed?: string;
}

export function readHistory(): HistoryEntry[] {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8")) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function appendHistory(entry: HistoryEntry): void {
  const all = readHistory();
  all.push(entry);
  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(all, null, 2) + "\n");
}

/**
 * data/notes.md 에 직접 적어둔 진짜 메모(한 줄에 하나) 중 아직 안 쓴 첫 줄.
 * 일상글은 이 메모가 있으면 그걸 바탕으로 씁니다. '#'으로 시작하는 줄은 무시.
 */
export function nextUnusedNote(history: HistoryEntry[]): string | undefined {
  let lines: string[];
  try {
    lines = fs.readFileSync(NOTES_PATH, "utf8").split("\n");
  } catch {
    return undefined;
  }
  const used = new Set(history.map((h) => h.noteUsed).filter(Boolean));
  return lines
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .find((l) => l && !l.startsWith("#") && !used.has(l));
}
