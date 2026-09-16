from fastapi import APIRouter, HTTPException, Query

from app.services.resource_service import search_notes, search_best_videos

router = APIRouter(
    prefix="/resources",
    tags=["Resources"]
)


@router.get("/notes")
def get_notes(
    q: str = Query(..., min_length=1),
    limit: int = Query(8, ge=1, le=15),
):
    """Find free notes/articles for a topic from the open web."""

    try:
        results = search_notes(q, max_results=limit)
        return {"query": q, "results": results}

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to search for notes"
        )


@router.get("/videos")
def get_videos(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=10),
):
    """Find the top tutorial videos for a topic, ranked by likes."""

    try:
        results = search_best_videos(q, max_results=limit)
        return {"query": q, "results": results}

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to search for videos"
        )


@router.get("")
def search_resources(
    q: str = Query(..., min_length=1),
    notes_limit: int = Query(6, ge=1, le=15),
    videos_limit: int = Query(3, ge=1, le=10),
):
    """Combined notes + video search for a topic/keyword."""

    notes = []
    videos = []
    notes_error = None
    videos_error = None

    try:
        notes = search_notes(q, max_results=notes_limit)
    except Exception as error:
        notes_error = str(error)

    try:
        videos = search_best_videos(q, max_results=videos_limit)
    except Exception as error:
        videos_error = str(error)

    return {
        "query": q,
        "notes": notes,
        "videos": videos,
        "notesError": notes_error,
        "videosError": videos_error,
    }
