"""System settings router."""
from fastapi import APIRouter, Depends

from app.core.business_settings import business_settings_store
from app.core.security import require_admin, require_staff
from app.models.user import User
from app.schemas.system import BusinessSettingsResponse, BusinessSettingsUpdate

router = APIRouter()


@router.get("/business-settings", response_model=BusinessSettingsResponse)
def get_business_settings(current_user: User = Depends(require_staff)):
    return business_settings_store.get()


@router.put("/business-settings", response_model=BusinessSettingsResponse)
def update_business_settings(
    payload: BusinessSettingsUpdate,
    current_user: User = Depends(require_admin),
):
    return business_settings_store.update(payload.tax_rate, payload.currency)
