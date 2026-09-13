export type EntityType =
  | "PERSON"
  | "PHONE"
  | "VEHICLE"
  | "LOCATION"
  | "ORGANIZATION"
  | "BANK_ACCOUNT"
  | "CASE"
  | "EVENT"
  | "DATE"
  | "CRIME"
  | string;

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type AlertSeverity = "LOW" | "MEDIUM" | "MODERATE" | "HIGH" | "CRITICAL";
export type AlertStatus = "NEW" | "REVIEWED" | "DISMISSED";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
}

export interface Case {
  id: string;
  case_number: string;
  fir_number?: string;
  name: string;
  description?: string;
  police_station?: string;
  investigating_officer?: string;
  officer_rank?: string;
  status: "ACTIVE" | "CLOSED" | string;
  created_at: string;
  updated_at: string;
  entity_count: number;
  relationship_count: number;
  alert_count: number;
  document_count: number;
  meta_info?: Record<string, unknown>;
}

export interface Entity {
  id: string;
  case_id: string;
  type: EntityType;
  canonical_name: string;
  display_name: string;
  aliases: string[];
  confidence: number;
  risk_score: number;
  risk_level: RiskLevel;
  degree_centrality: number;
  betweenness_centrality: number;
  pagerank_score: number;
  community_id: number;
  source_references: Array<{ doc_id?: string; title?: string; type?: string; source?: string }>;
  risk_factors: string[];
  meta_info: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EntityMetrics {
  degree: number;
  betweenness: number;
  pagerank: number;
  community_id: number;
  connections_count: number;
}

export interface EntityProfile {
  entity: Entity;
  metrics: EntityMetrics;
  risk_reasons: string[];
  associated_entities: Array<{
    relationship_id: string;
    relationship_type: string;
    direction: "INCOMING" | "OUTGOING";
    connected_entity_id: string;
    connected_entity_name: string;
    connected_entity_type: string;
    confidence: number;
    evidence?: string;
  }>;
  recent_events: Array<{
    id: string;
    title: string;
    location?: string;
    timestamp: string;
    severity: string;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    category: string;
    severity: string;
    explanation: string;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    sender: string;
    receiver: string;
    is_anomalous: boolean;
    timestamp: string;
  }>;
  communications: Array<{
    id: string;
    caller: string;
    receiver: string;
    duration: number;
    is_anomalous: boolean;
    timestamp: string;
  }>;
}

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  risk_score: number;
  risk_level: RiskLevel;
  community_id: number;
  metrics: {
    degree: number;
    betweenness: number;
    pagerank: number;
  };
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  confidence: number;
  weight: number;
  timestamp?: string;
  source_document?: string;
  metadata: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    node_count: number;
    edge_count: number;
    community_count: number;
    density: number;
    communities?: Array<{
      community_id: number;
      member_count: number;
      description: string;
      top_entities: Array<{ id: string; name: string; type: string }>;
    }>;
  };
}

export interface ShortestPathStep {
  node_id: string;
  node_label: string;
  node_type: string;
  relationship_to_next?: string;
  edge_id?: string;
  evidence?: string;
}

export interface ShortestPathResult {
  found: boolean;
  path_length: number;
  path_nodes: string[];
  path_edges: string[];
  steps: ShortestPathStep[];
  explanation: string;
}

export interface Alert {
  id: string;
  case_id: string;
  entity_id?: string;
  entity_name?: string;
  entity_type?: string;
  title: string;
  category: string;
  severity: AlertSeverity;
  status: AlertStatus;
  explanation: string;
  evidence: string[];
  confidence: number;
  timestamp: string;
  meta_info?: Record<string, unknown>;
}

export interface Transaction {
  id: string;
  case_id: string;
  sender_id?: string;
  receiver_id?: string;
  sender_name?: string;
  receiver_name?: string;
  sender_account: string;
  receiver_account: string;
  amount: number;
  currency: string;
  timestamp: string;
  is_anomalous: boolean;
  anomaly_score: number;
  anomaly_reason?: string;
}

export interface Communication {
  id: string;
  case_id: string;
  caller_id?: string;
  receiver_id?: string;
  caller_name?: string;
  receiver_name?: string;
  caller_phone: string;
  receiver_phone: string;
  timestamp: string;
  duration_seconds: number;
  communication_type: string;
  is_anomalous: boolean;
  anomaly_score: number;
  anomaly_reason?: string;
}

export interface TimelineEvent {
  id: string;
  case_id: string;
  title: string;
  description: string;
  event_type: string;
  timestamp: string;
  location_name?: string;
  involved_entity_ids: string[];
  involved_entities: Array<{ id: string; name: string; type: string; risk_score: number }>;
  source_reference?: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

export interface AssistantEvidenceItem {
  title: string;
  description: string;
  source?: string;
  confidence?: number;
}

export interface AssistantResponse {
  answer: string;
  evidence: AssistantEvidenceItem[];
  relevant_entities: Array<{ id: string; name: string; type: string; risk_score?: number }>;
  relevant_relationships: Array<Record<string, unknown>>;
  confidence: string;
  disclaimer: string;
  suggested_queries: string[];
  reasoning_mode: string;
}

export interface AnalysisRun {
  id: string;
  case_id: string;
  run_type: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  started_at: string;
  completed_at?: string;
  duration_seconds: number;
  input_files: string[];
  entities_extracted: number;
  relationships_extracted: number;
  alerts_generated: number;
  error_message?: string;
}
