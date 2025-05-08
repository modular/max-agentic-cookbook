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

from gpu.host import DeviceContext
from layout.layout_tensor import Layout, LayoutTensor
from math import ceildiv
from sys import has_amd_gpu_accelerator, has_nvidia_gpu_accelerator
from operations.matrix_multiplication import (
    block_tiled_vectorized_matrix_multiplication,
    naive_matrix_multiplication,
)
from testing import assert_almost_equal

alias DEVICE_ID = 0


def test_matmul[variant: StaticString](ctx: DeviceContext) -> None:
    alias M = 16
    alias K = 16
    alias N = 16

    alias a_layout = Layout.row_major(M, K)
    alias b_layout = Layout.row_major(K, N)
    alias c_layout = Layout.row_major(M, N)

    alias float_dtype = DType.float32

    var a_buffer = ctx.enqueue_create_buffer[float_dtype](a_layout.size())
    var b_buffer = ctx.enqueue_create_buffer[float_dtype](b_layout.size())
    var c_buffer = ctx.enqueue_create_buffer[float_dtype](c_layout.size())

    with a_buffer.map_to_host() as host_buffer:
        var a_tensor = LayoutTensor[float_dtype, a_layout](host_buffer)
        for a_row in range(M):
            for a_col in range(K):
                a_tensor[a_row, a_col] = a_row - a_col

    with b_buffer.map_to_host() as host_buffer:
        var b_tensor = LayoutTensor[float_dtype, b_layout](host_buffer)
        for b_row in range(N):
            for b_col in range(M):
                b_tensor[b_row, b_col] = b_row + b_col

    _ = c_buffer.enqueue_fill(0.0)

    var a_tensor = LayoutTensor[float_dtype, a_layout](a_buffer)
    var b_tensor = LayoutTensor[float_dtype, b_layout](b_buffer)
    var c_tensor = LayoutTensor[float_dtype, c_layout](c_buffer)

    @parameter
    if variant == "naive":
        alias BM = 32
        alias BN = 32

        ctx.enqueue_function[
            naive_matrix_multiplication[
                float_dtype,
                a_layout,
                b_layout,
                c_layout,
                BM,
                BN,
            ]
        ](
            a_tensor,
            b_tensor,
            c_tensor,
            grid_dim=(ceildiv(N, BN), ceildiv(M, BM)),
            block_dim=(BN, BM),
        )
    elif variant == "optimized":
        alias BM = 128
        alias BN = 128
        alias BK = 8
        alias TM = 8
        alias TN = 8
        alias NUM_THREADS = (BM * BN) // (TM * TN)
        ctx.enqueue_function[
            block_tiled_vectorized_matrix_multiplication[
                float_dtype,
                a_layout,
                b_layout,
                c_layout,
                BM,
                BN,
                BK,
                TM,
                TN,
                NUM_THREADS,
            ]
        ](
            a_tensor,
            b_tensor,
            c_tensor,
            grid_dim=(ceildiv(N, BN), ceildiv(M, BM)),
            block_dim=(NUM_THREADS),
        )

    with c_buffer.map_to_host() as host_buffer:
        var host_tensor = LayoutTensor[float_dtype, c_layout](host_buffer)
        assert_almost_equal(host_tensor[0, 0], -1240.0)
        assert_almost_equal(host_tensor[M - 1, N - 1], 2360.0)


def main():
    @parameter
    if has_amd_gpu_accelerator() or has_nvidia_gpu_accelerator():
        var gpu_ctx = DeviceContext(device_id=DEVICE_ID)
        test_matmul["naive"](gpu_ctx)
        test_matmul["optimized"](gpu_ctx)
