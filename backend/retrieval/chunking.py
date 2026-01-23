# backend/retrieval/chunking.py
import re
from typing import List, Dict, Any

def create_structure_aware_chunks(
    page_id: str, 
    cleaned_text: str, 
    max_chunk_chars: int = 1200, 
    overlap_chars: int = 200
) -> List[Dict[str, Any]]:
    """
    Splits text across paragraph breaks and numbered clauses (e.g., 4.1, (a), Section 2).
    """
    split_pattern = r'(?=\n(?:Section\s+\d+|\d+\.\d+|\([a-z0-9]+\)|\b[A-Z\s]{4,}:))'
    raw_sections = re.split(split_pattern, cleaned_text)
    
    chunks = []
    chunk_idx = 1
    current_chunk = ""
    
    for section in raw_sections:
        section = section.strip()
        if not section:
            continue
            
        if len(current_chunk) + len(section) <= max_chunk_chars:
            current_chunk += "\n\n" + section if current_chunk else section
        else:
            if current_chunk:
                chunks.append({
                    "chunk_id": f"{page_id}-C{chunk_idx}",
                    "chunk_index": chunk_idx,
                    "content": current_chunk.strip()
                })
                chunk_idx += 1
                current_chunk = current_chunk[-overlap_chars:] + "\n" + section
            else:
                # Edge case: A single section is larger than the max_chunk_chars limit
                for i in range(0, len(section), max_chunk_chars - overlap_chars):
                    sub_part = section[i:i + max_chunk_chars]
                    chunks.append({
                        "chunk_id": f"{page_id}-C{chunk_idx}",
                        "chunk_index": chunk_idx,
                        "content": sub_part.strip()
                    })
                    chunk_idx += 1
                current_chunk = ""

    if current_chunk.strip():
        chunks.append({
            "chunk_id": f"{page_id}-C{chunk_idx}",
            "chunk_index": chunk_idx,
            "content": current_chunk.strip()
        })

    return chunks
