"""
Unified Search Logic for All Endpoints
Smart search với relevance scoring và performance optimization
"""

from typing import Dict, List, Optional, Tuple
import re
from pymongo import TEXT


class SearchBuilder:
    """Unified search query builder với smart logic"""

    @staticmethod
    def build_smart_search_query(
        search_term: str,
        config: Dict[str, Dict]
    ) -> Tuple[Dict, List[Dict]]:
        """
        Build smart search query với priority scoring

        Args:
            search_term: Từ khóa search
            config: Configuration cho fields và weights
                    {
                        "title": {"weight": 10, "exact_match": True},
                        "description": {"weight": 3, "exact_match": False},
                        "creator_name": {"weight": 5, "exact_match": False}
                    }

        Returns:
            Tuple[query, aggregation_pipeline]
        """
        if not search_term or not search_term.strip():
            return {}, []

        search_term = search_term.strip()
        escaped_term = re.escape(search_term)

        # BUILD PRIORITY QUERY CONDITIONS
        or_conditions = []
        scoring_conditions = []

        for field, settings in config.items():
            weight = settings.get("weight", 1)
            exact_match = settings.get("exact_match", False)

            if exact_match:
                # PRIORITY 1: Exact matches (title = "Responsible AI")
                exact_condition = {field: {"$regex": f"^{escaped_term}$", "$options": "i"}}
                or_conditions.append(exact_condition)
                scoring_conditions.append({
                    "$cond": [exact_condition, weight * 3, 0]
                })

                # PRIORITY 2: Starts with match (title starts with "respon")
                starts_condition = {field: {"$regex": f"^{escaped_term}", "$options": "i"}}
                or_conditions.append(starts_condition)
                scoring_conditions.append({
                    "$cond": [starts_condition, weight * 2, 0]
                })

            # PRIORITY 3: Word boundary matches ("responsible" in title)
            word_boundary = {field: {"$regex": f"\\b{escaped_term}", "$options": "i"}}
            or_conditions.append(word_boundary)
            scoring_conditions.append({
                "$cond": [word_boundary, weight, 0]
            })

            # PRIORITY 4: Contains anywhere (fallback)
            contains = {field: {"$regex": escaped_term, "$options": "i"}}
            or_conditions.append(contains)
            scoring_conditions.append({
                "$cond": [contains, weight * 0.3, 0]
            })

        # BUILD FINAL QUERY
        query = {"$or": or_conditions} if or_conditions else {}

        # BUILD AGGREGATION WITH SCORING
        aggregation_pipeline = [
            {"$match": query},
            {"$addFields": {
                "search_score": {"$add": scoring_conditions}
            }},
            {"$sort": {"search_score": -1, "created_at": -1}}
        ]

        return query, aggregation_pipeline

    @staticmethod
    def get_courses_search_config() -> Dict[str, Dict]:
        """Configuration for courses search"""
        return {
            "title": {"weight": 10, "exact_match": True},
            "description": {"weight": 3, "exact_match": False},
            "creator_name": {"weight": 5, "exact_match": False},
            "category": {"weight": 7, "exact_match": True}
        }

    @staticmethod
    def get_users_search_config() -> Dict[str, Dict]:
        """Configuration for users search"""
        return {
            "name": {"weight": 10, "exact_match": True},
            "email": {"weight": 8, "exact_match": True}
        }

    @staticmethod
    def get_faq_search_config() -> Dict[str, Dict]:
        """Configuration for FAQ search"""
        return {
            "question": {"weight": 10, "exact_match": False},
            "answer": {"weight": 5, "exact_match": False},
            "category": {"weight": 7, "exact_match": True}
        }

    @staticmethod
    def get_support_search_config() -> Dict[str, Dict]:
        """Configuration for support tickets search"""
        return {
            "title": {"weight": 10, "exact_match": True},
            "description": {"weight": 5, "exact_match": False},
            "user_name": {"weight": 7, "exact_match": False},
            "category": {"weight": 6, "exact_match": True}
        }


class SearchOptimizer:
    """Performance optimization cho search queries"""

    @staticmethod
    def should_use_text_search(search_term: str) -> bool:
        """Determine if should use MongoDB text search"""
        # Use text search for longer phrases or complex queries
        return len(search_term.split()) >= 2

    @staticmethod
    def create_text_indexes() -> Dict[str, List[Tuple[str, str]]]:
        """Define text indexes for collections"""
        return {
            "courses": [
                ("title", TEXT),
                ("description", TEXT),
                ("creator_name", TEXT)
            ],
            "users": [
                ("name", TEXT),
                ("email", TEXT)
            ],
            "faqs": [
                ("question", TEXT),
                ("answer", TEXT)
            ],
            "support_tickets": [
                ("title", TEXT),
                ("description", TEXT)
            ]
        }