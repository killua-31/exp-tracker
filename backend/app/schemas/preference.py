from __future__ import annotations

import uuid

from pydantic import BaseModel, ConfigDict


class PreferenceUpdate(BaseModel):
    key: str
    value: str


class PreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    key: str
    value: str
