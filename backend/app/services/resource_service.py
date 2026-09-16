"""Notes & Video Finder.

Finds free study notes and the highest-rated tutorial video for a
given topic/keyword, without requiring any paid Google/YouTube API
key - it uses DuckDuckGo web search (via the `ddgs` package) for
notes/articles and `yt-dlp`'s YouTube search extractor (which scrapes
public video metadata such as like/view counts) for videos.

Because both rely on outbound internet access to third-party sites,
network restrictions in some hosting environments may cause these
calls to fail; failures are handled gracefully and surfaced as empty
result sets rather than crashing the request.
"""

from urllib.parse import urlparse

# Domains that generally host trustworthy, free study material.
# Results from these are not filtered out even if they aren't PDFs.
PREFERRED_NOTE_DOMAINS = [
    "geeksforgeeks.org",
    "javatpoint.com",
    "tutorialspoint.com",
    "w3schools.com",
    "khanacademy.org",
    "byjus.com",
    "wikipedia.org",
    "freecodecamp.org",
    "developer.mozilla.org",
    "edu",
    "ac.in",
    "ocw.mit.edu",
    "stanford.edu",
    "geeksadda.in",
]


def _domain_of(url: str) -> str:
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return ""


def search_notes(query: str, max_results: int = 8):
    """Search the open web for free notes / study material (PDFs,
    articles, tutorials) for the given topic."""

    if not query or not query.strip():
        raise ValueError("A search keyword is required")

    try:
        from ddgs import DDGS
    except Exception as error:
        raise RuntimeError(
            "Notes search is unavailable on the server"
        ) from error

    results = []
    seen_urls = set()

    search_queries = [
        f"{query} notes pdf",
        f"{query} study notes tutorial",
        f"{query} explained site:.edu OR site:geeksforgeeks.org OR site:tutorialspoint.com",
    ]

    try:
        with DDGS() as ddgs:
            for search_query in search_queries:
                try:
                    hits = ddgs.text(
                        search_query,
                        max_results=max_results,
                        safesearch="moderate",
                    )
                except Exception:
                    continue

                for hit in hits or []:
                    url = hit.get("href") or hit.get("url")

                    if not url or url in seen_urls:
                        continue

                    seen_urls.add(url)

                    domain = _domain_of(url)
                    is_pdf = url.lower().endswith(".pdf")
                    is_preferred = any(
                        pref in domain for pref in PREFERRED_NOTE_DOMAINS
                    )

                    results.append({
                        "title": hit.get("title") or query,
                        "url": url,
                        "snippet": hit.get("body", ""),
                        "source": domain,
                        "isPdf": is_pdf,
                        "isPreferredSource": is_preferred,
                    })

                if len(results) >= max_results * 2:
                    break

    except Exception as error:
        raise RuntimeError(
            "Could not reach the notes search service right now"
        ) from error

    # Rank: PDFs and known trustworthy education sources float to the top.
    results.sort(
        key=lambda item: (
            not item["isPdf"],
            not item["isPreferredSource"],
        )
    )

    return results[:max_results]


def search_best_videos(query: str, max_results: int = 5):
    """Search YouTube (via yt-dlp, no API key needed) for tutorial
    videos on the topic and return them ranked by like count so the
    best-received video surfaces first."""

    if not query or not query.strip():
        raise ValueError("A search keyword is required")

    try:
        import yt_dlp
    except Exception as error:
        raise RuntimeError(
            "Video search is unavailable on the server"
        ) from error

    # Keep the candidate pool small - each candidate needs its own
    # network request to fetch like/view counts, so a large pool
    # makes the request noticeably slower.
    candidate_count = min(max(max_results + 3, 6), 8)

    flat_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": "in_playlist",
        "noplaylist": True,
        "default_search": "ytsearch",
        "socket_timeout": 12,
    }

    candidates = []

    try:
        with yt_dlp.YoutubeDL(flat_opts) as ydl:
            search_result = ydl.extract_info(
                f"ytsearch{candidate_count}:{query} tutorial",
                download=False,
            )
            candidates = (search_result or {}).get("entries") or []

    except Exception as error:
        raise RuntimeError(
            "Could not reach YouTube search right now"
        ) from error

    detailed_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "socket_timeout": 12,
    }

    videos = []

    with yt_dlp.YoutubeDL(detailed_opts) as ydl:
        for entry in candidates:
            video_id = entry.get("id")
            url = entry.get("url") or (
                f"https://www.youtube.com/watch?v={video_id}"
                if video_id else None
            )

            if not url:
                continue

            try:
                info = ydl.extract_info(url, download=False)
            except Exception:
                continue

            if not info:
                continue

            like_count = info.get("like_count") or 0
            view_count = info.get("view_count") or 0

            videos.append({
                "title": info.get("title", "Untitled video"),
                "url": info.get("webpage_url", url),
                "channel": info.get("uploader") or info.get("channel") or "Unknown",
                "thumbnail": info.get("thumbnail"),
                "durationSeconds": info.get("duration") or 0,
                "viewCount": view_count,
                "likeCount": like_count,
            })

            if len(videos) >= candidate_count:
                break

    # Best-received video first: rank primarily by like count,
    # falling back to view count when likes aren't available.
    videos.sort(
        key=lambda v: (v["likeCount"], v["viewCount"]),
        reverse=True,
    )

    return videos[:max_results]
