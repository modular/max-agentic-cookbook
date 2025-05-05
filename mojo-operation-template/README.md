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
magic init [new project directory] --from BradLarson/mojo-operation-template
```

The template begins with an example of a Mojo kernel, and contains the
components necessary to run a kernel within a Python computational graph, tests
to verify its correctness, and rigorous benchmarks to evaluate its performance.

A very basic one-operation graph in Python that contains the custom Mojo
operation can be run using

```sh
magic run graph
```

This will compile the Mojo code for the kernel, place it in a graph, compile
the graph, and run it.

## Running tests ##

The tests in this project are configured as pytest test cases. To run them, use

```sh
magic run test
```

## Benchmarking ##

A series of rigorous performance benchmarks for the kernel in development have
been configured using the Mojo `benchmark` module. To run them, use the command

```sh
magic run benchmarks
```

## License ##

Apache License v2.0 with LLVM Exceptions.
