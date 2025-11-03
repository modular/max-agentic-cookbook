# BACKEND AGENT: Text Classification Recipe

⚠️ **IMPORTANT: PARALLEL DEVELOPMENT IN PROGRESS** ⚠️

**Another AI agent is simultaneously working on the FRONTEND scope.**

You MUST ONLY work on files within the backend directory. Do not modify, read, or touch any frontend files.

---

## Your Scope

### Files You Own (and only you modify):

- `backend/src/recipes/batch_text_classification.py` (complete recipe implementation)
- `backend/src/main.py` (import and register router only)

### Files You DO NOT Touch:

- Anything in `frontend/` directory
- `frontend/src/recipes/`
- Any frontend configuration files
- Any other backend files

### Files Owned by Frontend Agent:

- `frontend/src/recipes/batch-text-classification/ui.tsx`
- `frontend/src/recipes/batch-text-classification/README.mdx`
- `frontend/src/recipes/registry.ts` (they add the entry)
- `frontend/src/recipes/components.ts` (they add the mappings)

---

## Integration: The API Contract

The Frontend Agent is consuming this API endpoint you're building. **Both agents follow this specification exactly.**

### Request Format

```json
POST /api/recipes/batch-text-classification

{
  "endpointId": "max-local",
  "modelName": "llama-3.1-8b",
  "systemPrompt": "Classify the sentiment as positive, negative, or neutral. Respond with only one word.",
  "textField": "content",
  "batch": [
    {
      "itemId": "1",
      "originalData": {
        "id": "tweet-123",
        "content": "This is amazing!",
        "user": "john"
      }
    },
    {
      "itemId": "2",
      "originalData": {
        "id": "tweet-456",
        "content": "I hate this product.",
        "user": "jane"
      }
    }
  ]
}
```

### Response Format (JSON Array)

```json
[
    {
        "itemId": "1",
        "originalText": "This is amazing!",
        "classification": "positive",
        "duration": 234
    },
    {
        "itemId": "2",
        "originalText": "I hate this product.",
        "classification": "negative",
        "duration": 189
    }
]
```

**Important**: Return complete JSON array, NOT NDJSON streaming. Frontend gets loading spinner while waiting.

### Code Endpoint

```
GET /api/recipes/batch-text-classification/code
```

Returns: Python source code as plain text (`media_type="text/plain"`)

---

## Project Context

### User Requirements

- Upload JSONL files (https://jsonlines.org)
- Display first 20 records in a table with pagination
- Text box for user to customize classification prompt
- Button to upload and process entire JSONL file
- Backend processes everything (loading spinner on frontend)
- Return processed JSONL with classifications back to frontend
- Display results in table

### Architecture Decisions (Locked In)

- **JSONL Format**: Flexible schema - support any JSON object, extract text from configurable field name
- **Classification Method**: Custom prompt box - user has full control over prompt
- **Processing Style**: Batch processing - all at once with loading spinner (NOT streaming)
- **Output Format**: Include original text + classification result + performance metrics (duration)
- **Features**: Download button to export results as JSONL file

### Why Batch Processing (not streaming)?

- Simpler implementation for first version
- Clear loading state with spinner
- All results available at once for download
- Can add progressive streaming later if needed

### Why Flexible Schema?

- Support various JSONL formats (tweets, reviews, messages, etc.)
- User specifies field name to extract text from
- More versatile than hardcoded structure
- Original data preserved for context

### Why Custom Prompt?

- Maximum flexibility for different classification tasks
- Users can specify categories, output format, reasoning, etc.
- More powerful than predefined category list

---

## Task List

### PHASE 1: Backend Implementation

- [ ] Create `backend/src/recipes/batch_text_classification.py`
    - [ ] **Module Docstring** (top of file - comprehensive!)
        - Explain recipe purpose: Text Classification with parallel processing
        - List key features:
            - Flexible JSONL schema (user specifies field to extract)
            - Custom classification prompts
            - Parallel batch processing using asyncio
            - Performance metrics (duration per item)
        - Explain architecture: receives batch request, processes in parallel, returns JSON array
        - Reference: See `multiturn_chat.py` and `image_captioning.py` for docstring examples

    - [ ] **Imports**

        ```python
        import asyncio
        import json
        import time
        from typing import Any

        from fastapi import APIRouter, HTTPException
        from fastapi.responses import Response
        from openai import AsyncOpenAI
        from pydantic import BaseModel

        from ..core.endpoints import get_cached_endpoint
        from ..core.code_reader import read_source_file
        ```

    - [ ] **Define Pydantic Request Models**
        - `TextItem` model:
            - `itemId: str` - unique identifier for this item
            - `originalData: dict | Any` - the raw JSON from JSONL
        - `BatchClassificationRequest` model:
            - `endpointId: str` - which LLM endpoint to use
            - `modelName: str` - which model (e.g., "llama-3.1-8b")
            - `systemPrompt: str` - custom classification instructions
            - `textField: str` - which field in originalData contains text to classify
            - `batch: list[TextItem]` - all items to process

    - [ ] **Define Response Model**
        - `ClassificationResult` model:
            - `itemId: str` - matches input itemId
            - `originalText: str` - extracted text that was classified
            - `classification: str` - classification result from LLM
            - `duration: int` - milliseconds taken to classify

    - [ ] **Implement Router**

        ```python
        router = APIRouter(prefix="/api/recipes", tags=["recipes"])
        ```

    - [ ] **Implement POST Endpoint** (`/batch-text-classification`)
        - Validate endpoint exists using `get_cached_endpoint(request.endpointId)`
        - Extract base_url and api_key from endpoint
        - Create `AsyncOpenAI` client with these credentials
        - Implement `process_item(item: TextItem)` async function:
            - Extract text from `item.originalData[textField]`
            - Handle missing/null fields gracefully (skip or return error)
            - Build messages array: `[{"role": "system", "content": systemPrompt}, {"role": "user", "content": extracted_text}]`
            - Call `client.chat.completions.create()` with streaming
            - Accumulate response text from chunks
            - Track duration: start_time to end_time in milliseconds
            - Return `ClassificationResult` as dict
            - Handle errors: catch exceptions and return error result
        - Process all items in parallel using `asyncio.gather()`:
            - Create tasks for all items
            - Wait for all to complete (don't stream results)
            - Collect all results in list
        - Return complete results list as JSON
        - Include error handling at endpoint level

    - [ ] **Implement GET Endpoint** (`/batch-text-classification/code`)
        - Use `read_source_file(__file__)` to read this file
        - Return as `Response(content=read_source_file(__file__), media_type="text/plain")`
        - Handle errors gracefully

    - [ ] **Add Section Comments**
        - Organize code with clear section headers:
            ```python
            # ============================================================================
            # Types and Models
            # ============================================================================
            ```
        - Sections: Types & Models, Helper Functions, Main Endpoint, Code Endpoint

    - [ ] **Use Modern Python Type Hints**
        - Use PEP 604 syntax: `str | None` instead of `Optional[str]`
        - Type all function parameters and return values
        - Document Pydantic models with docstrings
        - Example docstring:
            ```python
            class BatchClassificationRequest(BaseModel):
                """Request model for Text Classification."""
                endpointId: str
                modelName: str
                systemPrompt: str
                textField: str
                batch: list[TextItem]
            ```

    - [ ] **Add Educational Comments**
        - Explain why we use `asyncio.gather()` for parallel processing
        - Comment on performance: why tracking duration matters
        - Explain field extraction pattern
        - Note how AsyncOpenAI client works

    - [ ] **Error Handling**
        - Validate endpoint exists before processing
        - Handle missing textField gracefully
        - Handle invalid JSON in originalData
        - Catch API errors and return meaningful messages
        - Use HTTPException for error responses

### PHASE 2: Router Registration

- [ ] Update `backend/src/main.py`
    - [ ] Add import: `from .recipes import batch_text_classification`
    - [ ] Add router registration: `app.include_router(batch_text_classification.router)`
    - [ ] Verify syntax is correct
    - [ ] Do not modify anything else in this file

### PHASE 3: Testing & Validation

- [ ] Test endpoint is accessible:
    - Start backend: `cd backend && uv run dev`
    - Backend should run without errors on startup
    - Verify router registered: check FastAPI logs
- [ ] Test request validation:
    - Missing fields should return 422 error
    - Invalid endpointId should return helpful error
    - Invalid JSON in batch should be caught
- [ ] Test with actual LLM endpoint:
    - Configure `COOKBOOK_ENDPOINTS` in `.env.local`
    - Test single item batch first
    - Test multiple items in parallel
    - Verify all items processed
- [ ] Test text field extraction:
    - Works with nested paths (if supported)
    - Handles missing fields gracefully
    - Works with various data types
- [ ] Test response format:
    - Returns JSON array (not streaming)
    - All required fields present
    - Duration values are reasonable (milliseconds)
    - itemId matches input itemId
- [ ] Test performance:
    - Parallel processing actually works (time multiple concurrent items)
    - Verify items processed simultaneously, not sequentially
- [ ] Test error handling:
    - API error from LLM returns sensible error message
    - Invalid request returns 422 with details
    - Missing endpoint returns 400
- [ ] Test code endpoint:
    - `GET /api/recipes/batch-text-classification/code` returns source
    - Content type is "text/plain"
    - Code is readable and complete

---

## Key Implementation Details

### Parallel Processing Pattern

Use `asyncio.gather()` NOT `asyncio.as_completed()`:

```python
# CORRECT for batch response (not streaming)
tasks = [process_item(item) for item in request.batch]
results = await asyncio.gather(*tasks)
return results  # Complete JSON array
```

**Why not streaming**: Frontend gets loading spinner, data download available all at once.

### Text Extraction Pattern

```python
try:
    text = item.originalData.get(request.textField, "")
    if not text or not isinstance(text, str):
        raise ValueError(f"Field '{request.textField}' not found or not a string")
except Exception as e:
    # Return error result for this item, continue with others
    return ClassificationResult(
        itemId=item.itemId,
        originalText="<error>",
        classification="<error>",
        duration=-1
    )
```

### Message Building

```python
messages = [
    {"role": "system", "content": request.systemPrompt},
    {"role": "user", "content": text}
]
```

Keep it simple - systemPrompt does all the work of defining categories/format.

### Duration Tracking

```python
start_time = time.time()
# ... do work ...
duration_ms = int((time.time() - start_time) * 1000)
```

Return milliseconds (not seconds) for accuracy.

---

## Similar Code to Reference

**SSE Streaming (multiturn_chat.py)**: NOT used here - we do batch, not streaming
**NDJSON Streaming (image_captioning.py)**: NOT used here - we return full array
**Parallel Processing (image_captioning.py)**: Use pattern but return all at once

Look at `image_captioning.py` for:

- Async function patterns
- Error handling structure
- Module docstring style
- Use of AsyncOpenAI

Look at `multiturn_chat.py` for:

- Message building patterns
- Endpoint validation
- Pydantic models

---

## Dependencies on Frontend Agent

**Frontend agent needs backend to be ready for:**

- `POST /api/recipes/batch-text-classification` endpoint
- `GET /api/recipes/batch-text-classification/code` endpoint
- Routes automatically register when router is included

**Frontend will:**

- Send requests matching API specification
- Handle loading spinner while waiting
- Parse JSON array response
- Display results in table
- Download results as JSONL

---

## Important Reminders

✅ **DO:**

- Only modify `batch_text_classification.py` and `main.py`
- Follow the API contract exactly (request/response format above)
- Use modern Python type hints (PEP 604)
- Add comprehensive docstrings and comments
- Use AsyncOpenAI for async processing
- Process items in parallel with `asyncio.gather()`
- Return complete JSON array (not streaming)
- Test thoroughly before marking complete

❌ **DO NOT:**

- Touch any frontend files or directories
- Stream results (return complete array)
- Use synchronous API calls
- Modify the API specification (that's the contract)
- Make assumptions about frontend implementation
- Add new backend dependencies without discussion

---

## Progress Tracking

**Status**: Ready to implement

**Current Phase**: Phase 1 - Backend Implementation

**Last Updated**: 2025-10-30

**Assigned To**: Backend Agent

---

## References

- AsyncOpenAI patterns: `multiturn_chat.py` (lines 65-100)
- Parallel processing: `image_captioning.py` (lines 118-130)
- Module docstring: `image_captioning.py` (top of file)
- Pydantic models: `multiturn_chat.py` (lines 20-50)
- Error handling: `image_captioning.py` (lines 145-165)
- Code endpoint: Both existing recipes (last 5 lines)
- Contributing guide: `docs/contributing.md`
