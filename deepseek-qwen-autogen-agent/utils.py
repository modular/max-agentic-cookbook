
def patch_openai_client_usage_tracking():
    import autogen_ext.models.openai._openai_client as openai_client

    original_add_usage = openai_client._add_usage

    def patched_add_usage(usage1, usage2):
        if usage1 is None:
            return usage2
        if usage2 is None:
            return usage1

        prompt_tokens1 = getattr(usage1, 'prompt_tokens', 0) or 0
        completion_tokens1 = getattr(usage1, 'completion_tokens', 0) or 0
        total_tokens1 = getattr(usage1, 'total_tokens', 0) or 0

        prompt_tokens2 = getattr(usage2, 'prompt_tokens', 0) or 0
        completion_tokens2 = getattr(usage2, 'completion_tokens', 0) or 0
        total_tokens2 = getattr(usage2, 'total_tokens', 0) or 0

        from dataclasses import dataclass

        @dataclass
        class Usage:
            prompt_tokens: int
            completion_tokens: int
            total_tokens: int

        return Usage(
            prompt_tokens=prompt_tokens1 + prompt_tokens2,
            completion_tokens=completion_tokens1 + completion_tokens2,
            total_tokens=total_tokens1 + total_tokens2
        )

    openai_client._add_usage = patched_add_usage

    return original_add_usage
