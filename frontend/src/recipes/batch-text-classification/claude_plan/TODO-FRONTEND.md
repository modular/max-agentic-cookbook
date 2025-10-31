# FRONTEND AGENT: Batch Text Classification Recipe

⚠️ **IMPORTANT: PARALLEL DEVELOPMENT IN PROGRESS** ⚠️

**Another AI agent is simultaneously working on the BACKEND scope.**

You MUST ONLY work on files within the frontend directory. Do not modify, read, or touch any backend files.

---

## Your Scope

### Files You Own (and only you modify):

-   `frontend/src/recipes/batch-text-classification/` (all files in this directory)
-   `frontend/src/recipes/registry.ts` (add recipe entry only)
-   `frontend/src/recipes/components.ts` (add component mappings only)

### Files You DO NOT Touch:

-   Anything in `backend/` directory
-   `backend/src/main.py`
-   `backend/src/recipes/`
-   Any backend configuration files

### Files Owned by Backend Agent:

-   `backend/src/recipes/batch_text_classification.py`
-   `backend/src/main.py`

---

## Integration: The API Contract

The Backend Agent is building this API endpoint for you. **Both agents follow this specification exactly.**

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

### Response Format

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

### Code Endpoint

```
GET /api/recipes/batch-text-classification/code
```

Returns: Python source code as plain text

---

## Project Context

### User Requirements

-   Upload JSONL files (https://jsonlines.org)
-   Display first 20 records in a table with pagination
-   Text box for user to customize classification prompt
-   Button to upload and process entire JSONL file
-   Backend processes everything (loading spinner on frontend)
-   Return processed JSONL with classifications back to frontend
-   Display results in table

### Architecture Decisions (Locked In)

-   **JSONL Format**: Flexible schema - support any JSON object, extract text from configurable field name
-   **Classification Method**: Custom prompt box - user has full control over prompt
-   **Processing Style**: Batch processing - all at once with loading spinner (NOT streaming)
-   **Output Format**: Include original text + classification result + performance metrics (duration)
-   **Features**: Download button to export results as JSONL file

### Key Patterns from Existing Recipes

-   **Frontend**: React component exporting `Component` function with `RecipeProps`
-   **Registration**: Add to `registry.ts` (pure data) and `components.ts` (React mapping)
-   **File Upload**: Use Mantine Dropzone component (see image-captioning recipe)
-   **Code Viewing**: Every recipe needs `/code` endpoint

### Why Batch Processing (not streaming)?

-   Simpler implementation for first version
-   Clear loading state with spinner
-   All results available at once for download
-   Can add progressive streaming later if needed

### Why Flexible Schema?

-   Support various JSONL formats (tweets, reviews, messages, etc.)
-   User specifies field name to extract text from
-   More versatile than hardcoded structure
-   Original data preserved for context

### Why Custom Prompt?

-   Maximum flexibility for different classification tasks
-   Users can specify categories, output format, reasoning, etc.
-   More powerful than predefined category list

---

## Task List

### PHASE 0: Documentation (START HERE)

-   [ ] Create `frontend/src/recipes/batch-text-classification/README.mdx`
    -   Follow exact structure of multiturn-chat/README.mdx and image-captioning/README.mdx
    -   Sections: Architecture, Key Implementation Details, Why This Approach, File References, Protocol Flow, API Reference
    -   Document flexible JSONL schema approach
    -   Document custom prompt functionality
    -   Document batch processing (non-streaming) approach
    -   Include request/response examples matching the API contract above
    -   This README helps users understand the recipe - write it like documentation!

### PHASE 1: Frontend UI Implementation

-   [ ] Create `frontend/src/recipes/batch-text-classification/ui.tsx`
    -   [ ] Define TypeScript interfaces:
        -   `TextItem`: `{ id: string, originalData: unknown, text: string | null, classification: string | null, duration: number | null }`
        -   `ClassificationResult`: matches API response format exactly
    -   [ ] Implement main `Component` function accepting `RecipeProps` from `~/lib/types`
    -   [ ] State management:
        -   `uploadedItems: TextItem[]` - parsed JSONL items
        -   `results: ClassificationResult[]` - processed results
        -   `textField: string` - field name to extract (default: "text")
        -   `systemPrompt: string` - custom classification prompt
        -   `isProcessing: boolean` - loading state
        -   `error: Error | null` - error state
        -   `currentPage: number` - pagination state
    -   [ ] Implement JSONL file upload section:
        -   Use Mantine `Dropzone` accepting `.jsonl` files (see image-captioning/ui.tsx for pattern)
        -   Parse on drop: split by `\n`, parse each line as JSON using `originalData` pattern
        -   Auto-generate IDs using `nanoid()` for each item
        -   Store parsed items in state
        -   Show loading state during parsing
    -   [ ] Implement configuration section:
        -   `TextInput` for field name (placeholder: "text, content, message, etc.")
        -   Default value: "text"
        -   `Textarea` for system prompt (placeholder: "Enter classification instructions, e.g., 'Classify sentiment as positive, negative, or neutral'")
        -   Display extracted text preview as user types field name
    -   [ ] Implement preview table (before processing):
        -   Mantine `Table` showing first 20 records from uploadedItems
        -   Columns: Item # | Field Preview | Original JSON (collapsed)
        -   Show extracted text using textField parameter
        -   Pagination controls (page size: 20)
        -   Display total count: "Showing 1-20 of X items"
    -   [ ] Implement "Classify All" button:
        -   Disabled when: no file, no endpoint, no model, or no prompt
        -   Enabled: only when all required inputs present
        -   onClick: call `/api/recipes/batch-text-classification` with all items
        -   Show loading spinner during processing
        -   Handle errors gracefully
    -   [ ] Implement results section (after processing):
        -   Only show after successful classification
        -   Mantine `Table` with columns: Original Text | Classification | Duration (ms)
        -   Pagination for results (page size: 20)
        -   Performance summary: "Total items: X | Avg duration: Xms | Min: Xms | Max: Xms"
        -   Download button to export results as JSONL
    -   [ ] Implement download functionality:
        -   Convert results array to JSONL format (JSON.stringify each result, join with \n)
        -   Include: itemId, originalText, classification, duration
        -   Create blob and trigger download
        -   Filename: `classified-results-${Date.now()}.jsonl`
        -   Show confirmation when download starts
    -   [ ] Error handling:
        -   Show Alert component at top when error occurs
        -   Display helpful error messages from backend
        -   Allow retry after error
        -   Handle invalid JSONL gracefully
    -   [ ] Layout using Mantine components:
        -   Use `Stack` for main vertical layout
        -   Use `ScrollArea` for scrollable sections
        -   Use `Group` for action buttons (right-aligned)
        -   Use `Paper` for section containers
        -   Use `Divider` between sections
        -   Responsive design (mobile-friendly)

### PHASE 2: Recipe Registration

-   [ ] Update `frontend/src/recipes/registry.ts`

    -   Find the "Batch Text Classification" placeholder at line ~17 in Foundations section
    -   Replace it with:
        ```typescript
        {
          slug: 'batch-text-classification',
          title: 'Batch Text Classification',
          tags: ['JSONL', 'Batch Processing'],
          description: 'Upload JSONL files and classify text in bulk with custom prompts. Supports flexible schemas, parallel processing, and downloadable results.'
        }
        ```
    -   Preserve the structure exactly - this is pure data only, no React imports

-   [ ] Update `frontend/src/recipes/components.ts`
    -   Add UI component mapping to `recipeComponents`:
        -   `'batch-text-classification': lazyComponentExport(() => import('./batch-text-classification/ui'))`
    -   Add README component mapping to `readmeComponents`:
        -   `'batch-text-classification': lazy(() => import('./batch-text-classification/README.mdx'))`

### PHASE 3: Testing & Validation

-   [ ] Test JSONL file upload with various schemas:
    -   Simple: `{"text": "Hello world"}`
    -   Complex: `{"id": "123", "content": "Hello", "user": {"name": "John"}}`
    -   Missing fields: test extraction with wrong field name
-   [ ] Test text field extraction:
    -   Works with different field names (text, content, message, etc.)
    -   Shows error when field doesn't exist
    -   Handles null/undefined gracefully
-   [ ] Test custom prompt functionality:
    -   Verify prompt is sent to backend correctly
    -   Test various prompt formats
-   [ ] Test batch classification with actual LLM endpoint:
    -   Loading spinner appears during processing
    -   Results appear after completion
    -   All items classified successfully
-   [ ] Test pagination (both preview and results):
    -   Shows correct page count
    -   Navigation works correctly
    -   Correct items displayed on each page
-   [ ] Test download functionality:
    -   Downloaded JSONL file is valid
    -   Contains all required fields
    -   Can be re-uploaded and processed
-   [ ] Test error handling:
    -   Invalid JSONL file shows error
    -   Missing endpoint shows error
    -   API errors display helpfully
    -   Can recover and retry
-   [ ] Test responsive layout:
    -   Mobile: verify table is readable
    -   Tablet: buttons and inputs properly sized
    -   Desktop: optimal layout and spacing
-   [ ] Run code formatting:
    -   `cd frontend && npm run format`
    -   Verify no linting errors

---

## Mantine Components Reference

Components you'll need (all available in project):

-   `Dropzone` - File upload (from @mantine/dropzone)
-   `Table`, `Table.Thead`, `Table.Tbody`, `Table.Tr`, `Table.Th`, `Table.Td` - Data display
-   `Stack`, `Flex`, `Group`, `Box` - Layout
-   `ScrollArea` - Scrollable content
-   `Paper` - Container with background
-   `TextInput`, `Textarea` - Form inputs
-   `Button`, `ActionIcon` - Actions
-   `Alert` - Error/info messages
-   `LoadingOverlay` - Loading state
-   `Pagination` - Page navigation
-   `Badge` - Classification tags
-   `Divider` - Visual separator
-   `Title`, `Text` - Typography
-   `Space` - Spacing element

Icons (from @tabler/icons-react):

-   `IconUpload` - Upload icon
-   `IconDownload` - Download icon
-   `IconX` - Error icon
-   `IconCheck` - Success icon
-   `IconAlertCircle` - Warning icon

---

## Dependencies on Backend Agent

**DO NOT START until:**

-   Backend agent has created `batch_text_classification.py`
-   Backend router is registered in `backend/src/main.py`

**You can test with:**

-   Start backend: `cd backend && uv run dev`
-   Start frontend: `cd frontend && npm run dev`
-   Visit http://localhost:5173

**Communication points with backend agent:**

-   Both agents must follow API specification exactly (above)
-   Backend provides: POST endpoint + code endpoint
-   Frontend uses: the exact request/response format specified

---

## Important Reminders

✅ **DO:**

-   Only modify files in `frontend/` directory
-   Follow the API contract exactly
-   Use TypeScript path aliases (`~/lib`, `~/components`, etc.)
-   Keep components reusable and well-organized
-   Add helpful comments for educational purposes
-   Test thoroughly before marking complete

❌ **DO NOT:**

-   Touch any backend files or directories
-   Modify the API specification (that's the contract)
-   Add new dependencies without discussing with backend agent
-   Assume how backend implements things (only care about input/output)
-   Deviate from the Mantine component patterns in existing recipes

---

## Progress Tracking

**Status**: Ready to implement

**Current Phase**: Phase 0 - Documentation (README.mdx first!)

**Last Updated**: 2025-10-30

**Assigned To**: Frontend Agent

---

## References

-   JSONL spec: https://jsonlines.org
-   Existing recipes: `multiturn-chat/` and `image-captioning/` (for patterns)
-   Mantine documentation: https://mantine.dev
-   Recipe component examples: `frontend/src/recipes/image-captioning/ui.tsx`
-   Dropzone usage: lines 367-425 in image-captioning/ui.tsx
