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

1. Download the code for this recipe using git:

```bash
git clone https://github.com/modular/max-recipes.git
cd max-recipes/custom-ai-applications
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
large language model performance. One such optimization is the
[FlashAttention-2](https://arxiv.org/abs/2307.08691) layer. In this example,
you'll see how to implement FlashAttention-2 as a fused operation that runs on
the GPU in MAX using Mojo.

To run the example, use the following command:

```bash
magic run fused_attention
```

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
