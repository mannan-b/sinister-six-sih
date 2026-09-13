from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.core.database import engine, Base, ensure_schema_compatibility
from app.core.logging import logger
from app.api.cases import router as cases_router
from app.api.entities import router as entities_router
from app.api.graph import router as graph_router
from app.api.alerts import router as alerts_router
from app.api.transactions import router as transactions_router
from app.api.communications import router as communications_router
from app.api.timeline import router as timeline_router
from app.api.assistant import router as assistant_router
from app.api.analysis import router as analysis_router

# Create Database tables
Base.metadata.create_all(bind=engine)
ensure_schema_compatibility()

app = FastAPI(
    title="NEXUS API",
    description="AI-Powered Criminal Network Analysis & Investigation Intelligence System",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request parameters or payload.",
                "details": exc.errors()
            }
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc)
            }
        }
    )

# Health Check Endpoints
@app.get("/health", tags=["System"])
@app.get(f"{settings.API_V1_STR}/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "system": "NEXUS Investigation Intelligence Platform",
        "version": settings.VERSION,
        "llm_provider": settings.LLM_PROVIDER
    }

# Register API Routers under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(cases_router, prefix=api_prefix)
app.include_router(entities_router, prefix=api_prefix)
app.include_router(graph_router, prefix=api_prefix)
app.include_router(alerts_router, prefix=api_prefix)
app.include_router(transactions_router, prefix=api_prefix)
app.include_router(communications_router, prefix=api_prefix)
app.include_router(timeline_router, prefix=api_prefix)
app.include_router(assistant_router, prefix=api_prefix)
app.include_router(analysis_router, prefix=api_prefix)

logger.info(f"NEXUS backend initialized with database: {settings.DATABASE_URL}")
