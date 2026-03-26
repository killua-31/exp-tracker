from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.preference import UserPreference
from app.schemas.preference import PreferenceUpdate, PreferenceResponse

router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.get("", response_model=List[PreferenceResponse])
async def list_preferences(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserPreference))
    return result.scalars().all()


@router.put("", response_model=List[PreferenceResponse])
async def upsert_preferences(
    data: List[PreferenceUpdate],
    db: AsyncSession = Depends(get_db),
):
    for item in data:
        result = await db.execute(
            select(UserPreference).where(UserPreference.key == item.key)
        )
        pref = result.scalar_one_or_none()
        if pref:
            pref.value = item.value
        else:
            pref = UserPreference(key=item.key, value=item.value)
            db.add(pref)
    await db.commit()

    result = await db.execute(select(UserPreference))
    return result.scalars().all()
