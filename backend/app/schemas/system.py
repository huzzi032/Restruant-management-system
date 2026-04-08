"""System/business settings schemas."""
from pydantic import BaseModel, Field


class BusinessSettingsResponse(BaseModel):
    tax_rate: float
    currency: str


class BusinessSettingsUpdate(BaseModel):
    tax_rate: float = Field(..., ge=0, le=1)
    currency: str = Field(..., min_length=1, max_length=10)
