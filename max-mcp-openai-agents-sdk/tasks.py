from honcho.manager import Manager
from invoke import task, Context


@task
def max(c: Context):
    c.run("""max serve \
        --model-path=HuggingFaceTB/SmolLM2-1.7B-Instruct \
		--weight-path=HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF/smollm2-1.7b-instruct-q4_k_m.gguf""")


@task
def ui(_c: Context):
    while True:
        pass


@task
def serve(_c: Context):
    m = Manager()
    m.add_process("max", "invoke max", quiet=False)
    m.add_process("ui", "invoke ui", quiet=False)
    m.loop()
