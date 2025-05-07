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
from gpu.host import DeviceBuffer
from math import ceildiv
from memory import UnsafePointer
from runtime.asyncrt import DeviceContextPtr
from tensor import InputTensor, OutputTensor
from .matrix_multiplication import (
    block_tiled_vectorized_matrix_multiplication,
    naive_matrix_multiplication,
    naive_matrix_multiplication_cpu,
)


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
