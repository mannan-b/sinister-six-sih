from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.assistant import AssistantQueryRequest, AssistantQueryResponse
from app.schemas.common import ApiResponse
from app.ai.investigation_assistant import investigation_assistant

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

@router.post("/query", response_model=ApiResponse[AssistantQueryResponse])
def query_assistant(req: AssistantQueryRequest, db: Session = Depends(get_db)):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    response = investigation_assistant.process_query(db, req.case_id, req.query, req.context, history=req.history)
    return ApiResponse(success=True, data=response)
