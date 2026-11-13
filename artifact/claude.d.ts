/** Det lille udsnit af artifact-miljøets `window.claude`, som siden bruger */
export interface SampleTool {
  name: string;
  description: string;
  inputSchema?: { type: "object"; [k: string]: unknown };
  execute(input: Record<string, unknown>): unknown;
}
export interface SampleFn {
  (
    input: string | { role: "user" | "assistant"; content: string }[],
    options?: { onText?: (u: { text: string; delta: string }) => void; signal?: AbortSignal; tools?: SampleTool[]; cache?: boolean },
  ): Promise<{ text: string; truncated: boolean }>;
  limits(): Promise<{ tools?: { maxCount: number } }>;
}
export interface DbDoc {
  set(data: Record<string, unknown>): Promise<void>;
  onSnapshot(
    next: (snap: { exists: boolean; data(): Record<string, unknown> | undefined; metadata: { fromCache: boolean } }) => void,
    error?: (e: { code: string }) => void,
  ): () => void;
}
export interface ArtifactDb {
  doc(path: string): DbDoc;
}
declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> };
  }
}
