import axios from "axios";
import { ExecuteResult, PromptPattern, RoutingDecision } from "./types";

const api = axios.create({
  baseURL: "/api",
});

export interface HelpLibraryDoc {
  id: string;
  title: string;
  fileName: string;
  markdown: string;
}

export interface HelpLibraryPayload {
  markdown: string;
  docs: HelpLibraryDoc[];
}

export async function fetchPatterns(query: string): Promise<PromptPattern[]> {
  const response = await api.get<{ patterns: PromptPattern[] }>("/patterns", {
    params: { query },
  });
  return response.data.patterns;
}

export async function compilePrompt(payload: {
  goal: string;
  agentType: string;
  selectedPatternIds: number[];
  variables: Record<string, string>;
}): Promise<{ finalPrompt: string; routing: RoutingDecision }> {
  const response = await api.post<{ finalPrompt: string; routing: RoutingDecision }>(
    "/compile",
    payload
  );
  return response.data;
}

export async function executePrompt(payload: {
  inputText: string;
  model: string;
  halted: boolean;
}): Promise<ExecuteResult> {
  const response = await api.post<ExecuteResult>("/execute", payload);
  return response.data;
}

export async function fetchHelpLibrary(): Promise<HelpLibraryPayload> {
  const response = await api.get<{ markdown: string; docs?: HelpLibraryDoc[] }>("/help-library");
  return {
    markdown: response.data.markdown,
    docs: Array.isArray(response.data.docs) ? response.data.docs : [],
  };
}
