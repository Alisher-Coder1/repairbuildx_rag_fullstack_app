from __future__ import annotations

from .schemas import RoomInput, RoomMetrics


def calculate_room_metrics(room: RoomInput) -> RoomMetrics:
    """Calculate basic rectangular MVP metrics.

    Current Stage 7 MVP keeps the same demonstrational calculation core as the Colab prototype.
    Non-rectangular geometry should be added later as a separate calculation engine.
    """
    floor_area = room.length * room.width
    ceiling_area = floor_area
    perimeter = 2 * (room.length + room.width)
    wall_area_gross = perimeter * room.height

    openings_area = 0.0
    door_width_total = 0.0

    for opening in room.openings:
        openings_area += opening.width * opening.height * opening.count
        if opening.type == "РґРІРµСЂСЊ":
            door_width_total += opening.width * opening.count

    wall_area_net = max(wall_area_gross - openings_area, 0.0)
    skirting_length = max(perimeter - door_width_total, 0.0)

    return RoomMetrics(
        floor_area=round(floor_area, 2),
        ceiling_area=round(ceiling_area, 2),
        perimeter=round(perimeter, 2),
        wall_area_gross=round(wall_area_gross, 2),
        openings_area=round(openings_area, 2),
        wall_area_net=round(wall_area_net, 2),
        skirting_length=round(skirting_length, 2),
    )
