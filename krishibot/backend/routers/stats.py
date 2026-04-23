from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, date, time
from database import get_db
from models.database import ChatMessage, AnalysisLog, CommunityReport

router = APIRouter(prefix="/api/stats", tags=["Stats"])

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    today_start = datetime.combine(date.today(), time.min)

    total_messages = db.query(ChatMessage).count()
    total_analyses = db.query(AnalysisLog).count()
    total_community = db.query(CommunityReport).count()

    messages_today = db.query(ChatMessage).filter(
        ChatMessage.timestamp >= today_start
    ).count()

    analyses_today = db.query(AnalysisLog).filter(
        AnalysisLog.timestamp >= datetime.combine(date.today(), time.min)
    ).count()

    top_diseases = db.query(
        AnalysisLog.disease_name,
        func.count(AnalysisLog.id).label("count")
    ).group_by(AnalysisLog.disease_name).order_by(
        func.count(AnalysisLog.id).desc()
    ).limit(5).all()

    recent_analyses = db.query(AnalysisLog).order_by(
        desc(AnalysisLog.timestamp)
    ).limit(5).all()

    recent_messages = db.query(ChatMessage).order_by(
        desc(ChatMessage.timestamp)
    ).limit(5).all()

    return {
        "total_chat_messages": total_messages,
        "total_analyses": total_analyses,
        "total_community_reports": total_community,
        "messages_today": messages_today,
        "analyses_today": analyses_today,
        "activity_today": messages_today + analyses_today,
        "top_diseases": [
            {"disease_name": d, "count": c} 
            for d, c in top_diseases
        ],
        "recent_analyses": [
            {
                "disease_name": a.disease_name or "Unknown",
                "timestamp": str(a.timestamp)
            }
            for a in recent_analyses
        ],
        "recent_messages": [
            {
                "content": (a.content or "")[:50],
                "role": a.role,
                "timestamp": str(a.timestamp)
            }
            for a in recent_messages
        ]
    }
