import { apiClient } from "./client";
import { AssistantResponse } from "@/types";

export async function askAssistant(caseId: string, query: string, context?: any): Promise<AssistantResponse> {
  return apiClient<AssistantResponse>("/assistant/query", {
    method: "POST",
    body: JSON.stringify({
      case_id: caseId,
      query,
      context,
    }),
  });
}
