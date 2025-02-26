import os
import asyncio
import chess
from autogen_agentchat.agents import AssistantAgent, SocietyOfMindAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import TextMentionTermination
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_agentchat.teams import RoundRobinGroupChat
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt

from utils import patch_openai_client_usage_tracking

patch_openai_client_usage_tracking()


os.environ["RICH_TRACEBACK"] = "1"  # 0=silent, 1=minimal, 2=full
LLM_MODEL = os.getenv("LLM_MODEL", "Qwen/Qwen2.5-7B-Instruct-1M")
LLM_FAMILY = os.getenv("LLM_FAMILY", "qwen")
LLM_SERVER_URL = os.getenv("LLM_SERVER_URL", "http://localhost:8010/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "local")


def create_base_client(base_url: str = LLM_SERVER_URL, temperature: float = 0.0):
    """Create base OpenAI client with DeepSeek model."""
    return OpenAIChatCompletionClient(
        model=LLM_MODEL,
        base_url=LLM_SERVER_URL,
        api_key=LLM_API_KEY,
        model_info={
            "name": LLM_MODEL,
            "family": LLM_FAMILY,
            "pricing": {"prompt": 0.0, "completion": 0.0},
            "function_calling": False,
            "vision": False,
            "json_output": False,
        },
        temperature=temperature,
        max_tokens=512,
        track_usage=False,
    )

def create_chess_agents(board: chess.Board, feedback: str = ""):
    """Create the team of chess agents using SocietyOfMindAgent."""
    client = create_base_client(temperature=0.1)

    last_move = board.peek().uci() if board.move_stack else 'None'

    threatened_pieces = []
    for square, piece in board.piece_map().items():
        if piece.color == chess.BLACK and board.is_attacked_by(chess.WHITE, square):
            threatened_pieces.append(f"{piece.symbol().upper()} on {chess.square_name(square)}")

    position_info = f"""CURRENT POSITION:
{board.unicode()}

CHESS RULES:
1. Pawns move forward one square (or two on first move)
2. Pawns capture diagonally only when enemy piece present
3. Knights move in L-shape (2+1)
4. Bishops move diagonally
5. Rooks move horizontally/vertically
6. Queen combines bishop + rook moves
7. King moves one square any direction

PIECE VALUES:
- Pawn = 1 point
- Knight = 3 points
- Bishop = 3 points
- Rook = 5 points
- Queen = 9 points
- King = ∞ (must be protected)

IMPORTANT:
- After White's move {last_move}, check if any of your pieces are under attack!
- Threatened Black pieces: {', '.join(threatened_pieces) if threatened_pieces else 'None'}
- Don't lose pieces for free - move threatened pieces to safety!

BLACK pieces: {', '.join(f"{piece.symbol().upper()} on {chess.square_name(square)}"
               for square, piece in board.piece_map().items()
               if piece.color == chess.BLACK)}
WHITE pieces: {', '.join(f"{piece.symbol().upper()} on {chess.square_name(square)}"
               for square, piece in board.piece_map().items()
               if piece.color == chess.WHITE)}
LEGAL MOVES: {', '.join(move.uci() for move in board.legal_moves)}"""

    if feedback:
        position_info = f"{position_info}\n\nPREVIOUS ERROR: {feedback}"

    evaluator = AssistantAgent(
        name="chess_evaluator",
        system_message=f"""{position_info}

<instruction>
YOU ARE A CHESS GRANDMASTER PLAYING BLACK. White's last move was: {last_move}
1. FIRST CHECK: Are any of your pieces under attack? Save them!
2. Then check if you can capture any White pieces
3. Choose ONE move from LEGAL MOVES list
Output using EXACTLY this format:
<eval>e4f6</eval>
</instruction>""",
        model_client=client,
    )

    generator = AssistantAgent(
        name="chess_generator",
        system_message=f"""{position_info}

<instruction>
YOU ARE A CHESS GRANDMASTER PLAYING BLACK. White's last move was: {last_move}
1. FIRST CHECK: Are any of your pieces under attack? Suggest moves to save them!
2. Then suggest captures if available
3. Choose THREE moves from LEGAL MOVES list
Output using EXACTLY this format:
<moves>
move1: e4f6 | Saves knight from attack
move2: e4g5 | Moves knight to safety
move3: e4c5 | Retreats to safe square</moves>
</instruction>""",
        model_client=client,
    )

    selector = AssistantAgent(
        name="chess_selector",
        system_message=f"""{position_info}

<instruction>
YOU ARE A CHESS GRANDMASTER PLAYING BLACK. White's last move was: {last_move}
1. FIRST CHECK: Are any pieces under attack? Choose a move that saves them!
2. Then check for good captures
3. Choose ONE move that is in LEGAL MOVES list
4. You MUST output EXACTLY these two lines with no other text:
<move>g8f6</move>
APPROVE
</instruction>""",
        model_client=client,
    )

    inner_termination = TextMentionTermination("APPROVE")
    inner_team = RoundRobinGroupChat(
        [evaluator, generator, selector],
        termination_condition=inner_termination,
        max_turns=3
    )

    chess_team = SocietyOfMindAgent(
        name="chess_team",
        team=inner_team,
        model_client=client,
        description="Extract final move",
        instruction="Wait for <move> tag and APPROVE",
        response_prompt="Extract move from <move> tag"
    )

    return chess_team

async def get_team_move(board: chess.Board, team, console: Console) -> str:
    """Get a move from the chess team using SocietyOfMindAgent."""
    legal_moves = [move.uci() for move in board.legal_moves]

    position_info = f"""CURRENT POSITION (Black to move):
{board.unicode()}

BLACK pieces: {', '.join(f"{piece.symbol().upper()} on {chess.square_name(square)}"
               for square, piece in board.piece_map().items()
               if piece.color == chess.BLACK)}
WHITE pieces: {', '.join(f"{piece.symbol().upper()} on {chess.square_name(square)}"
               for square, piece in board.piece_map().items()
               if piece.color == chess.WHITE)}
WHITE's last move: {board.peek().uci() if board.move_stack else 'None'}
LEGAL MOVES: {', '.join(legal_moves)}"""

    console.print("\n[bold yellow]DEBUG: Starting position info:[/bold yellow]")
    console.print(Panel(position_info))

    feedback = ""
    tried_moves = set()

    for attempt in range(3):
        try:
            chess_team = create_chess_agents(board, feedback)

            with console.status(f"[bold green]AI is analyzing the position (attempt {attempt + 1}/3)...[/bold green]"):
                stream = chess_team.run_stream(task=position_info)
                async for message in stream:
                    if "TaskResult" in str(message):
                        console.print("[dim]Skipping TaskResult message[/dim]")
                        continue

                    if hasattr(message, 'content') and hasattr(message, 'source'):
                        content = message.content
                        source = message.source

                        if source == "user":
                            console.print("[dim]Skipping user message[/dim]")
                            continue

                        console.print(Panel(
                            content,
                            title=f"[bold]Agent: {source}[/bold]",
                            border_style="cyan"
                        ))

                        try:
                            if "<move>" in content and "APPROVE" in content:
                                try:
                                    move = extract_move(content)
                                    move = move.replace('-', '')

                                    if move in tried_moves:
                                        feedback = f"Already tried move {move}. Please choose a different move from: {', '.join(legal_moves)}"
                                        raise ValueError(f"Already tried: {move}")

                                    tried_moves.add(move)

                                    if move in legal_moves:
                                        console.print(Panel(
                                            f"[bold green]Black plays: {move}[/bold green]",
                                            title="[bold green]♟️ Move Selected[/bold green]",
                                            border_style="green"
                                        ))
                                        return move
                                    else:
                                        feedback = f"Move {move} is not legal. Legal moves are: {', '.join(legal_moves)}"
                                        raise ValueError(f"Illegal move: {move}")
                                except ValueError as e:
                                    console.print(f"[bold red]Move extraction failed: {str(e)}[/bold red]")
                                    raise

                        except Exception as e:
                            console.print(f"[bold red]Error processing message: {str(e)}[/bold red]")
                            raise

            if attempt < 2:
                console.print(f"\n[yellow]Attempt {attempt + 1} failed. Creating new team and retrying...[/yellow]")

        except Exception as e:
            if attempt == 2:
                raise ValueError(f"Failed to get legal move after 3 attempts: {str(e)}")
            console.print(f"\n[red]Error in attempt {attempt + 1}: {str(e)}[/red]")
            console.print(f"[yellow]Retrying with feedback: {feedback}[/yellow]")
            continue

    raise ValueError("Failed to get legal move - no valid move found in responses")

async def main() -> None:
    console = Console()

    try:
        board = chess.Board()
        assert board.fen().split()[0] == "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"

        console.print(Panel.fit("♟️ Welcome to Chess vs AI!\n\nYou play as White, AI plays as Black\nUse UCI format for moves (e.g., 'e2e4')\n(Type 'exit' to leave)",
                            border_style="blue",
                            title="Chess Game"))

        while not board.is_game_over():
            console.print(Panel(
                format_board(board),
                title=f"[bold]Move {board.fullmove_number}[/bold]",
                border_style="blue"
            ))

            if board.turn == chess.WHITE:
                while True:
                    move_str = Prompt.ask("\n[bold blue]Your move[/bold blue]")
                    if move_str.lower() == 'exit':
                        console.print("\n[yellow]Game ended by player. Thanks for playing![/yellow]")
                        return

                    try:
                        move = chess.Move.from_uci(move_str)
                        if move in board.legal_moves:
                            board.push(move)
                            # Show board after White's move
                            console.print("\n[bold white]Position after your move:[/bold white]")
                            console.print(Panel(
                                format_board(board),
                                title=f"[bold]After {move_str}[/bold]",
                                border_style="white"
                            ))
                            break
                        console.print("[red]Illegal move! Try again.[/red]")
                        console.print(f"[yellow]Legal moves are: {', '.join(move.uci() for move in board.legal_moves)}[/yellow]")
                    except ValueError:
                        console.print("[red]Invalid format! Use UCI notation (e.g., 'e2e4')[/red]")

            else:
                console.print("\n[bold green]AI is thinking...[/bold green]")
                try:
                    chess_team = create_chess_agents(board)
                    move = await get_team_move(board, chess_team, console)
                    board.push(chess.Move.from_uci(move))
                except ValueError as e:
                    console.print(f"[red]Error: {str(e)}[/red]")
                    return

        console.print(Panel(format_board(board), title="Final Position"))
        console.print(f"\n[bold]Game Over! Result: {board.result()}[/bold]")
        if board.is_checkmate():
            console.print("[bold]Checkmate![/bold]")
        elif board.is_stalemate():
            console.print("[bold]Stalemate![/bold]")
        elif board.is_insufficient_material():
            console.print("[bold]Draw by insufficient material![/bold]")
        elif board.is_fifty_moves():
            console.print("[bold]Draw by fifty-move rule![/bold]")
        elif board.is_repetition():
            console.print("[bold]Draw by repetition![/bold]")
    except KeyboardInterrupt:
        console.print("\n[yellow]Game interrupted. Thanks for playing![/yellow]")
    except Exception as e:
        console.print(f"\n[red]An error occurred: {str(e)}[/red]")

def format_board(board: chess.Board) -> str:
    pieces = {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
        'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙',
        '.': ' '
    }

    rows = []
    board_state = str(board).split('\n')

    for rank in range(8, 0, -1):
        squares = [f"[dim] {rank} [/dim]"]
        row = board_state[8-rank]

        for file in range(8):
            is_light_square = (rank + file) % 2 == 0
            bg_color = "rgb(240,217,181)" if is_light_square else "rgb(181,136,99)"
            piece = row.split()[file]
            piece_symbol = pieces.get(piece, pieces['.'])

            if piece.isupper():
                text_style = f"white on {bg_color}"
            elif piece.islower():
                text_style = f"black on {bg_color}"
            else:
                text_style = f"on {bg_color}"

            squares.append(f"[{text_style}]  {piece_symbol}  [/]")

        rows.append("".join(squares))

    files = "  " + "".join(f"[dim]  {chr(97+i)}  [/dim]" for i in range(8))
    rows.append(files)

    return "\n".join(rows)

def extract_move(content: str) -> str:
    """Extract move from content with better error handling."""
    try:
        if '<move>' in content and '</move>' in content:
            move_start = content.index('<move>') + 6
            move_end = content.index('</move>')
            move = content[move_start:move_end].strip()
            return move.replace('-', '')

        words = content.split()
        for word in words:
            if len(word) == 4 and word[0].isalpha() and word[1].isdigit() and \
               word[2].isalpha() and word[3].isdigit():
                return word

        raise ValueError("No valid move format found")
    except Exception as e:
        raise ValueError(f"Move extraction failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
