# ===----------------------------------------------------------------------=== #
# Copyright (c) 2025, Modular Inc. All rights reserved.
#
# Licensed under the Apache License v2.0 with LLVM Exceptions:
# https://llvm.org/LICENSE.txt
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ===----------------------------------------------------------------------=== #

import compiler
from gpu import WARP_SIZE, barrier, block_dim, block_idx, thread_idx
from gpu.host import DeviceBuffer, DeviceContext
from gpu.memory import async_copy_wait_all
from layout.layout_tensor import (
    Layout,
    LayoutTensor,
    copy_dram_to_sram,
    copy_dram_to_sram_async,
)
from layout.math import outer_product_acc
from layout.tensor_builder import LayoutTensorBuild as tb
from layout.tensor_core import TensorCore
from math import ceildiv
from memory import UnsafePointer
from runtime.asyncrt import DeviceContextPtr
from sys.info import simdwidthof
from tensor import InputTensor, ManagedTensorSlice, OutputTensor
from utils.index import Index

# ===-----------------------------------------------------------------------===#
# Naive matrix multiplication (CPU)
# ===-----------------------------------------------------------------------===#


fn naive_matrix_multiplication_cpu(
    out: ManagedTensorSlice,
    a: ManagedTensorSlice[type = out.type, rank = out.rank],
    b: ManagedTensorSlice[type = out.type, rank = out.rank],
):
    """A naive matrix multiplication used as a fallback on CPU hardware."""
    var M = a.shape()[0]
    var N = b.shape()[1]
    var K = b.shape()[0]

    for row in range(M):
        for col in range(N):
            for k in range(K):
                out[row, col] = out[row, col] + a[row, k] * b[k, col]


# ===-----------------------------------------------------------------------===#
# Naive matrix multiplication (GPU)
# ===-----------------------------------------------------------------------===#


fn naive_matrix_multiplication[
    dtype: DType,
    a_layout: Layout,
    b_layout: Layout,
    c_layout: Layout,
    BM: Int,
    BN: Int,
](
    a: LayoutTensor[dtype, a_layout, MutableAnyOrigin],
    b: LayoutTensor[dtype, b_layout, MutableAnyOrigin],
    c: LayoutTensor[dtype, c_layout, MutableAnyOrigin],
):
    """
    GEMM kernel that performs matrix multiplication C = A * B.

    Parameters:
        dtype: The data type of the input and output tensors.
        a_layout: The layout of the input tensor A.
        b_layout: The layout of the input tensor B.
        c_layout: The layout of the output tensor C.
        BM: The block size in the M dimension.
        BN: The block size in the N dimension.

    Args:
        a: The input tensor A.
        b: The input tensor B.
        c: The output tensor C.

    This kernel uses a simple for loop structure to compute the matrix
    multiplication. Each thread computes a single element of the output matrix
    C by accumulating the dot product of the corresponding row of A and column
    of B.

    The kernel assumes that the input matrices A and B are compatible for
    matrix multiplication, i.e., the number of columns in A equals the number
    of rows in B.
    """

    var M = a.dim(0)
    var N = b.dim(1)
    var K = b.dim(0)

    # Calculate the column and row indices for each thread.
    var row = block_dim.x * block_idx.x + thread_idx.x
    var col = block_dim.y * block_idx.y + thread_idx.y

    # Initialize a register to accumulate the result for this thread.
    var dst_reg: c.element_type = 0

    # Iterate over the K dimension to compute the dot product.
    if row < M and col < N:
        for k_index in range(K):
            # Multiply the elements and accumulate the result.
            dst_reg = dst_reg + a[row, k_index] * b[k_index, col]

    # Write the final accumulated result to the output matrix.
    c[row, col] = dst_reg


# ===-----------------------------------------------------------------------===#
# Matrix multiplication with vectorized memory access
# ===-----------------------------------------------------------------------===#


fn block_tiled_vectorized_matrix_multiplication[
    dtype: DType,
    a_layout: Layout,
    b_layout: Layout,
    c_layout: Layout,
    BM: Int,
    BN: Int,
    BK: Int,
    TM: Int,
    TN: Int,
    NUM_THREADS: Int,
](
    a: LayoutTensor[dtype, a_layout, MutableAnyOrigin],
    b: LayoutTensor[dtype, b_layout, MutableAnyOrigin],
    c: LayoutTensor[dtype, c_layout, MutableAnyOrigin],
):
    """
    Tiled GEMM kernel that performs matrix multiplication C = A * B with
    vectorized memory access.

    Parameters:
        dtype: The data type of the input and output tensors.
        a_layout: The layout of the input tensor A.
        b_layout: The layout of the input tensor B.
        c_layout: The layout of the output tensor C.
        BM: The block size in the M dimension.
        BN: The block size in the N dimension.
        BK: The block size in the K dimension.
        TM: The tile size in the M dimension.
        TN: The tile size in the N dimension.
        NUM_THREADS: The total number of threads per block.

    Args:
        a: The input tensor A.
        b: The input tensor B.
        c: The output tensor C.

    This kernel uses a 2D block tiling strategy to compute the matrix
    multiplication. Each thread block computes a BM x BN tile of the output
    matrix C. Within each thread block, threads are further divided into TM x
    TN tiles to enable thread-level parallelism.

    The kernel loads tiles of A and B into shared memory using vectorized
    memory access to improve memory bandwidth utilization. It then performs the
    matrix multiplication using register-level tiling and accumulates the
    results in registers.

    The kernel assumes that the input matrices A and B are compatible for
    matrix multiplication, i.e., the number of columns in A equals the number
    of rows in B.
    """

    alias simd_width = simdwidthof[dtype]()
    var partition_col = thread_idx.x % (BN // TN)
    var partition_row = thread_idx.x // (BN // TN)


    # Get the tile of the output matrix C that this thread is responsible
    # for computing.
    var dst = c.tile[BM, BN](block_idx.y, block_idx.x).tile[TM, TN](
        partition_row, partition_col
    )
    var dst_vec = dst.vectorize[1, simd_width]()

    # Allocate shared memory for tiles of A and B.
    # Use column-major layout for A to get the transpose.
    var a_smem = tb[dtype]().col_major[BM, BK]().shared().alloc()
    var b_smem = tb[dtype]().row_major[BK, BN]().shared().alloc()

    # Allocate register tiles to store the partial results and operands.
    var dst_reg = tb[dtype]().row_major[TM, TN]().local().alloc()
    var dst_reg_vec = dst_reg.vectorize[1, simd_width]()
    dst_reg_vec.copy_from(dst_vec)

    var a_reg = tb[dtype]().layout[TM]().local().alloc()
    var b_reg = tb[dtype]().layout[TN]().local().alloc()

    var ntiles = b.dim(0) // BK

    # Iterate over the tiles of A and B in the K dimension.
    for block in range(ntiles):
        alias load_a_layout = Layout.row_major(NUM_THREADS // BK, BK)
        alias load_b_layout = Layout.row_major(BK, NUM_THREADS // BK)
        var a_tile = a.tile[BM, BK](block_idx.y, block)
        var b_tile = b.tile[BK, BN](block, block_idx.x)

        # Load the tiles of A and B into shared memory using vectorized
        # memory access.
        copy_dram_to_sram_async[thread_layout=load_a_layout](
            a_smem.vectorize[simd_width, 1](), a_tile.vectorize[simd_width, 1]()
        )
        copy_dram_to_sram_async[thread_layout=load_b_layout](
            b_smem.vectorize[1, simd_width](), b_tile.vectorize[1, simd_width]()
        )

        async_copy_wait_all()
        barrier()

        # Iterate over the elements in the K dimension within the tiles.
        @parameter
        for k in range(BK):
            # Load the corresponding tiles from shared memory into registers.
            var a_tile = a_smem.tile[TM, 1](partition_row, k)
            var b_tile = b_smem.tile[1, TN](k, partition_col)
            a_reg.copy_from(a_tile)
            b_reg.copy_from(b_tile)

            # Perform outer product and accumulate the partial results.
            outer_product_acc(dst_reg, a_reg, b_reg)

        barrier()

    # Write the final accumulated results to the output matrix.
    dst_vec.copy_from(dst_reg_vec)


@compiler.register("matrix_multiplication")
struct MatrixMultiplication[algorithm: StaticString]:
    """
    The central custom operation that dispatches to multiple different
    matrix multiplication implementations, depending on target hardware and
    selected algorithm.
    """

    @staticmethod
    fn execute[
        # The kind of device this will be run on: "cpu" or "gpu"
        target: StaticString,
    ](
        out: OutputTensor[rank=2],
        a: InputTensor[type = out.type, rank = out.rank],
        b: InputTensor[type = out.type, rank = out.rank],
        # the context is needed for some GPU calls
        ctx: DeviceContextPtr,
    ) raises:
        # At graph compilation time, we will know what device we are compiling
        # this operation for, so we can specialize it for the target hardware.
        @parameter
        if target == "gpu":
            a_layout = a.to_layout_tensor()
            b_layout = b.to_layout_tensor()
            out_layout = out.to_layout_tensor()

            M = a_layout.shape[0]()
            N = b_layout.shape[1]()

            gpu_ctx = ctx.get_device_context()

            # Zero out the memory in the outbound tensor.
            gpu_ctx.enqueue_memset(
                DeviceBuffer[out.type](
                    gpu_ctx,
                    rebind[UnsafePointer[Scalar[out.type]]](out_layout.ptr),
                    M * N,
                    owning=False,
                ),
                0,
            )

            # We support several compile-time variants for the matrix
            # multiplication calculation:
            # - "naive": A naive matrix multiplication using LayoutTensors.
            # - "optimized": Matrix multiplication using a
            #   further-optimized 2D block tiling strategy.
            # In each case, the specific matrix multiplication function is
            # compiled and enqueued to run on the GPU.
            @parameter
            if algorithm == "naive":
                alias BM = 32
                alias BN = 32
                gpu_ctx.enqueue_function[
                    naive_matrix_multiplication[
                        out.type,
                        a_layout.layout,
                        b_layout.layout,
                        out_layout.layout,
                        BM,
                        BN,
                    ]
                ](
                    a_layout,
                    b_layout,
                    out_layout,
                    grid_dim=(ceildiv(N, BN), ceildiv(M, BM)),
                    block_dim=(BN, BM),
                )
            elif algorithm == "optimized":
                alias BM = 128
                alias BN = 128
                alias BK = 8
                alias TM = 8
                alias TN = 8
                alias NUM_THREADS = (BM * BN) // (TM * TN)
                gpu_ctx.enqueue_function[
                    block_tiled_vectorized_matrix_multiplication[
                        out.type,
                        a_layout.layout,
                        b_layout.layout,
                        out_layout.layout,
                        BM,
                        BN,
                        BK,
                        TM,
                        TN,
                        NUM_THREADS,
                    ]
                ](
                    a_layout,
                    b_layout,
                    out_layout,
                    grid_dim=(ceildiv(N, BN), ceildiv(M, BM)),
                    block_dim=(NUM_THREADS),
                )
            else:
                raise Error("No known matmul algorithm:", algorithm)

        else:
            naive_matrix_multiplication_cpu(out, a, b)
