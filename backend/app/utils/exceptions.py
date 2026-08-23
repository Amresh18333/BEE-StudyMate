from fastapi import HTTPException
from bson import ObjectId


def validate_object_id(value):
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=400,
            detail="Invalid ID format"
        )

    return ObjectId(value)