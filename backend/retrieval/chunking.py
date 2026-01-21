# backend/retrieval/chunking.py
from typing import List, Dict, Any

def create_structure_aware_chunks(
    page_id: str, 
    cleaned_text: str, 
    max_chunk_chars: int = 1200, 
    overlap_chars: int = 200
) -> List[Dict[str, Any]]:
    """
    Basic text chunking prototype across double-newline paragraph boundaries.
    """
    raw_sections = cleaned_text.split("\n\n")
    
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
                current_chunk = section
                
    if current_chunk.strip():
        chunks.append({
            "chunk_id": f"{page_id}-C{chunk_idx}",
            "chunk_index": chunk_idx,
            "content": current_chunk.strip()
        })

    return chunks
