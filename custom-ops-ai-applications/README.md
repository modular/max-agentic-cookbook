# Custom Operations: Applications in AI models

In this recipe, we will cover:

* Building a top-K token sampler for GPU and CPU.
* Implementing FlashAttention-2 as a fused custom operation.
* Accessing GPU hardware features, like Tensor Cores, from MAX.

We'll walk through two examples that

* illustrate real-world applications of custom MAX Graph operations in AI
  models,
* applies seven optimizations that sequentially improve GPU performance,
* and demonstrates the performance benefits with benchmarks of each step.

Let's get started.

## Requirements

Please make sure your system meets our
[system requirements](https://docs.modular.com/max/get-started).

To proceed, ensure you have the `magic` CLI installed:

```bash
curl -ssL https://magic.modular.com/ | bash
```

or update it via:

```bash
magic self-update
```

### GPU requirements

These examples can all be run on either a CPU or GPU. To run them on a GPU,
ensure your system meets
[these GPU requirements](https://docs.modular.com/max/faq/#gpu-requirements):

* Officially supported GPUs: NVIDIA Ampere A-series (A100/A10), or Ada
  L4-series (L4/L40) data center GPUs. Unofficially, RTX 30XX and 40XX series
  GPUs have been reported to work well with MAX.
* NVIDIA GPU driver version 555 or higher. [Installation guide here](https://www.nvidia.com/download/index.aspx).

## Quick start

1. Download this recipe using Magic:

```bash
magic init custom-ops-ai-applications --from custom-ops-ai-applications
cd custom-ops-ai-applications
```

2. Run the examples:

```bash
magic run top_k
magic run fused_attention
```

3. Run the benchmarks of the top-K token sampler to sse how much faster it
runs on GPU:

```bash
magic run benchmarks
```

## Optimizing top-K token sampling for GPUs in MAX

AI models in [MAX](https://docs.modular.com/max/intro) are built as
computational graphs using the
[MAX Graph API](https://docs.modular.com/max/tutorials/get-started-with-max-graph-in-python).
MAX contains within it a powerful graph compiler that can take these graphs
and optimize them for best performance on a wide range of hardware.

Each node in a MAX Graph is defined by an operation that performs a calculation
on zero or more inputs and produces one or more outputs. These inputs and
outputs tend to be in the form of tensors, and the operations are usually
data-parallel calculations that are accelerated on CPUs or GPUs. In MAX,
these operations are written using [Mojo](https://docs.modular.com/mojo/manual/),
a Python-family language built for high-performance computation.

Large language models rely on token samplers to improve the quality of the text
generated from the model, as well as add interesting variability to the output.
One sampling technique is top-K token sampling, and this example provides both
CPU and GPU implementations of this algorithm. The GPU implementation
demonstrates how to accelerate the sampling via hardware features.

The following can be used to run the top-K token sampling demo:

```bash
magic run top_k
```

The file `top_k.py` defines a block of text, then chooses three words and
builds a Numpy array with three batches for how often each "next word" appears
as percentages. The Numpy array is passed to the custom op, which returns two
arrays to order each batch/word by highest frequency. It uses a `top_k` kernel
that runs on CPU, or MAX-compatible GPU if you have one attached. The GPU kernel
uses a warp-level algorithm to demonstrate using low-level GPU primitives, each
word/batch runs in parallel on a separate GPU block.

You can look at the `kernels/top_k.mojo` file to see the differences between the
CPU and GPU implementations. Run `magic run benchmarks` to see the performance
difference.

This demonstrates how you can build your own custom op for any specific
functionality you want to add to MAX's performant op implementations, using low
level GPU and CPU primitives. Note that it is a simplified version, MAX has it's
own `mo.top_k` op which is more feature complete.

## Implementing a fused operation for FlashAttention-2

Modern Transformer-based language models are constructed around the attention
mechanism. Optimizing how attention is performed is a key driver in improving
large language model performance.

[FlashAttention-2](https://arxiv.org/abs/2307.08691) is a memory-efficient
attention algorithm that significantly improves the performance of
transformer-based models by reducing memory bandwidth requirements and
optimizing computation patterns.  FlashAttention is particularly beneficial
for:

- Large language models with long context windows
- Vision transformers processing high-resolution images
- Multi-modal models with large attention matrices
- Fine-tuning large models on limited GPU memory

In this example, you'll see how to implement FlashAttention-2 as a fused
operation that runs on the GPU in MAX using Mojo.

To run the example, use the following command:

```bash
magic run fused_attention
```

### Limitations of classic attention

The classic attention operation consists of

- `bmm`: `Q x Transpose(K)`
    where `Q`, `K` both have shape `[batchSize, numHeads, S, d]`
    and `Q x K^t` has the shape `[batchSize, numHeads, S, S]`
- `softmax`
- `bmm`: `softmax(Q x K^t) x V`
    where V has the shape `[batchSize, numHeads, S, d]`

`bmm` is short for batched matrix multiplication.

`S` denotes the sequence length. Depending on the model, it can be as large as
`O(10^3) - O(10^4)`. `d` is the size per head in multi-head attention. It’s
usually a power of 2 like 64, 128, etc, and smaller than `S`.

A limitation of the classic implementation is that it materializes an
intermediate matrix of shape `[batchSize, numHeads, S, S]`. This introduces
`O(S^2)` memory allocation and traffic.

### Optimizing attention via FlashAttention

FlashAttention optimizes the standard attention mechanism by:

1. **Tiling the computation**: Breaking the `Q`, `K`, and `V` matrices into
  smaller blocks that fit in GPU shared memory, which is much faster than
  global memory.
2. **Fusing operations**: Combining softmax normalization with matrix
  multiplication for each tile into a single kernel.

These help maximize the locality and reduce DRAM (global memory) traffic.

This is the core of the fused FlashAttention kernel used in this example:

```mojo
alias N = Q.shape[0]()
alias D = Q.shape[1]()

Q_tile = Q.tile[BN, D](block_idx.y, 0)

m_1 = (
    LayoutTensor[q_dtype, Layout(BN, 1), MutableAnyOrigin]
    .stack_allocation()
    .fill(Scalar[q_dtype].MIN)
)
l_1 = (
    LayoutTensor[q_dtype, Layout(BN, 1), MutableAnyOrigin]
    .stack_allocation()
    .fill(0)
)
O_i = (
    LayoutTensor[q_dtype, Layout.row_major(BN, BD), MutableAnyOrigin]
    .stack_allocation()
    .fill(0)
)

alias BN_1 = 8

@parameter
for tile_n_idx in range(N // BN_1):
    K_tile = K.tile[BN_1, D](tile_n_idx, 0)
    V_tile = V.tile[BN_1, BD](tile_n_idx, block_idx.x)
    S = matmul["gpu", transpose_b=True](Q_tile, K_tile)
    m_2 = max(m_1, rebind[__type_of(m_1)](max[axis=1](S)))
    l_2 = exp(m_1 - m_2) * l_1 + sum[axis=1](exp(S - m_2))
    P = exp(S - m_2) / l_2
    O_i = O_i * (l_1 / l_2) * exp(m_1 - m_2) + matmul["gpu"](P, V_tile)
    m_1 = m_2
    l_1 = rebind[__type_of(l_1)](l_2)
O.tile[BN, BD](block_idx.y, block_idx.x).copy_from(O_i)
```

Note how the Mojo abstractions present in MAX allow for this algorithm to be
expressed very closely to the description in the original research paper.

## Conclusion

In this recipe, we've demonstrated how to create custom MAX Graph operations
that perform functions important in modern AI models: top-K token sampling and
the FlashAttention-2 attention layer. Each provides examples of how complex
calculations can be constructed using MAX and Mojo and targeted towards
hardware features in GPUs.

## Next Steps

* Follow [our tutorial for building a custom operation from scratch](https://docs.modular.com/max/tutorials/build-custom-ops).

* Explore MAX's [documentation](https://docs.modular.com/max/) for additional
  features. The [`gpu`](https://docs.modular.com/mojo/stdlib/gpu/) module has
  detail on Mojo's GPU programming functions and types, and the documentation
  on [`@compiler.register`](https://docs.modular.com/max/api/mojo-decorators/compiler-register/)
  shows how to register custom graph operations.

* Join our [Modular Forum](https://forum.modular.com/) and [Discord community](https://discord.gg/modular) to share your experiences and get support.

We're excited to see what you'll build with MAX! Share your projects and experiences with us using `#ModularAI` on social media.
