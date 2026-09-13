import { apiClient } from "./client";
import { Case } from "@/types";

export async function fetchCases(params?: { search?: string; status?: string }): Promise<Case[]> {
  try {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.status && params.status !== "ALL") q.append("status", params.status);
    const qs = q.toString();
    return await apiClient<Case[]>(`/cases${qs ? `?${qs}` : ""}`);
  } catch (err) {
    console.warn("Failed to fetch cases:", err);
    return [];
  }
}

export async function fetchCaseById(id: string): Promise<Case> {
  return apiClient<Case>(`/cases/${id}`);
}

export async function fetchCaseSummary(id: string) {
  return apiClient<any>(`/cases/${id}/summary`);
}

export async function createCase(data: {
  name: string;
  fir_number: string;
  case_number?: string;
  police_station?: string;
  investigating_officer?: string;
  officer_rank?: string;
  description?: string;
  status?: string;
}): Promise<Case> {
  return apiClient<Case>("/cases", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCase(
  id: string,
  data: {
    name?: string;
    fir_number?: string;
    case_number?: string;
    police_station?: string;
    investigating_officer?: string;
    officer_rank?: string;
    description?: string;
    status?: string;
  }
): Promise<Case> {
  return apiClient<Case>(`/cases/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateCaseStatus(id: string, status: "ACTIVE" | "CLOSED"): Promise<Case> {
  return apiClient<Case>(`/cases/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
