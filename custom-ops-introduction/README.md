# Custom Operations: An Introduction to Programming GPUs and CPUs with Mojo

In this recipe, we will cover:

* How to extend a MAX Graph using custom operations.
* Using Mojo to write high-performance calculations that run on GPUs and CPUs.
* The basics of GPU programming in MAX.

We'll walk through running three examples that show

* adding one to every number in an input tensor
* performing hardware-specific addition of two vectors
* and calculating the Mandelbrot set on CPU and GPU.

Let's get started.

## Requirements

Please make sure your system meets our
[system requirements](https://docs.modular.com/max/get-started).

To proceed, ensure you have the `magic` CLI installed with the `magic --version` to be **0.7.2** or newer:

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

1. Download this recipe using the `magic` CLI:

    ```bash
    magic init custom-ops-introduction --from custom-ops-introduction
    cd custom-ops-introduction
    ```

2. Run each of the examples:

    ```bash
    magic run add_one
    magic run vector_addition
    magic run mandelbrot
    ```

3. Browse through the commented source code to see how they work.

## Getting started with MAX Graph custom operations on GPU / CPU

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

Anyone can write their own custom operations in Mojo and place them in a graph
to run accelerated compute on CPUs or GPUs. The examples in this recipe show
very basic custom operations and how to run them on CPUs or GPUs within a
graph. More advanced use cases are available
[in other recipes](https://builds.modular.com/?category=recipes).

For a guided tour on how to create a custom operation, see
[our introductory step-by-step tutorial](https://docs.modular.com/max/tutorials/build-custom-ops).

The following examples of custom operations are shown here:

* **add_one**: Adding 1 to every element of an input tensor.
* **vector_addition**: Performing vector addition using a manual GPU function.
* **mandelbrot**: Calculating the Mandelbrot set.

For each example, a simple graph containing a single operation is constructed
in Python. This graph is compiled and dispatched onto a supported GPU if one is
available, or the CPU if not. Input tensors, if there are any, are moved from
the host to the device on which the graph is running. The graph then runs and
the results are copied back to the host for display.

The `operations/` directory contains the custom kernel implementations, and the
graph construction occurs in the Python files in the base directory. These
examples are designed to stand on their own, so that they can be used as
templates for experimentation.

The execution has two phases: first an `operations.mojopkg` is compiled from the
custom Mojo kernel, and then the graph is constructed and run in Python. The
inference session is pointed to the `operations.mojopkg` in order to load the
custom operations.

Let's examine each example in detail:

### Adding one to each element in a tensor

In this example, we present a pretty simple "hello world" use case where we
add the number 1 to each element in parallel of a tensor. The operation itself
is defined in Mojo within `operations/add_one.mojo`:

```mojo
@compiler.register("add_one")
struct AddOne:
    @staticmethod
    fn execute[
        target: StringLiteral,
    ](
        out: OutputTensor,
        x: InputTensor[type = out.type, rank = out.rank],
        ctx: DeviceContextPtr,
    ):
        @parameter
        @always_inline
        fn elementwise_add_one[
            width: Int
        ](idx: IndexList[x.rank]) -> SIMD[x.type, width]:
            return x.load[width](idx) + 1

        foreach[elementwise_add_one, target=target](out, ctx)
```

Much of the code that you see is used to describe the computational node to
the graph compiler: what are the inputs, outputs, and parameters. The actual
calculation is in the latter half of the above. A closure named
`elementwise_add_one()` is defined that loads a SIMD vector of values from the
input tensor, adds one to each position in the vector, and then returns the
result.

This closure is then run against every position in the output tensor using an
algorithmic abstraction defined in MAX called `foreach()`. At compile time,
this elementwise calculation is specialized for the hardware it is being run
on, with separate execution paths for CPUs and GPUs, as well as
device-specific optimizations. This means that this same code will run with
optimal performance on CPU or GPU with no changes required.

The graph that runs this operation is defined and run in the `add_one.py`
Python file. In this case, a single-operation graph that takes in one input
tensor and provides one output tensor is created:

```python
graph = Graph(
    "addition",
    # The custom Mojo operation is referenced by its string name, and we
    # need to provide inputs as a list as well as expected output types.
    forward=lambda x: ops.custom(
        name="add_one",
        values=[x],
        out_types=[TensorType(dtype=x.dtype, shape=x.tensor.shape)],
    )[0].tensor,
    input_types=[
        TensorType(dtype, shape=[rows, columns]),
    ],
)
```

To see the entire example in action, it can be built and run using one command:

```sh
magic run add_one
```

This will build the Mojo custom operation, create the graph, and run it on a
randomly-initialized tensor. The same calculation is performed in parallel
using NumPy, and the results from both NumPy and the MAX Graph with this
operation will be printed to the console and should match.

### Hardware-specific manual vector addition

The first example seen above used a high-level, device-independent abstraction
for performing calculations on each element of a tensor that provides great
out-of-the-box performance for a range of CPUs and GPUs. However, it's possible
to write your own hardware-specific data-parallel algorithms if you desire to
work at a lower level. This next example illustrates how to perform parallel
addition of elements in two vectors on GPUs using a programming model that may
be more familiar to those used to general purpose GPU programming in CUDA and
similar frameworks.

The vector addition operation is defined in `operations/vector_addition.mojo`.
Within the body of the operation is the following code:

```mojo
@parameter
if target == "cpu":
    vector_addition_cpu(out, lhs, rhs, ctx)
elif target == "gpu":
    vector_addition_gpu(out, lhs, rhs, ctx)
else:
    raise Error("No known target:", target)
```

At compile time of the operation within the graph, a `target` will be provided.
Using the `@parameter if` language construct in Mojo, the
`vector_addition_gpu()` path in the operation will only be compiled if the
operation will be running on a GPU. Compile-time specialization like this is a
unique and powerful feature of Mojo that makes it easy to optimize code for
specific hardware.

The body of the `vector_addition_gpu()` function that performs the addition looks
like the following:

```mojo
alias BLOCK_SIZE = 16
var gpu_ctx = ctx.get_device_context()
var vector_length = out.dim_size(0)

@parameter
fn vector_addition_gpu_kernel(length: Int):
    var tid = block_dim.x * block_idx.x + thread_idx.x
    if tid < length:
        out[tid] = lhs[tid] + rhs[tid]

var num_blocks = ceildiv(vector_length, BLOCK_SIZE)
gpu_ctx.enqueue_function[vector_addition_gpu_kernel](
    vector_length, grid_dim=num_blocks, block_dim=BLOCK_SIZE
)
```

This may look familar if you're familiar with CUDA C kernels and how they are
dispatched onto a GPU. A `vector_addition_gpu_kernel()` closure is defined that
will run once per thread on the GPU, adding an element from the `lhs` vector
to the matching element in the `rhs` vector and then saving the result at the
correct position in the `out` vector. This function is then run across a grid
of `BLOCK_SIZE` blocks of threads.

The block size is arbitrary here, and is not tuned for the specific GPU
hardware this will be run on. The previously-mentioned `foreach()` abstraction
will do hardware-specific tuning for this style of dispatch, and is what we
recommend for simple elementwise calculations like this. However, this example
shows how you might mentally map CUDA C code to thread-level operations in MAX.

This example can be built and run using one command:

```sh
magic run vector_addition
```

Once the graph has been compiled and run, the two randomly-initialized input
vectors will be printed, along with their results from the graph calculation
and addition via NumPy.

### Calculating the Mandelbrot set

The final example in this recipe shows a slightly more complex calculation
(pun intended):
[the Mandelbrot set fractal](https://en.wikipedia.org/wiki/Mandelbrot_set).
This custom operation takes no input tensors, only a set of scalar arguments,
and returns a 2-D matrix of integer values representing the number of
iterations it took to escape at that location in complex number space.

The calculation itself is present in `operations/mandelbrot.mojo`. It is
performed in parallel at each location in the 2-D output matrix using
`foreach()` and the following function:

```mojo
fn elementwise_mandelbrot[
    width: Int
](idx: IndexList[out.rank]) -> SIMD[out.type, width]:
    var row = idx[0]
    var col = idx[1]
    var cx = min_x.cast[float_dtype]() + (
        col + iota[float_dtype, width]()
    ) * scale_x.cast[float_dtype]()
    var cy = min_y.cast[float_dtype]() + row * SIMD[float_dtype, width](
        scale_y.cast[float_dtype]()
    )
    var c = ComplexSIMD[float_dtype, width](cx, cy)
    var z = ComplexSIMD[float_dtype, width](0, 0)
    var iters = SIMD[out.type, width](0)

    var in_set_mask: SIMD[DType.bool, width] = True
    for _ in range(max_iterations):
        if not any(in_set_mask):
            break
        in_set_mask = z.squared_norm() <= 4
        iters = in_set_mask.select(iters + 1, iters)
        z = z.squared_add(c)

    return iters
```

This begins by calculating the complex number which represents a given location
in the output grid (C). Then, starting from `Z=0`, the calculation `Z=Z^2 + C`
is iteratively calculated until Z exceeds 4, the threshold we're using for when
Z will escape the set. This occurs up until a maximum number of iterations,
and the number of iterations to escape (or not, if the maximum is hit) is then
returned for each location in the grid.

The area to examine in complex space, the resolution of the grid, and the
maximum number of iterations, are all provided as scalars at run time to this
custom operation. This would potentially allow someone to create an animation
zooming in on a section of the Mandelbrot set, for example.

The single-operation graph that contains the Mandelbrot set calculation is
constructed using the following:

```python
def create_mandelbrot_graph(
    width: int,
    height: int,
    min_x: float,
    min_y: float,
    scale_x: float,
    scale_y: float,
    max_iterations: int,
) -> Graph:
    output_dtype = DType.int32
    with Graph(
        "mandelbrot",
    ) as graph:
        result = ops.custom(
            name="mandelbrot",
            values=[
                ops.constant(min_x, dtype=DType.float32),
                ops.constant(min_y, dtype=DType.float32),
                ops.constant(scale_x, dtype=DType.float32),
                ops.constant(scale_y, dtype=DType.float32),
                ops.constant(max_iterations, dtype=DType.int32),
            ],
            out_types=[TensorType(dtype=output_dtype, shape=[height, width])],
        )[0].tensor

        graph.output(result)
        return graph
```

The above shows how scalar values can be provided into a graph as
`ops.constant` inputs. No input is provided, and the output is sized based on
the width and height provided.

This example can be built and run using one command:

```sh
magic run mandelbrot
```

Once the graph is compiled and run, a visual representation of the Mandelbrot
set will be printed to the console:

```
...................................,,,,c@8cc,,,.............
...............................,,,,,,cc8M @Mjc,,,,..........
............................,,,,,,,ccccM@aQaM8c,,,,,........
..........................,,,,,,,ccc88g.o. Owg8ccc,,,,......
.......................,,,,,,,,c8888M@j,    ,wMM8cccc,,.....
.....................,,,,,,cccMQOPjjPrgg,   OrwrwMMMjjc,....
..................,,,,cccccc88MaP  @            ,pGa.g8c,...
...............,,cccccccc888MjQp.                   o@8cc,..
..........,,,,c8jjMMMMMMMMM@@w.                      aj8c,,.
.....,,,,,,ccc88@QEJwr.wPjjjwG                        w8c,,.
..,,,,,,,cccccMMjwQ       EpQ                         .8c,,,
.,,,,,,cc888MrajwJ                                   MMcc,,,
.cc88jMMM@@jaG.                                     oM8cc,,,
.cc88jMMM@@jaG.                                     oM8cc,,,
.,,,,,,cc888MrajwJ                                   MMcc,,,
..,,,,,,,cccccMMjwQ       EpQ                         .8c,,,
.....,,,,,,ccc88@QEJwr.wPjjjwG                        w8c,,.
..........,,,,c8jjMMMMMMMMM@@w.                      aj8c,,.
...............,,cccccccc888MjQp.                   o@8cc,..
..................,,,,cccccc88MaP  @            ,pGa.g8c,...
.....................,,,,,,cccMQOEjjPrgg,   OrwrwMMMjjc,....
.......................,,,,,,,,c8888M@j,    ,wMM8cccc,,.....
..........................,,,,,,,ccc88g.o. Owg8ccc,,,,......
............................,,,,,,,ccccM@aQaM8c,,,,,........
...............................,,,,,,cc8M @Mjc,,,,..........
```

Try experimenting with the parameters in `mandelbrot.py` to visualize
different parts of the Mandelbrot set, at different resolutions:

```python
WIDTH = 60
HEIGHT = 25
MAX_ITERATIONS = 100
MIN_X = -2.0
MAX_X = 0.7
MIN_Y = -1.12
MAX_Y = 1.12
```

## Conclusion

In this recipe, we've introduced the basics of how to write custom MAX Graph
operations using Mojo, place them in a one-operation graph in Python, and run
them on an available CPU or GPU. Three operations with differing inputs and
outputs, as well as different styles of calculation, have been demonstrated
to begin to show the versatility of the MAX programming interfaces for custom
graph operations.

## Next Steps

* Follow [our tutorial for building a custom operation from scratch](https://docs.modular.com/max/tutorials/build-custom-ops).

* Explore MAX's [documentation](https://docs.modular.com/max/) for additional
  features. The [`gpu`](https://docs.modular.com/mojo/stdlib/gpu/) module has
  detail on Mojo's GPU programming functions and types, and the documentation
  on [`@compiler.register`](https://docs.modular.com/max/api/mojo-decorators/compiler-register/)
  shows how to register custom graph operations.

* Join our [Modular Forum](https://forum.modular.com/) and [Discord community](https://discord.gg/modular) to share your experiences and get support.

We're excited to see what you'll build with MAX! Share your projects and experiences with us using `#ModularAI` on social media.
