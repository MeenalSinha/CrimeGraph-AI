from fastapi import APIRouter, HTTPException

from app.models.schemas import ShortestPathRequest
from app.services import graph_service
from app.services.entity_resolution import find_duplicate_candidates

router = APIRouter(prefix="/api/network", tags=["network"])


@router.get("/stats")
def stats():
    return graph_service.graph_stats()


@router.get("/node/{node_id}")
def node(node_id: str):
    try:
        return graph_service.node_details(node_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Node not found")


@router.get("/expand/{node_id}")
def expand(node_id: str, depth: int = 1, limit: int = 40):
    try:
        return graph_service.expand_node(node_id, depth=depth, limit=limit)
    except KeyError:
        raise HTTPException(status_code=404, detail="Node not found")


@router.post("/shortest-path")
def shortest_path(body: ShortestPathRequest):
    try:
        return graph_service.shortest_path(body.source, body.target)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/centrality")
def centrality(top_n: int = 15):
    return dict(ranking=graph_service.centrality_ranking(top_n))


@router.get("/communities")
def communities(min_size: int = 3):
    return dict(communities=graph_service.detect_communities(min_size))


@router.get("/entity-resolution")
def entity_resolution(threshold: int = 82):
    return dict(candidates=find_duplicate_candidates(threshold))


@router.get("/link-prediction")
def link_prediction(person_id: str | None = None, top_n: int = 15):
    return dict(predictions=graph_service.predict_hidden_links(person_id, top_n))


@router.get("/temporal")
def temporal(start_date: str, end_date: str, n_points: int = 8):
    """Real point-in-time graph snapshots reconstructed from timestamped
    source data -- 'rewind the criminal network' evolution over a date range."""
    try:
        snapshots = graph_service.temporal_evolution(start_date, end_date, n_points)
        return dict(snapshots=snapshots)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid date range: {e}")
