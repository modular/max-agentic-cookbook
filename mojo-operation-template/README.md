# A template for Mojo CPU / GPU custom operation development #

Modular's [Mojo](https://docs.modular.com/mojo/manual/) language, combined with
the [MAX](https://docs.modular.com/max/) framework, provide an elegant
programming environment for getting the most out of a variety of GPU and CPU
architectures.

When developing a new computational kernel, it can be helpful to start with
scaffolding that lets you drop in a reference implementation and hack on it to
optimize performance. This is an easy-to-initialize template that sets up the
basics for hacking on a kernel with the ultimate goal of placing it in a
Python-based model. You can start either through cloning the repository or
initializing a project using the Magic command-line interface (see later).

## Usage ##

The command-line tool Magic will handle all dependency setup for MAX, and can
be installed via

```sh
curl -ssL https://magic.modular.com | bash
```

Once Magic is installed on your system, a new directory can be created from
this template using the command

```sh
magic init [new project directory] --from mojo-operation-template
```

The template begins with an example of a Mojo kernel, and contains the
components necessary to run a kernel within a Python computational graph, tests
to verify its correctness, and rigorous benchmarks to evaluate its performance.

## Running tests ##

There are both Mojo unit tests and `pytest`-based Python unit tests in this
template. If you're working from pure Mojo code, you can start with the former,
and can move to the Python-based tests if you'd like to verify an operation
inside of a Python MAX graph.

To run the Mojo unit tests, use

```sh
magic run test
```

To run the `pytest` unit tests, use

```sh
magic run pytest
```

## Benchmarking ##

A series of rigorous performance benchmarks for the Mojo kernel in development
have been configured using the Mojo `benchmark` module. To run them, use the
command

```sh
magic run benchmarks
```

## Running a graph containing this operation ##

A very basic one-operation graph in Python that contains the custom Mojo
operation can be run using

```sh
magic run graph
```

This will compile the Mojo code for the kernel, place it in a graph, compile
the graph, and run it. Such a graph is an example of how this operation would
be used in a larger AI model within the MAX framework.

## Profiling AMD GPU kernels ##

Run the command:

```sh
magic run profile_amd test_correctness.mojo
```

This will generate a `test_correctness.log` file containing profile information.

Check the script inside [profile_amd.sh](./profile_amd.sh) to see how it works.

## Debugging AMD GPU kernels ##

To build a binary from a Mojo file and start the debugger run:

```sh
magic run debug_amd test_correctness.mojo
```

You can now set a breakpoint inside the kernel code (press y on the "Make
breakpoint pending" prompt):

```sh
b operations/matrix_multiplication.mojo:180
```

Cheat-sheet for debugging commands:

```sh
# Start the debug session
run
r

# Continue to next break point
continue
c

# Step over
next
n

# Step into
step
s

# List all host and GPU threads
info threads

# Switch to thread n
thread [n]

# View local variables
info locals

# view register values
info register

# view all the stack frames
backtrace
bt

# switch to frame n
frame [n]
```

For more commands run:

```sh
help
help [topic]
```

Check the script inside [debug_amd.sh](./debug_amd.sh) to see how it works.

## License ##

Apache License v2.0 with LLVM Exceptions.
