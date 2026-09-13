from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class AssistantMessage(BaseModel):
    role: str  # user, assistant, system
    content: str

class AssistantQueryRequest(BaseModel):
    query: str
    case_id: str
    history: Optional[List[AssistantMessage]] = []
    context: Optional[Dict[str, Any]] = None

class AssistantEvidenceItem(BaseModel):
    title: str
    description: str
    source: Optional[str] = None
    confidence: Optional[float] = 1.0

class AssistantQueryResponse(BaseModel):
    answer: str
    evidence: List[AssistantEvidenceItem]
    relevant_entities: List[Dict[str, Any]]
    relevant_relationships: List[Dict[str, Any]]
    confidence: str = "High"  # High, Moderate, Preliminary
    disclaimer: str = "AI-generated investigative lead. Verify against source evidence. The system does not determine guilt or criminality."
    suggested_queries: List[str] = []
    reasoning_mode: str = "local_graph_rag"  # local_graph_rag, llm_augmented

class InvestigationSummaryResponse(BaseModel):
    case_id: str
    case_name: str
    executive_summary: str
    key_entities: List[Dict[str, Any]]
    important_relationships: List[Dict[str, Any]]
    major_anomalies: List[Dict[str, Any]]
    communities: List[Dict[str, Any]]
    potential_intermediaries: List[Dict[str, Any]]
    timeline_highlights: List[Dict[str, Any]]
    disclaimer: str = "AI-generated investigative lead. Verify against source evidence."
