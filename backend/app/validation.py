from __future__ import annotations

from .schemas import RoomInput


def validate_coverings(room: RoomInput) -> list[str]:
    errors: list[str] = []

    if not room.floor_covering.strip():
        errors.append('floor_covering is empty')

    if not room.wall_covering.strip():
        errors.append('wall_covering is empty')

    if not room.ceiling_covering.strip():
        errors.append('ceiling_covering is empty')

    return errors
