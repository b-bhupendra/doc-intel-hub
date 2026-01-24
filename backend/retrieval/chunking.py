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
    Attaches deterministic identifiers like 'DOC-V1-P03-C02' to each chunk.
    """
    # Regex looks ahead for Newlines followed by "Section X", "1.1", "(a)", or ALL CAPS HEADINGS
    split_pattern = r'(?=\n(?:Section\s+\d+|\d+\.\d+|\([a-z0-9]+\)|\b[A-Z\s]{4,}:))'
    raw_sections = re.split(split_pattern, cleaned_text)
    
    chunks = []
    chunk_idx = 1
    current_chunk = ""
    
    for section in raw_sections:
        section = section.strip()
        if not section:
            continue
            
        # If adding the next section keeps us under the limit, append it
        if len(current_chunk) + len(section) <= max_chunk_chars:
            current_chunk += "\n\n" + section if current_chunk else section
        else:
            # If we have a current_chunk, save it before starting a new one
            if current_chunk:
                chunk_id = f"{page_id}-C{chunk_idx:03d}"
                chunks.append({
                    "chunk_id": chunk_id,
                    "chunk_index": chunk_idx,
                    "content": current_chunk.strip(),
                    "token_count": len(current_chunk.split())
                })
                chunk_idx += 1
                # Seed the next chunk with the overlap window to maintain context[cite: 1]
                current_chunk = current_chunk[-overlap_chars:] + "\n" + section
            else:
                # Edge case: A single section is larger than the max_chunk_chars limit[cite: 1]
                for i in range(0, len(section), max_chunk_chars - overlap_chars):
                    sub_part = section[i:i + max_chunk_chars]
                    chunk_id = f"{page_id}-C{chunk_idx:03d}"
                    chunks.append({
                        "chunk_id": chunk_id,
                        "chunk_index": chunk_idx,
                        "content": sub_part.strip(),
                        "token_count": len(sub_part.split())
                    })
                    chunk_idx += 1
                current_chunk = ""

    # Catch any remaining text in the buffer
    if current_chunk.strip():
        chunk_id = f"{page_id}-C{chunk_idx:03d}"
        chunks.append({
            "chunk_id": chunk_id,
            "chunk_index": chunk_idx,
            "content": current_chunk.strip(),
            "token_count": len(current_chunk.split())
        })

    return chunks
