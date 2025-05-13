import subprocess


def main():
    cmd = [
        'max', 'serve',
          '--model-path', 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
          '--weight-path', 'HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF/smollm2-1.7b-instruct-q4_k_m.gguf'
    ]

    subprocess.run(cmd)


if __name__ == "__main__":
    main()