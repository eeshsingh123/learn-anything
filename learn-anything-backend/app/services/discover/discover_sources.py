import uuid
import asyncio
import datetime

from exa_py import Exa

from ...core.config import EXA_API_KEY

exa = Exa(EXA_API_KEY)

async def discover_additional_web_sources(query):
    loop = asyncio.get_event_loop()
    final_discovered_sources = []

    # pre-process the query and divide it into categories to get sources from
    queries = [
        {
            "prompt": "What are the best beginner, intermediate, and advanced resources for learning {query}?",
            "category": None,
            "n_results": 8
        },
        {
            "prompt": "What are the best research papers for learning {query}?",
            "category": "research paper",
            "n_results": 2
        },
        {
            "prompt": "What is the latest news on {query}?",
            "category": "news",
            "n_results": 2,
            "start_date": str(datetime.datetime.now().date() - datetime.timedelta(days=8)),
            "end_date": str(datetime.datetime.now().date())
        }
    ]

    # Call for categories in a loop and collect them in a list
    for query in queries:
        search_func = lambda *args: exa.search_and_contents(
            query["prompt"],
            text=True,
            category=query["category"],
            num_results=query["n_results"],
            start_published_date=query.get("start_date"),
            end_published_date=query.get("end_date"),
        )
        results = await loop.run_in_executor(None, search_func)
        final_discovered_sources.append({
            "batch_id": str(uuid.uuid4()),
            "sources": results.results,
            "usage": results.cost_dollars
        })

    return final_discovered_sources
