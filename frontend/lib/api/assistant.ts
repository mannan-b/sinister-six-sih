import { apiClient } from "./client";
import { AssistantResponse } from "@/types";

export async function askAssistant(
  caseId: string,
  query: string,
  context?: any,
  history?: { role: string; content: string }[]
): Promise<AssistantResponse> {
  return apiClient<AssistantResponse>("/assistant/query", {
    method: "POST",
    body: JSON.stringify({
      case_id: caseId,
      query,
      context,
      history,
    }),
  });
}
