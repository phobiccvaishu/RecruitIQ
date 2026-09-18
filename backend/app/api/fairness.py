from fastapi import APIRouter, HTTPException
from app.fairness.fairness_tests import run_fairness_audit

router = APIRouter(prefix="/fairness", tags=["fairness"])

@router.get("/test")
def test_fairness():
    """
    Executes a demographic fairness audit to measure scoring variance.
    Returns details on variance and sensitive attributes verification.
    """
    try:
        results = run_fairness_audit()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fairness audit failed: {str(e)}")
