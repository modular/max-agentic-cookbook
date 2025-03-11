# GPU Functions in Mojo: A CUDA-style Programming Interface

In this recipe, we will cover:

- Writing thread-parallel GPU functions in Mojo
- Compiling and dispatching these functions to a GPU using the MAX Driver API
- Translating common CUDA C programming patterns to MAX and Mojo

We'll walk through four GPU programming examples:

- Performing basic vector addition
- Converting a color image to grayscale
- Performing naive matrix multiplication
- Calculating the Mandelbrot set fractal

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

These examples require a MAX-compatible GPU satisfying
[these requirements](https://docs.modular.com/max/faq/#gpu-requirements):

- Officially supported GPUs: NVIDIA Ampere A-series (A100/A10), or Ada
  L4-series (L4/L40) data center GPUs. Unofficially, RTX 30XX and 40XX series
  GPUs have been reported to work well with MAX.
- NVIDIA GPU driver version 555 or higher. [Installation guide here](https://www.nvidia.com/download/index.aspx).

## Quick start

1. Download the code for this recipe using `git`:

    ```bash
    git clone https://github.com/modular/max-recipes.git
    cd max-recipes/gpu-functions-mojo
    ```

1. Run the examples:

    ```bash
    magic run vector_addition
    magic run grayscale
    magic run naive_matrix_multiplication
    magic run mandelbrot
    ```

## Compiling and running GPU functions using the Mojo Driver API

MAX is a flexible, hardware-independent framework for programming GPUs and
CPUs. It lets you get the most out of accelators without requiring
architecture-specific frameworks like CUDA. MAX has many levels, from highly
optimized AI models, to the computational graphs that define those models, to
direct GPU programming in the Mojo language. You can use whatever level of
abstraction best suits your needs in MAX.

[Mojo](https://docs.modular.com/mojo/manual/) is a Python-family language
built for high-performance computing. It allows you to write custom
algorithms for GPUs without the use of CUDA or other vendor-specific libraries.
All of the operations that power AI models within MAX are written in Mojo.

We'll demonstrate an entry point into GPU programming with MAX allowing you to
define, compile, and dispatch onto a GPU individual thread-based functions. This
is powered by the [MAX Driver](https://docs.modular.com/max/api/mojo/driver/)
API, which handles all the hardware-specific details of allocating and
transferring memory between host and accelerator, as well as compilation and
execution of accelerator-targeted functions.

The first three examples in this recipe show common starting points for
thread-based GPU programming. They follow the first three examples in the
popular GPU programming textbook
[*Programming Massively Parallel Processors*](https://www.sciencedirect.com/book/9780323912310/programming-massively-parallel-processors):

- Parallel addition of two vectors
- Conversion of a red-green-blue image to grayscale
- Naive matrix multiplication, with no hardware-specific optimization

The final example demonstrates calculating the Mandelbrot set on the GPU.

### Basic vector addition

The common "hello world" example used for data-parallel programming is the
addition of each element in two vectors. Let's take a look at how you can
implement that in MAX.

1. Define the vector addition function.

    The function itself is very simple, running once per thread, adding each
    element in the two input vectors that correspond to that thread ID, and
    storing the result in the output vector at the matching location. If a block
    of threads is dispatched that is wider than the vector length, no work is
    performed by threads past the end of the vector.

    ```mojo
    fn vector_addition(
        length: Int,
        lhs: LayoutTensor[float_dtype],
        rhs: LayoutTensor[float_dtype],
        out: LayoutTensor[float_dtype],
    ):
        tid = block_dim.x * block_idx.x + thread_idx.x
        if tid < length:
            var result = lhs[tid] + rhs[tid]
            out[tid] = result
    ```

1. Obtain a reference to the host (CPU) and accelerator (GPU) devices.

    ```mojo
    gpu_device = accelerator()
    host_device = cpu()
    ```

    If no MAX-compatible accelerator is found, this exits with an error.

1. Allocate input and output vectors.

    The left-hand-side and right-hand-side vectors need to be allocated on the
    CPU, initialized with values, and then moved to the GPU for use by our
    function. This is done using the MAX Driver API's
    [`Tensor`](https://docs.modular.com/max/api/mojo/driver/tensor/Tensor) type.

    ```mojo
    alias float_dtype = DType.float32
    alias tensor_rank = 1
    alias VECTOR_WIDTH = 10

    lhs_tensor = Tensor[float_dtype, 1]((VECTOR_WIDTH), host_device)
    rhs_tensor = Tensor[float_dtype, 1]((VECTOR_WIDTH), host_device)

    for i in range(VECTOR_WIDTH):
        lhs_tensor[i] = 1.25
        rhs_tensor[i] = 2.5

    lhs_tensor = lhs_tensor.move_to(gpu_device)
    rhs_tensor = rhs_tensor.move_to(gpu_device)
    ```

    A tensor to hold the result of the calculation is allocated on the GPU:

    ```mojo
    out_tensor = Tensor[float_dtype, tensor_rank](
        (VECTOR_WIDTH), gpu_device
    )
    ```

1. Compile and dispatch the function.

    The actual `vector_addition()` function we want to run on the GPU is
    compiled and dispatched across a grid, divided into blocks of threads. All
    arguments to this GPU function are provided here, in an order that
    corresponds to their location in the function signature. Note that in MAX,
    the GPU function is compiled for the GPU at the time of compilation of the
    Mojo file containing it.

    ```mojo
    gpu_function = Accelerator.compile[vector_addition](gpu_device)

    alias BLOCK_SIZE = 16
    var num_blocks = ceildiv(VECTOR_WIDTH, BLOCK_SIZE)

    gpu_function(
        gpu_device,
        VECTOR_WIDTH,
        lhs_tensor.to_layout_tensor(),
        rhs_tensor.to_layout_tensor(),
        out_tensor.to_layout_tensor(),
        grid_dim=Dim(num_blocks),
        block_dim=Dim(BLOCK_SIZE),
    )
    ```

1. Return the results.

    Finally, the results of the calculation are moved from the GPU back to the
    host to be examined:

    ```mojo
    out_tensor = out_tensor.move_to(host_device)

    print("Resulting vector:", out_tensor)
    ```

To try out this example yourself, run it using the following command:

```sh
magic run vector_addition
```

For this initial example, the output you see should be a vector where all the
elements are `3.75`. Experiment with changing the vector length, the block size,
and other parameters to see how the calculation scales.

### Conversion of a color image to grayscale

As a slightly more complex example, the next step in this recipe shows how to
convert a red-green-blue (RGB) color image into grayscale. This uses a rank-3
tensor to host the 2-D image and the color channels at each pixel. The inputs
start with three color channels, and the output has only a single grayscale
channel.

The calculation performed is a common reduction to luminance using weighted
values for the three channels:

```mojo
gray = 0.21 * red + 0.71 * green + 0.07 * blue
```

And here is the per-thread function to perform this on the GPU:

```mojo
fn color_to_grayscale_conversion(
    width: Int,
    height: Int,
    image: LayoutTensor[channel_dtype],
    out: LayoutTensor[channel_dtype],
):
    row = block_dim.y * block_idx.y + thread_idx.y
    col = block_dim.x * block_idx.x + thread_idx.x

    if col < width and row < height:
        red = image[row, col, 0].cast[internal_float_dtype]()
        green = image[row, col, 1].cast[internal_float_dtype]()
        blue = image[row, col, 2].cast[internal_float_dtype]()
        gray = 0.21 * red + 0.71 * green + 0.07 * blue

        out[row, col, 0] = gray.cast[channel_dtype]()
```

The setup, compilation, and execution of this function is much the same as in
the previous example, but in this case we're using rank-3 instead of rank-1
`Tensor`s to hold the values. Also, we dispatch the function over a 2-D grid
of block, which looks like the following:

```mojo
alias BLOCK_SIZE = 16
num_col_blocks = ceildiv(IMAGE_WIDTH, BLOCK_SIZE)
num_row_blocks = ceildiv(IMAGE_HEIGHT, BLOCK_SIZE)

gpu_function(
    gpu_device,
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
    rgb_tensor.to_layout_tensor(),
    gray_tensor.to_layout_tensor(),
    grid_dim=Dim(num_col_blocks, num_row_blocks),
    block_dim=Dim(BLOCK_SIZE, BLOCK_SIZE),
)
```

To run this example, run this command:

```sh
magic run grayscale
```

This will show a grid of numbers representing the grayscale values for a single
color broadcast across a simple input image. Try changing the image and block
sizes to see how this scales on the GPU.

### Naive matrix multiplication

The next example performs a very basic matrix multiplication, with no
optimizations to take advantage of hardware resources. The GPU function for
this looks like the following:

```mojo
fn naive_matrix_multiplication(
    i: Int,
    j: Int,
    k: Int,
    m: LayoutTensor[float_dtype],
    n: LayoutTensor[float_dtype],
    p: LayoutTensor[float_dtype],
):
    row = block_dim.y * block_idx.y + thread_idx.y
    col = block_dim.x * block_idx.x + thread_idx.x

    if row < i and col < k:
        for j_index in range(j):
            p[row, col] = p[row, col] + m[row, j_index] * n[j_index, col]
```

The overall setup and execution of this function are extremely similar to the
previous example, with the primary change being the function that is run on the
GPU.

To try out this example, run this command:

```sh
magic run naive_matrix_multiplication
```

You will see the two input matrices printed to the console, as well as the
result of their multiplication. As with the previous examples, try changing
the sizes of the matrices and how they are dispatched on the GPU.

### Calculating the Mandelbrot set fractal

The final example in this recipe shows a slightly more complex calculation
(pun intended):
[the Mandelbrot set fractal](https://en.wikipedia.org/wiki/Mandelbrot_set).
This custom operation takes no input tensors, only a set of scalar arguments,
and returns a 2-D matrix of integer values representing the number of
iterations it took to escape at that location in complex number space.

The per-thread GPU function for this is as follows:

```mojo
fn mandelbrot(
    min_x: Scalar[float_dtype],
    min_y: Scalar[float_dtype],
    scale_x: Scalar[float_dtype],
    scale_y: Scalar[float_dtype],
    max_iterations: Scalar[int_dtype],
    out: TensorType,
):
    var row = block_dim.y * block_idx.y + thread_idx.y
    var col = block_dim.x * block_idx.x + thread_idx.x

    var cx = min_x + col * scale_x
    var cy = min_y + row * scale_y
    var c = ComplexSIMD[float_dtype, 1](cx, cy)

    var z = ComplexSIMD[float_dtype, 1](0, 0)
    var iters = Scalar[int_dtype](0)

    var in_set_mask: Scalar[DType.bool] = True
    for _ in range(max_iterations):
        if not any(in_set_mask):
            break
        in_set_mask = z.squared_norm() <= 4
        iters = in_set_mask.select(iters + 1, iters)
        z = z.squared_add(c)

    out[row, col] = iters
```

This begins by calculating the complex number which represents a given location
in the output grid (C). Then, starting from `Z=0`, the calculation `Z=Z^2 + C`
is iteratively calculated until Z exceeds 4, the threshold we're using for when
Z will escape the set. This occurs up until a maximum number of iterations,
and the number of iterations to escape (or not, if the maximum is hit) is then
returned for each location in the grid.

The area to examine in complex space, the resolution of the grid, and the
maximum number of iterations are all provided as constants:

```mojo
alias MIN_X: Scalar[float_dtype] = -2.0
alias MAX_X: Scalar[float_dtype] = 0.7
alias MIN_Y: Scalar[float_dtype] = -1.12
alias MAX_Y: Scalar[float_dtype] = 1.12
alias SCALE_X = (MAX_X - MIN_X) / GRID_WIDTH
alias SCALE_Y = (MAX_Y - MIN_Y) / GRID_HEIGHT
alias MAX_ITERATIONS = 100
```

You can calculate the Mandelbrot set on the GPU using this command:

```sh
magic run mandelbrot
```

The result should be an ASCII art depiction of the region covered by the
calculation:

```output
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

Try changing the various parameters above to produce different resolution
grids, or look into different areas in the complex number space.

## Conclusion

In this recipe, we've demonstrated how to perform the very basics of
thread-parallel GPU programming in MAX using Mojo and the MAX Driver API. This
is a programming model that is very familiar to those used to CUDA C, and we
have used a series of common examples to show how to map concepts from CUDA to
MAX.

MAX has far more power available for fully utilizing GPUs through
[building computational graphs](https://docs.modular.com/max/tutorials/get-started-with-max-graph-in-python)
and then [defining custom operations](https://docs.modular.com/max/tutorials/build-custom-ops)
in Mojo using hardware-optimized abstractions. MAX is an extremely flexible
framework for programming GPUs, with interfaces at many levels. In this recipe,
you've been introduced to the very basics of getting started with GPU
programming in MAX and Mojo, but there's much more to explore!

## Next Steps

- Try applying GPU programming in MAX for more complex workloads via tutorials
  on the [MAX Graph API](https://docs.modular.com/max/tutorials/get-started-with-max-graph-in-python)
  and [defining custom GPU graph operations in Mojo](https://docs.modular.com/max/tutorials/build-custom-ops).

- Explore MAX's [documentation](https://docs.modular.com/max/) for additional
  features. The [`gpu`](https://docs.modular.com/mojo/stdlib/gpu/) module has
  detail on Mojo's GPU programming functions and types.

- Join our [Modular Forum](https://forum.modular.com/) and [Discord community](https://discord.gg/modular) to share your experiences and get support.

We're excited to see what you'll build with MAX! Share your projects and experiences with us using `#ModularAI` on social media.
