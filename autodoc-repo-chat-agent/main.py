import asyncio
import json
import os
import re
import time
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from functools import lru_cache
import warnings
import aiofiles

from openai import AsyncOpenAI
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    TaskProgressColumn,
    TimeElapsedColumn,
)
from rich.table import Table
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from rich.markdown import Markdown
from gitingest import ingest_async
from rich.box import ROUNDED
from docutils.core import publish_string
from docutils.writers.html5_polyglot import Writer
from rich.live import Live

warnings.filterwarnings("ignore", message="`search` method is deprecated")

LLM_SERVER_URL = os.getenv("LLM_SERVER_URL", "http://localhost:8010/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "local")
LLM_MODEL = "Qwen/Qwen2.5-7B-Instruct-1M"
BATCH_SIZE = 50

LANGUAGE_CONFIGS = {
    "python": {
        "features": [
            "Type hints",
            "Decorators",
            "Context managers",
            "Async/await",
            "Generator functions",
        ],
        "import_format": "from {package} import {name}",
        "code_block": "python",
        "type_system": "Python type hints (str, int, List[str], etc.)",
        "patterns": {
            "function": r"def\s+\w+\s*\(.*?\).*?:(?:(?!\ndef\s+).)*",
            "class": r"class\s+\w+(?:\(.*?\))?.*?:(?:(?!\nclass\s+).)*",
        },
        "extensions": [".py"],
        "name_pattern": r"(def|class)\s+(\w+)",
    },
    "mojo": {
        "features": [
            "SIMD vectorization",
            "Memory management",
            "Struct methods",
            "Traits and trait implementations",
            "Python interop",
            "Ownership system",
            "Zero-cost abstractions",
            "Value semantics",
        ],
        "import_format": "from {package} import {name}",
        "code_block": "mojo",
        "type_system": "Mojo types (Int, Float64, StringLiteral, etc.) with traits",
        "patterns": {
            "function": r"(fn\s+\w+\s*\(.*?\)(?:\s*->\s*.*?)?\s*:(?:(?!\nfn\s+).)*)",
            "struct": r"(struct\s+\w+(?:\(.*?\))?.*?:(?:(?!\nstruct\s+).)*)",
            "trait": r"(trait\s+\w+(?:\(.*?\))?.*?:(?:(?!\ntrait\s+).)*)",
        },
        "extensions": [".🔥", ".mojo"],
        "name_pattern": r"(fn|struct|trait)\s+(\w+)",
    },
}


@dataclass
class QueryContext:
    query: str
    repo_url: Optional[str] = None
    repo_content: Optional[Dict[str, str]] = None
    output_dir: str = "docs"


@dataclass
class CodeChunk:
    content: str
    start_line: int
    end_line: int
    file_path: str
    chunk_type: str
    metadata: Dict[str, Any]


class QueryType(Enum):
    CHAT = "chat"
    DOC_GEN = "doc_gen"
    REPO_QA = "repo_qa"


class BaseHandler:
    def __init__(self, client, console):
        self.client = client
        self.console = console

    async def handle(self, context: QueryContext):
        raise NotImplementedError


class ChatHandler(BaseHandler):
    def __init__(self, client, console):
        super().__init__(client, console)
        self.conversation_history = []
        self.current_context = None

    async def handle(self, context: QueryContext):
        """Enhanced chat handler with conversation history and context."""
        if context.repo_url and (
            not self.current_context or self.current_context != context.repo_url
        ):
            self.current_context = context.repo_url
            self.conversation_history = []

        self.conversation_history.append({"role": "user", "content": context.query})

        if self.current_context:
            system_prompt = f"""You are DevRel Assistant, an AI designed to help developers with:
1. Answering programming questions
2. Explaining code concepts
3. Suggesting best practices
4. Providing code examples

Current context: Discussing repository {self.current_context}
When providing code examples, always use proper markdown formatting with language-specific syntax highlighting.
Keep responses concise but informative, and focus on practical, actionable advice."""
        else:
            system_prompt = """You are DevRel Assistant, an AI designed to help developers with:
1. Answering programming questions
2. Explaining code concepts
3. Suggesting best practices
4. Providing code examples

When providing code examples, always use proper markdown formatting with language-specific syntax highlighting.
Keep responses concise but informative, and focus on practical, actionable advice."""

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.conversation_history[-10:])

        # Use streaming for the response with Rich formatting
        full_response = ""

        # Create a panel that will be updated as we receive chunks
        response_panel = Panel(
            "", title="[bold green]Assistant[/bold green]", border_style="green"
        )

        with Live(response_panel, console=self.console, refresh_per_second=10) as live:
            async for chunk in await self.client.chat.completions.create(
                model=LLM_MODEL, messages=messages, stream=True
            ):
                content = chunk.choices[0].delta.content
                if content:
                    full_response += content
                    response_panel.renderable = Markdown(full_response)
                    live.update(response_panel)

        self.conversation_history.append(
            {"role": "assistant", "content": full_response}
        )
        return full_response


class RepoQAHandler(BaseHandler):
    def __init__(self, client, console):
        super().__init__(client, console)
        self.content_file = "repo_content.json"
        self.conversation_history = []
        self.current_repo_url = None
        self.collection_name = None
        self.embeddings_created = False

    def _process_raw_content(self, raw_content: str) -> Dict[str, str]:
        """Convert raw content string into a proper dictionary of files."""
        content = {}
        current_file = None
        current_content = []

        for line in raw_content.split("\n"):
            if line.startswith("File: "):
                if current_file and current_content:
                    content[current_file] = "\n".join(current_content)
                current_file = line.replace("File: ", "").strip()
                current_content = []
            elif not line.startswith("=" * 20):
                if current_file:
                    current_content.append(line)

        if current_file and current_content:
            content[current_file] = "\n".join(current_content)

        return content

    def _save_repo_content(self, content: Dict[str, str]):
        """Save repository content to file."""
        with open(self.content_file, "w") as f:
            json.dump(content, f)

    def _load_repo_content(self) -> Optional[Dict[str, str]]:
        """Load repository content from file."""
        if os.path.exists(self.content_file):
            with open(self.content_file, "r") as f:
                return json.load(f)
        return None

    def _detect_languages(self, content: Dict[str, str]) -> List[str]:
        """Detect programming languages in the repository."""
        languages = set()
        for file_path in content.keys():
            language = detect_language(file_path)
            if language:
                languages.add(language.capitalize())
        return list(languages) if languages else ["Unknown"]

    def _summarize_repo(self, content: Dict[str, str]) -> str:
        """Create a brief summary of repo content for context."""
        files = list(content.keys())
        return f"Repository contains {len(files)} files. Key files:\n" + "\n".join(
            f"- {f}" for f in files[:10]
        )

    async def handle(self, context: QueryContext):
        """Handle repository Q&A with context and conversation history."""
        if context.repo_url and context.repo_url != self.current_repo_url:
            self.current_repo_url = context.repo_url
            self.conversation_history = []
            self.embeddings_created = False

            repo_info = extract_repo_info(context.repo_url)
            self.collection_name = (
                f"{repo_info['user']}_{repo_info['repo']}_chunks".lower().replace(
                    "-", "_"
                )
            )

        if context.repo_url and not context.repo_content:
            with self.console.status(
                "[bold green]Processing repository...", spinner="dots"
            ):
                summary, tree, raw_content = await ingest_async(context.repo_url)
                context.repo_content = self._process_raw_content(raw_content)
                self._save_repo_content(context.repo_content)

                repo_info = extract_repo_info(context.repo_url)

                await code_parse(
                    context.repo_content,
                    self.collection_name,
                    console=self.console,
                    use_progress=False,
                )
                self.embeddings_created = True

                self.console.print(
                    Panel(
                        f"[bold]Repository:[/bold] {repo_info['user']}/{repo_info['repo']}\n"
                        f"[bold]Files:[/bold] {len(context.repo_content)} files processed\n"
                        f"[bold]Languages:[/bold] {', '.join(self._detect_languages(context.repo_content))}",
                        title="Repository Information",
                        border_style="blue",
                        expand=False,
                    )
                )
        elif not context.repo_content:
            context.repo_content = self._load_repo_content()

        if (
            context.repo_content
            and not self.embeddings_created
            and self.collection_name
        ):
            with self.console.status(
                "[bold green]Creating embeddings for cached content...", spinner="dots"
            ):
                await code_parse(
                    context.repo_content,
                    self.collection_name,
                    console=self.console,
                    use_progress=False,
                )
                self.embeddings_created = True
                self.console.print(
                    "[bold green]Embeddings created for cached repository content[/bold green]"
                )

        if not context.repo_content:
            return "No repository content available for Q&A."

        self.conversation_history.append({"role": "user", "content": context.query})

        # Perform semantic search to find relevant code chunks
        relevant_chunks = []
        if self.collection_name:
            try:
                with self.console.status(
                    "[bold green]Searching for relevant code...", spinner="dots"
                ):
                    search_results = await semantic_search(
                        context.query, self.collection_name, top_k=3
                    )

                    if search_results:
                        relevant_chunks = [
                            f"File: {result['file_path']} (lines {result['start_line']}-{result['end_line']})\n"
                            f"```{result['language']}\n{result['content']}\n```"
                            for result in search_results
                        ]
                        self.console.print(
                            f"[bold green]Found {len(relevant_chunks)} relevant code chunks[/bold green]"
                        )
            except Exception as e:
                self.console.print(f"[bold yellow]Search error: {e}[/bold yellow]")
                self.console.print(
                    "[bold yellow]Continuing without semantic search results[/bold yellow]"
                )

        context_with_chunks = f"""Repository structure:
{self._summarize_repo(context.repo_content)}

"""
        if relevant_chunks:
            context_with_chunks += (
                f"\nRelevant code chunks for this query:\n\n"
                + "\n\n".join(relevant_chunks)
            )

        system_prompt = f"""You are a repository expert answering questions about this codebase.
{context_with_chunks}

When referencing code, use markdown code blocks with proper syntax highlighting.
Be specific about file paths and line numbers when referring to code."""

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.conversation_history[-10:])

        full_response = ""
        response_panel = Panel(
            "", title="[bold green]Repository Expert[/bold green]", border_style="green"
        )

        with Live(response_panel, console=self.console, refresh_per_second=10) as live:
            async for chunk in await self.client.chat.completions.create(
                model=LLM_MODEL, messages=messages, stream=True
            ):
                content = chunk.choices[0].delta.content
                if content:
                    full_response += content
                    response_panel.renderable = Markdown(full_response)
                    live.update(response_panel)

        self.conversation_history.append(
            {"role": "assistant", "content": full_response}
        )
        return full_response


class DocGenHandler(BaseHandler):
    async def handle(self, context: QueryContext) -> str:
        """Handle documentation generation request."""
        self.console.print(
            Panel.fit(
                "[bold blue]Agentic Documentation Generator[/bold blue]\n"
                "Automatically generating comprehensive documentation for your codebase",
                title="[bold]Welcome[/bold]",
                border_style="blue",
            )
        )

        query_type, repo_url = await determine_query_type(context.query, self.client)

        if not repo_url:
            return "Error: Could not find a valid GitHub repository URL in the query."

        repo_info = extract_repo_info(repo_url)

        with self.console.status("[bold green]Ingesting repository...", spinner="dots"):
            self.console.print(f"[bold]Repository URL:[/bold] {repo_url}")
            start_time = time.time()
            summary, tree, raw_content = await ingest_async(repo_url)
            elapsed = time.time() - start_time
            self.console.print(
                f"[bold green]Repository ingested in {elapsed:.2f} seconds[/bold green]"
            )

        with self.console.status("[bold green]Processing files...", spinner="dots"):
            content = {}
            current_file = None
            current_content = []

            if raw_content:
                for line in raw_content.split("\n"):
                    if line.startswith("File: "):
                        if current_file and current_content:
                            content[current_file] = "\n".join(current_content)
                        current_file = line.replace("File: ", "").strip()
                        current_content = []
                    elif not line.startswith("=" * 20):
                        if current_file:
                            current_content.append(line)

                if current_file and current_content:
                    content[current_file] = "\n".join(current_content)

        readme_content = None
        readme_files = [
            "README.md",
            "README.rst",
            "README.txt",
            "README",
            "readme.md",
            "readme.rst",
            "readme.txt",
            "readme",
        ]

        for readme_file in readme_files:
            if readme_file in content:
                readme_content = content[readme_file]
                self.console.print(
                    f"[bold green]Found README: {readme_file}[/bold green]"
                )
                break

        table = Table(title="Repository Statistics", box=ROUNDED)
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")
        table.add_row("Files processed", str(len(content)))
        table.add_row(
            "Total size", f"{sum(len(c) for c in content.values()) / 1024:.2f} KB"
        )
        self.console.print(table)

        primary_language = await determine_primary_language(content)

        collection_name = f"{primary_language}_chunks"
        chunks = await code_parse(content, collection_name, console=self.console)
        self.console.print(
            f"[bold green]Code parsed: {len(chunks)} chunks identified[/bold green]"
        )

        documentation = {}
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeElapsedColumn(),
            console=self.console,
        ) as progress:
            doc_task = progress.add_task(
                "[bold blue]Generating documentation...", total=len(chunks)
            )

            batches = [
                chunks[i : i + BATCH_SIZE] for i in range(0, len(chunks), BATCH_SIZE)
            ]
            tasks = []

            for batch in batches:
                tasks.append(self._process_doc_batch(batch, primary_language))

            batch_results = await asyncio.gather(*tasks)

            for result in batch_results:
                documentation.update(result)
                progress.update(doc_task, advance=len(result))

        examples = await self._generate_examples(documentation, primary_language)

        await build_doc_site(
            documentation=documentation,
            top_level_examples=examples,
            output_dir=context.output_dir,
            readme_content=readme_content,
            repo_info=repo_info,
            language=primary_language,
            client=self.client,
        )

        return f"Documentation generated successfully in {context.output_dir}/"

    async def _process_doc_batch(
        self, batch: List[CodeChunk], language: str
    ) -> Dict[str, str]:
        """Process a batch of chunks for documentation generation."""
        batch_docs = {}
        tasks = []

        for chunk in batch:
            tasks.append(self._generate_doc_for_chunk(chunk, language))

        results = await asyncio.gather(*tasks)

        for chunk, doc in zip(batch, results):
            batch_docs[chunk.metadata["name"]] = doc

        return batch_docs

    async def _generate_doc_for_chunk(self, chunk: CodeChunk, language: str) -> str:
        """Generate documentation for a single chunk."""
        prompt = get_language_prompt(language, "api")

        try:
            response = await self.client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": prompt},
                    {
                        "role": "user",
                        "content": f"""
                    Code to document:
                    ```{language}
                    {chunk.content}
                    ```

                    File: {chunk.file_path}
                    Lines: {chunk.start_line}-{chunk.end_line}
                    """,
                    },
                ],
            )
            return clean_code_example(response.choices[0].message.content)
        except Exception as e:
            return f"Error generating documentation: {str(e)}"

    async def _generate_examples(
        self, documentation: Dict[str, str], primary_language: str
    ) -> Dict[str, str]:
        """Generate top-level code examples specific to the repository."""
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeElapsedColumn(),
            console=self.console,
        ) as progress:
            example_task = progress.add_task(
                "[bold blue]Generating examples...", total=3
            )

            components = list(documentation.keys())
            categorization_prompt = f"""Analyze these components and categorize them into:
            1. Basic (essential components for core functionality)
            2. Intermediate (components for typical workflows)
            3. Advanced (components for complex scenarios)

            Components: {', '.join(components)}

            Format:
            BASIC:
            <component list>

            INTERMEDIATE:
            <component list>

            ADVANCED:
            <component list>
            """

            response = await self.client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at categorizing code components.",
                    },
                    {"role": "user", "content": categorization_prompt},
                ],
            )

            categories = {"basic": [], "intermediate": [], "advanced": []}
            current_category = None
            for line in response.choices[0].message.content.split("\n"):
                if line.startswith("BASIC:"):
                    current_category = "basic"
                elif line.startswith("INTERMEDIATE:"):
                    current_category = "intermediate"
                elif line.startswith("ADVANCED:"):
                    current_category = "advanced"
                elif line.strip() and current_category:
                    component = line.strip()
                    if component in documentation:
                        categories[current_category].append(component)

            example_prompts = {
                "basic": self._create_example_prompt(
                    categories["basic"], documentation, primary_language, "basic"
                ),
                "intermediate": self._create_example_prompt(
                    categories["intermediate"],
                    documentation,
                    primary_language,
                    "intermediate",
                ),
                "advanced": self._create_example_prompt(
                    categories["advanced"], documentation, primary_language, "advanced"
                ),
            }

            tasks = []
            for level, prompt in example_prompts.items():
                tasks.append(
                    self.client.chat.completions.create(
                        model=LLM_MODEL,
                        messages=[
                            {
                                "role": "system",
                                "content": """You are an expert developer creating educational code examples...""",
                            },
                            {"role": "user", "content": prompt},
                        ],
                    )
                )

            results = await asyncio.gather(*tasks)
            progress.update(example_task, advance=3)

            return {
                "basic": clean_code_example(results[0].choices[0].message.content),
                "intermediate": clean_code_example(
                    results[1].choices[0].message.content
                ),
                "advanced": clean_code_example(results[2].choices[0].message.content),
            }

    def _create_example_prompt(
        self,
        components: List[str],
        documentation: Dict[str, str],
        language: str,
        level: str,
    ) -> str:
        """Create a prompt for generating code examples using actual documentation."""
        component_docs = "\n\n".join(
            [f"Component: {comp}\n{documentation[comp]}" for comp in components]
        )

        return f"""Using ONLY the following components from the actual codebase:

{component_docs}

Create a {level} example that:
1. Shows how to use these specific components together
2. Demonstrates real use cases from the codebase
3. Includes clear comments explaining the usage
4. Is complete and runnable
5. Follows {language} best practices

The example should use the actual API and features available in the codebase, not generic or made-up functionality.
Primary language: {language}"""


async def determine_query_type(query: str, client) -> Tuple[QueryType, Optional[str]]:
    """Determine if this is a chat, doc generation, or repo QA query."""
    prompt = """Analyze this query and determine if it's:
    1. A request to generate documentation (if it contains words like 'gendoc', 'generate docs', 'create documentation')
    2. A question about a specific repository (if it asks about code in a specific repo)
    3. A general chat question (if it's neither of the above)

    If it's a documentation generation request, extract the GitHub repository URL.
    If it's a repository question, extract the GitHub repository URL.
    If there's no GitHub URL, respond with 'None'.

    Query: {query}

    Respond in this format:
    TYPE: <DOC_GEN, REPO_QA, or CHAT>
    URL: <GitHub URL or None>"""

    response = await client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are an expert at analyzing queries and extracting GitHub URLs.",
            },
            {"role": "user", "content": prompt.format(query=query)},
        ],
    )

    result = response.choices[0].message.content
    repo_url = None
    query_type = QueryType.CHAT

    for line in result.split("\n"):
        if line.startswith("URL:"):
            url = line.replace("URL:", "").strip()
            if url.lower() != "none" and "github.com" in url.lower():
                repo_url = url
        elif line.startswith("TYPE:"):
            type_str = line.replace("TYPE:", "").strip().lower()
            try:
                query_type = QueryType(type_str)
            except ValueError:
                query_type = QueryType.CHAT

    return query_type, repo_url


def extract_repo_info(repo_url: str) -> Dict[str, str]:
    """Extract user and repo name from GitHub URL."""
    github_patterns = [
        r"https?://github\.com/([^/]+)/([^/]+)(?:\.git)?/?.*",
        r"git@github\.com:([^/]+)/([^/]+)(?:\.git)?/?.*",
    ]

    for pattern in github_patterns:
        match = re.match(pattern, repo_url)
        if match:
            return {
                "user": match.group(1),
                "repo": match.group(2).replace(".git", ""),
                "url": repo_url,
            }

    return {"user": "USER", "repo": "REPO", "url": repo_url}


async def determine_primary_language(content: Dict[str, str]) -> str:
    """Determine the primary programming language of the codebase."""
    lang_counts = {}
    for file_path in content.keys():
        lang = detect_language(file_path)
        if lang:
            lang_counts[lang] = lang_counts.get(lang, 0) + 1

    return max(lang_counts.items(), key=lambda x: x[1])[0] if lang_counts else "python"


def should_skip_file(file_path: str) -> bool:
    """Determine if a file should be skipped during processing."""
    skip_paths = [
        ".github/",
        "tests/",
        "test/",
        "examples/",
        "demos/",
        "docs/",
        "scripts/",
        "tools/",
        ".vscode/",
        ".idea/",
        "__pycache__/",
        "node_modules/",
        "dist/",
        "build/",
        "venv/",
        "env/",
    ]

    skip_extensions = [
        ".md",
        ".rst",
        ".txt",
        ".yml",
        ".yaml",
        ".json",
        ".ini",
        ".cfg",
        ".toml",
        ".bat",
        ".sh",
        ".ps1",
        ".pyc",
        ".pyo",
        ".pyd",
        ".so",
        ".dll",
        ".dylib",
        ".egg-info",
        ".coverage",
        ".DS_Store",
        "Dockerfile",
        ".dockerignore",
        ".gitignore",
        "LICENSE",
        "MANIFEST.in",
        "tox.ini",
        "setup.cfg",
        "pyproject.toml",
    ]

    skip_patterns = [
        r"test_.*\.py$",
        r".*_test\.py$",
        r"conftest\.py$",
        r".*\.config\.js$",
        r".*\.conf$",
        r"requirements.*\.txt$",
        r"setup\.py$",
        r".*demo.*\.py$",
        r".*example.*\.py$",
    ]

    return (
        any(skip_path in file_path for skip_path in skip_paths)
        or any(file_path.endswith(ext) for ext in skip_extensions)
        or any(re.match(pattern, file_path) for pattern in skip_patterns)
    )


def detect_language(file_path: str) -> Optional[str]:
    """Detect programming language from file extension."""
    for lang, config in LANGUAGE_CONFIGS.items():
        if any(file_path.endswith(ext) for ext in config["extensions"]):
            return lang
    return None


async def semantic_search(
    query: str, collection_name: str, top_k: int = 5
) -> List[Dict]:
    """Perform semantic search on code chunks."""
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    qdrant = get_qdrant_client()

    query_vector = embedding_model.encode(query).tolist()

    try:
        results = qdrant.search(
            collection_name=collection_name, query_vector=query_vector, limit=top_k
        )

        return [
            {
                "file_path": hit.payload["file_path"],
                "start_line": hit.payload["start_line"],
                "end_line": hit.payload["end_line"],
                "name": hit.payload["name"],
                "content": hit.payload["content"],
                "chunk_type": hit.payload["chunk_type"],
                "language": hit.payload["language"],
                "score": hit.score,
            }
            for hit in results
        ]
    except Exception as e:
        print(f"Search error: {e}")
        return []


def get_language_prompt(language: str, doc_type: str) -> str:
    """Generate language-specific documentation prompts."""
    config = LANGUAGE_CONFIGS.get(language, LANGUAGE_CONFIGS["python"])

    if doc_type == "api":
        return f"""You are an expert technical writer specializing in {language.title()} API documentation.
Focus on providing clear, concise, and accurate information about the code.
Include examples that demonstrate {language.title()}'s key features like {', '.join(config['features'])}.
Document parameter types using {config['type_system']}.

Structure your documentation with these sections:
1. Brief description of what the component does
2. Parameters/Arguments with types and descriptions
3. Return values with types and descriptions
4. Exceptions or error handling
5. Usage examples with code and explanations

For code examples, always use proper markdown code blocks:
```{config['code_block']}
# Example code here
```

Make sure to highlight {language.title()}-specific features and best practices."""
    else:
        return f"""You are a senior {language.title()} developer creating educational code examples.
Focus on practical, runnable examples that demonstrate {language.title()}'s capabilities.
Include examples of:
{chr(10).join(f'- {feature}' for feature in config['features'])}

For code examples, always use proper markdown code blocks:
```{config['code_block']}
# Example code here
```

Make sure examples are complete and demonstrate {language.title()} best practices."""


async def generate_documentation(chunk, prompt, doc_type, client):
    """Generate documentation or examples using the LLM."""
    language = chunk.metadata.get("language", "python")
    config = LANGUAGE_CONFIGS.get(language, LANGUAGE_CONFIGS["python"])

    system_content = get_language_prompt(language, doc_type)

    try:
        enhanced_prompt = f"""
{prompt}

When creating code examples:
0. Be brief and concise
1. Always use proper code blocks with ```{config['code_block']} at the start and ``` at the end
2. Make sure examples are complete and runnable
3. Include necessary imports using the format: {config['import_format'].format(package=chunk.file_path.split('/')[0], name=chunk.metadata.get('name'))}
4. Use proper variable names that match the codebase
5. Reference only existing functions and classes
6. When linking to other components, use proper markdown links: [ComponentName](ComponentName.md)
7. Demonstrate these language-specific features where appropriate:
{chr(10).join(f'   - {feature}' for feature in config['features'])}
"""

        response = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": enhanced_prompt},
            ],
        )
        content = response.choices[0].message.content
        return ensure_code_blocks_closed(content)
    except Exception as e:
        return e


def ensure_code_blocks_closed(content):
    """Ensure all code blocks are properly closed and correctly formatted."""
    if not content:
        return content

    content = re.sub(r"```(\w+)([^\n])", r"```\1\n\2", content)
    content = re.sub(r"```(\s*#+ .*?)\s*```", r"\1", content)

    open_blocks = re.findall(r"```(?:\w+)?", content)
    close_blocks = re.findall(r"```\s*$", content, re.MULTILINE)

    if len(open_blocks) > len(close_blocks):
        content += "\n" + "```\n" * (len(open_blocks) - len(close_blocks))

    content = re.sub(r"```\s*\n", r"```python\n", content)

    content = re.sub(r"([^\n])```", r"\1\n```", content)
    content = re.sub(r"```\n?([^\n])", r"```\n\n\1", content)

    lines = content.split("\n")
    in_code_block = False
    result_lines = []

    for line in lines:
        if line.strip().startswith("```"):
            in_code_block = not in_code_block
            result_lines.append(line)
        elif (
            in_code_block
            and line.strip().startswith("#")
            and not line.strip().startswith("#!")
        ):
            result_lines.append(line)
        else:
            result_lines.append(line)

    return "\n".join(result_lines)


def clean_code_example(content: str) -> str:
    """Clean and properly format code examples."""
    if not content:
        return content

    lines = content.split("\n")
    cleaned_lines = []
    in_code_block = False
    current_block = []

    for line in lines:
        if "```" in line:
            if not in_code_block:
                lang = line.replace("```", "").strip()
                in_code_block = True
                cleaned_lines.append(f'```{lang or "python"}')
            else:
                in_code_block = False
                if current_block:
                    cleaned_code = "\n".join(current_block).strip()
                    cleaned_lines.extend([cleaned_code, "```"])
                    current_block = []
                else:
                    cleaned_lines.append("```")
        else:
            if in_code_block:
                current_block.append(line)
            else:
                cleaned_lines.append(line)

    if in_code_block and current_block:
        cleaned_code = "\n".join(current_block).strip()
        cleaned_lines.extend([cleaned_code, "```"])

    content = "\n".join(cleaned_lines)
    content = re.sub(r"\n{3,}", "\n\n", content)
    content = re.sub(r"```\s*([a-zA-Z]+)\s*\n", r"```\1\n", content)
    content = re.sub(r"```[a-zA-Z]*\s*```", "", content)

    return content


@lru_cache(maxsize=1)
def get_qdrant_client():
    """Create a singleton Qdrant client."""
    return QdrantClient(":memory:")


async def code_parse(
    content: Dict[str, str],
    collection_name: str = "code_chunks",
    console: Optional[Console] = None,
    use_progress: bool = True,
) -> List[CodeChunk]:
    """Parse code into meaningful chunks using regex patterns and store embeddings."""
    if console is None:
        console = Console()

    chunks: List[CodeChunk] = []
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    qdrant = get_qdrant_client()

    try:
        qdrant.get_collection(collection_name)
        qdrant.delete_collection(collection_name)
    except Exception:
        pass

    qdrant.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )

    async def process_files():
        for file_path, code in content.items():
            if should_skip_file(file_path):
                continue

            try:
                language = detect_language(file_path)
                if not language:
                    continue

                patterns = LANGUAGE_CONFIGS[language]["patterns"]
                name_pattern = LANGUAGE_CONFIGS[language]["name_pattern"]

                for chunk_type, pattern in patterns.items():
                    matches = re.finditer(pattern, code, re.MULTILINE | re.DOTALL)

                    for match in matches:
                        chunk_content = match.group(0)
                        start_pos = match.start()
                        end_pos = match.end()

                        start_line = code[:start_pos].count("\n") + 1
                        end_line = code[:end_pos].count("\n") + 1

                        name_match = re.search(name_pattern, chunk_content)
                        name = (
                            name_match.group(2)
                            if name_match
                            else f"unnamed_{len(chunks)}"
                        )

                        if name.startswith("_"):
                            continue

                        chunk = CodeChunk(
                            content=chunk_content,
                            start_line=start_line,
                            end_line=end_line,
                            file_path=file_path,
                            chunk_type=chunk_type,
                            metadata={"name": name, "language": language},
                        )
                        chunks.append(chunk)

            except Exception as e:
                console.print(f"[bold red]Error parsing {file_path}: {e}[/bold red]")

    async def generate_embeddings():
        if not chunks:
            return

        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i : i + BATCH_SIZE]
            texts = [
                f"{chunk.file_path}:{chunk.metadata['name']}\n{chunk.content}"
                for chunk in batch
            ]
            embeddings = embedding_model.encode(texts)
            points = [
                PointStruct(
                    id=i + j,
                    vector=embedding.tolist(),
                    payload={
                        "file_path": chunk.file_path,
                        "start_line": chunk.start_line,
                        "end_line": chunk.end_line,
                        "name": chunk.metadata["name"],
                        "content": chunk.content,
                        "chunk_type": chunk.chunk_type,
                        "language": chunk.metadata["language"],
                    },
                )
                for j, (chunk, embedding) in enumerate(zip(batch, embeddings))
            ]

            qdrant.upsert(collection_name=collection_name, points=points)

    if use_progress:
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            parse_task = progress.add_task(
                "[bold blue]Parsing code files...", total=len(content)
            )
            for file_path, code in content.items():
                if should_skip_file(file_path):
                    progress.update(parse_task, advance=1)
                    continue

                try:
                    language = detect_language(file_path)
                    if not language:
                        progress.update(parse_task, advance=1)
                        continue

                    patterns = LANGUAGE_CONFIGS[language]["patterns"]
                    name_pattern = LANGUAGE_CONFIGS[language]["name_pattern"]

                    for chunk_type, pattern in patterns.items():
                        matches = re.finditer(pattern, code, re.MULTILINE | re.DOTALL)

                        for match in matches:
                            chunk_content = match.group(0)
                            start_pos = match.start()
                            end_pos = match.end()

                            start_line = code[:start_pos].count("\n") + 1
                            end_line = code[:end_pos].count("\n") + 1

                            name_match = re.search(name_pattern, chunk_content)
                            name = (
                                name_match.group(2)
                                if name_match
                                else f"unnamed_{len(chunks)}"
                            )

                            if name.startswith("_"):
                                continue

                            chunk = CodeChunk(
                                content=chunk_content,
                                start_line=start_line,
                                end_line=end_line,
                                file_path=file_path,
                                chunk_type=chunk_type,
                                metadata={"name": name, "language": language},
                            )
                            chunks.append(chunk)

                except Exception as e:
                    console.print(
                        f"[bold red]Error parsing {file_path}: {e}[/bold red]"
                    )

                progress.update(parse_task, advance=1)

            if chunks:
                embed_task = progress.add_task(
                    "[bold blue]Generating embeddings...", total=len(chunks)
                )

                for i in range(0, len(chunks), BATCH_SIZE):
                    batch = chunks[i : i + BATCH_SIZE]
                    texts = [
                        f"{chunk.file_path}:{chunk.metadata['name']}\n{chunk.content}"
                        for chunk in batch
                    ]
                    embeddings = embedding_model.encode(texts)
                    points = [
                        PointStruct(
                            id=i + j,
                            vector=embedding.tolist(),
                            payload={
                                "file_path": chunk.file_path,
                                "start_line": chunk.start_line,
                                "end_line": chunk.end_line,
                                "name": chunk.metadata["name"],
                                "content": chunk.content,
                                "chunk_type": chunk.chunk_type,
                                "language": chunk.metadata["language"],
                            },
                        )
                        for j, (chunk, embedding) in enumerate(zip(batch, embeddings))
                    ]

                    qdrant.upsert(collection_name=collection_name, points=points)

                    progress.update(embed_task, advance=len(batch))

                console.print(
                    f"[bold green]Embeddings generated and stored for {len(chunks)} code chunks[/bold green]"
                )
    else:
        await process_files()
        await generate_embeddings()
        console.print(
            f"[bold green]Processed {len(content)} files and generated embeddings for {len(chunks)} code chunks[/bold green]"
        )

    return chunks


def convert_rst_to_md(rst_content: str) -> str:
    """Convert RST content to Markdown."""
    try:
        html = publish_string(
            rst_content,
            writer=Writer(),
            settings_overrides={"output_encoding": "unicode"},
        )

        md_content = (
            html.decode("utf-8")
            .replace(".. code-block::", "```")
            .replace("<code>", "`")
            .replace("</code>", "`")
            .replace(".. image::", "!")
            .replace(":target:", "")
            .replace(":alt:", '"')
            .replace("|", "")
            .replace("`_", "")
            .replace("</h1>", "\n")
            .replace("</h2>", "\n")
            .replace("</h3>", "\n")
            .replace("</p>", "\n\n")
        )

        md_content = re.sub(r"<[^>]+>", "", md_content)

        md_content = re.sub(r"```\s*(\w+)\s*\n", r"```\1\n", md_content)

        md_content = re.sub(r'!\[(.*?)\]\s*(.*?)\s*"(.*?)"', r"![\3](\2)", md_content)

        return md_content
    except Exception as e:
        return f"Error converting RST to Markdown: {str(e)}\n\nOriginal content:\n{rst_content}"


async def generate_home_content(
    documentation: Dict[str, str], repo_info: Dict[str, str], client: AsyncOpenAI
) -> str:
    """Generate home page content using LLM."""
    all_docs = "\n\n".join(documentation.values())

    prompt = f"""You are a technical writer creating the home page for {repo_info['repo']}'s documentation.
Based on the following API documentation, create a clear and concise home page that includes:
1. A brief overview of what the library does
2. Key features and capabilities
3. Installation instructions
4. Basic usage example

Keep it focused and specific to this library. Don't make up features that aren't in the documentation.

Documentation content:
{all_docs}
"""

    response = await client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": "You are a technical documentation expert."},
            {"role": "user", "content": prompt},
        ],
    )

    return response.choices[0].message.content


async def verify_code_example(
    client: AsyncOpenAI, code: str, api_docs: str, name: str
) -> str:
    """Verify that a code example is valid and uses the API correctly."""
    prompt = f"""You are a code reviewer. Verify this code example for {name} matches the API documentation:

API Documentation:
{api_docs}

Code Example:
{code}

Check for:
1. Correct API usage according to documentation
2. No references to non-existent functions/classes
3. Proper syntax and imports
4. Realistic use cases

Respond with either:
- Just the word "VALID" if the example is correct
- A corrected version of the code if there are issues
"""

    response = await client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": "You are an expert code reviewer."},
            {"role": "user", "content": prompt},
        ],
    )

    result = response.choices[0].message.content.strip()
    return code if result == "VALID" else result


async def verify_home_content(
    client: AsyncOpenAI, content: str, documentation: Dict[str, str]
) -> str:
    """Verify that the home page content accurately reflects the API."""
    all_docs = "\n\n".join(documentation.values())

    prompt = f"""You are a technical documentation reviewer. Verify this home page content matches the API documentation:

API Documentation:
{all_docs}

Home Page Content:
{content}

Check for:
1. Accuracy of feature descriptions
2. No mentions of non-existent functionality
3. Correct installation instructions
4. Accurate overview of the library

Respond with either:
- Just the word "VALID" if the content is correct
- A corrected version of the content if there are issues
"""

    response = await client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": "You are an expert documentation reviewer."},
            {"role": "user", "content": prompt},
        ],
    )

    result = response.choices[0].message.content.strip()
    return content if result == "VALID" else result


async def build_doc_site(
    documentation: Dict[str, str],
    top_level_examples: Dict[str, str],
    output_dir: str,
    readme_content: Optional[str],
    repo_info: Dict[str, str],
    language: str = "python",
    client: AsyncOpenAI = None,
) -> None:
    """Build the documentation site."""
    console = Console()

    docs_dir = os.path.join(output_dir, "docs")
    api_dir = os.path.join(docs_dir, "api")
    os.makedirs(docs_dir, exist_ok=True)
    os.makedirs(api_dir, exist_ok=True)

    with Progress(
        SpinnerColumn(),
        TextColumn("[bold blue]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        verify_task = progress.add_task(
            "[bold blue]Verifying documentation and examples...",
            total=1
            + len(top_level_examples)
            + len([doc for doc in documentation.values() if "```python" in doc]),
        )

        home_content = await generate_home_content(documentation, repo_info, client)

        verification_tasks = [
            verify_home_content(client, home_content, documentation),
            *[
                verify_code_example(
                    client,
                    example,
                    "\n".join(documentation.values()),
                    f"{level} example",
                )
                for level, example in top_level_examples.items()
            ],
            *[
                verify_code_example(client, doc_content, doc_content, name)
                for name, doc_content in documentation.items()
                if "```python" in doc_content
            ],
        ]

        verification_results = await asyncio.gather(*verification_tasks)
        progress.update(verify_task, advance=len(verification_tasks))

        verified_home = verification_results[0]
        verified_examples = {
            level: result
            for level, result in zip(
                top_level_examples.keys(),
                verification_results[1 : 1 + len(top_level_examples)],
            )
        }
        verified_docs = {
            name: result
            for name, result in zip(
                [name for name, doc in documentation.items() if "```python" in doc],
                verification_results[1 + len(top_level_examples) :],
            )
        }

        index_content = f"""{verified_home}

## API Documentation

The following components are available in the {repo_info['repo']} API:

"""
        components = {"Classes": [], "Functions": [], "Constants": [], "Other": []}

        for name in sorted(documentation.keys()):
            if name[0].isupper() and "." not in name:
                components["Classes"].append(name)
            elif name.isupper():
                components["Constants"].append(name)
            elif "." not in name and "(" in documentation[name]:
                components["Functions"].append(name)
            else:
                components["Other"].append(name)

        for group, items in components.items():
            if items:
                index_content += f"\n### {group}\n\n"
                for name in sorted(items):
                    index_content += f"- [`{name}`](api/{name}.md)\n"

        installation_content = """# Installation and Setup

## Requirements

To view this documentation locally, you'll need:

1. Python 3.7 or higher
2. MkDocs and the Material theme

## Setup Instructions

1. Install the required packages:

```bash
pip install -r requirements.txt
```

2. Navigate to the documentation directory:

```bash
cd docs
```

3. Start the MkDocs development server:

```bash
mkdocs serve
```

4. Open your browser and go to [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## Building Static Site

To build a static version of the documentation:

```bash
mkdocs build
```

This will create a `site` directory with the static HTML files.
"""

        try:

            async def write_file(path: str, content: str):
                async with aiofiles.open(path, "w") as f:
                    await f.write(content)

            file_tasks = [
                write_file(os.path.join(docs_dir, "index.md"), index_content),
                write_file(
                    os.path.join(docs_dir, "installation.md"), installation_content
                ),
                *[
                    write_file(
                        os.path.join(
                            api_dir, f"{re.sub(r'[^a-zA-Z0-9_-]', '_', name)}.md"
                        ),
                        f"# {name}\n\n{verified_docs.get(name, doc_content)}",
                    )
                    for name, doc_content in documentation.items()
                ],
                write_file(
                    os.path.join(output_dir, "mkdocs.yml"),
                    f"""site_name: {repo_info['repo']} Documentation
theme:
  name: material
  features:
    - navigation.instant
    - navigation.tracking
    - navigation.sections
    - navigation.expand
    - navigation.indexes
    - toc.integrate
    - search.suggest
    - search.highlight
markdown_extensions:
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.inlinehilite
  - pymdownx.snippets
  - pymdownx.superfences
nav:
  - Home: index.md
  - Installation: installation.md
  - API Documentation:
    - Overview: api/index.md
    - Classes:
{chr(10).join(['      - ' + name + ': api/' + re.sub(r'[^a-zA-Z0-9_-]', '_', name) + '.md' for name in components['Classes']])}
    - Functions:
{chr(10).join(['      - ' + name + ': api/' + re.sub(r'[^a-zA-Z0-9_-]', '_', name) + '.md' for name in components['Functions']])}
""",
                ),
                write_file(
                    os.path.join(output_dir, "requirements.txt"),
                    """mkdocs>=1.4.0
mkdocs-material>=9.0.0
pymdown-extensions>=9.0
pygments>=2.14.0
""",
                ),
                write_file(
                    os.path.join(output_dir, "README.md"),
                    f"""# {repo_info['repo']} Documentation

This directory contains the documentation for {repo_info['repo']}.

## Viewing the Documentation

To view the documentation locally:

1. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

2. Start the MkDocs development server:
   ```
   mkdocs serve
   ```

3. Open your browser and go to [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## Documentation Structure

- `docs/`: Contains the Markdown files for the documentation
  - `index.md`: Home page
  - `installation.md`: Installation and setup instructions
  - `api/`: API documentation for all components

- `mkdocs.yml`: MkDocs configuration file
- `requirements.txt`: Python dependencies for the documentation

## Building the Documentation

To build a static version of the documentation:

```
mkdocs build
```

This will create a `site` directory with the static HTML files that can be deployed to a web server.
""",
                ),
            ]

            api_index_content = f"""# API Documentation

This section contains detailed documentation for all components in the {repo_info['repo']} API.

## Overview

The API is organized into the following categories:

"""
            for group, items in components.items():
                if items:
                    api_index_content += f"\n### {group}\n\n"
                    for name in sorted(items):
                        api_index_content += (
                            f"- [`{name}`]({re.sub(r'[^a-zA-Z0-9_-]', '_', name)}.md)\n"
                        )

            file_tasks.append(
                write_file(os.path.join(api_dir, "index.md"), api_index_content)
            )

            await asyncio.gather(*file_tasks)

            console.print(
                f"[bold green]Documentation generated successfully in {output_dir}/[/bold green]"
            )
            console.print("[bold green]To view the documentation:[/bold green]")
            console.print(f"[green]1. cd {output_dir}[/green]")
            console.print("[green]2. pip install -r requirements.txt[/green]")
            console.print("[green]3. mkdocs serve[/green]")
            console.print(
                "[green]4. Open http://127.0.0.1:8000/ in your browser[/green]"
            )

        except Exception as e:
            console.print(
                f"[bold red]Error writing documentation files: {str(e)}[/bold red]"
            )
            raise


async def main():
    """Main entry point for the application."""
    console = Console()
    client = AsyncOpenAI(base_url=LLM_SERVER_URL, api_key=LLM_API_KEY)

    handlers = {
        QueryType.CHAT: ChatHandler(client, console),
        QueryType.DOC_GEN: DocGenHandler(client, console),
        QueryType.REPO_QA: RepoQAHandler(client, console),
    }

    console.print(
        Panel(
            "[bold blue]Welcome to GitHub Repo Helper[/bold blue]\n\n"
            "I can help you with:\n"
            "- [green]Generating documentation[/green] for GitHub repositories\n"
            "- [green]Answering questions[/green] about repository code\n"
            "- [green]General questions[/green] about programming and development\n\n"
            "Type your query or 'quit' to exit",
            title="🤖 GitHub Repo Helper",
            border_style="blue",
            expand=False,
        )
    )

    conversation_history = []
    current_handler_type = None
    current_repo_url = None
    repo_content = None

    while True:
        console.print("[bold cyan]You:[/bold cyan] ", end="")
        query = input()

        if query.lower() in ["quit", "exit", "bye"]:
            console.print(
                "[bold blue]Thanks for using GitHub Repo Helper. Goodbye![/bold blue]"
            )
            break

        conversation_history.append({"role": "user", "content": query})

        # For queries that don't look like they contain a GitHub URL, use CHAT handler
        if "github.com" not in query.lower():
            query_type = QueryType.CHAT
            repo_url = current_repo_url  # Keep the current repo context
        else:
            query_type, repo_url = await determine_query_type(query, client)

        # If we have a current repo URL and no new one was detected, use the current one
        if (
            not repo_url
            and current_repo_url
            and query_type in [QueryType.DOC_GEN, QueryType.REPO_QA]
        ):
            repo_url = current_repo_url

        context = QueryContext(
            query=query, repo_url=repo_url, repo_content=repo_content
        )

        if current_handler_type != query_type:
            if query_type == QueryType.CHAT:
                handlers[QueryType.CHAT].conversation_history = (
                    conversation_history.copy()
                )
            elif query_type == QueryType.REPO_QA:
                if repo_url == current_repo_url:
                    handlers[QueryType.REPO_QA].conversation_history = (
                        conversation_history.copy()
                    )

            current_handler_type = query_type

        if repo_url:
            current_repo_url = repo_url

        # Only ask for repo URL if we don't have one at all and it's not a chat query
        if (
            query_type in [QueryType.DOC_GEN, QueryType.REPO_QA]
            and not context.repo_url
        ):
            console.print(
                "[bold yellow]Please provide a GitHub repository URL:[/bold yellow] ",
                end="",
            )
            context.repo_url = input()
            current_repo_url = context.repo_url

        if query_type == QueryType.REPO_QA and context.repo_url:
            handler = handlers[query_type]
            if hasattr(handler, "_load_repo_content"):
                if repo_content:
                    # Use already loaded repo content
                    context.repo_content = repo_content
                else:
                    existing_content = handler._load_repo_content()
                    if existing_content:
                        console.print(
                            "[bold yellow]I have cached content for this repository. Use it? (y/n)[/bold yellow] ",
                            end="",
                        )
                        use_cached = input().lower().startswith("y")
                        if use_cached:
                            context.repo_content = existing_content
                            repo_content = existing_content

        handler = handlers[query_type]
        result = await handler.handle(context)

        # Update repo_content if it was loaded during handling
        if context.repo_content:
            repo_content = context.repo_content

        conversation_history.append({"role": "assistant", "content": result})

        handler.conversation_history = conversation_history.copy()


if __name__ == "__main__":
    asyncio.run(main())
