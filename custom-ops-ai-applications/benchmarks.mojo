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

from operations.top_k import TopK
from gpu.host import DeviceContext
from utils import IndexList
from max.driver import cpu
from max.tensor import (
    ManagedTensorSlice,
    InputTensor,
    OutputTensor,
    StaticTensorSpec,
)
from random import rand
from memory import UnsafePointer
from runtime.asyncrt import DeviceContextPtr
from benchmark import ThroughputMeasure, BenchId, BenchMetric, Bench, Bencher
from bit import log2_floor
from sys import sizeof, has_nvidia_gpu_accelerator
from memory import AddressSpace


def top_k():
    alias batch_size = 30_000
    alias K = 32
    alias els = batch_size * K
    alias rank = 2
    alias shape = IndexList[rank](batch_size, K)
    alias val_dtype = DType.float32
    alias idx_dtype = DType.int32

    # Slightly better performance compared to `create_unknown`. Using global
    # address space doesn't improve perf for GPU.
    alias val_spec = StaticTensorSpec[val_dtype, rank](
        shape=(batch_size, K),
        strides=(K, 1),
        alignment=sizeof[val_dtype](),
        address_space=AddressSpace.GENERIC,
        exclusive=True,
        in_lambda=None,
        out_lambda=None,
    )
    alias idx_spec = StaticTensorSpec[idx_dtype, rank](
        shape=(batch_size, K),
        strides=(K, 1),
        alignment=sizeof[idx_dtype](),
        address_space=AddressSpace.GENERIC,
        exclusive=True,
        in_lambda=None,
        out_lambda=None,
    )

    var in_vals = InputTensor[static_spec=val_spec].rand()
    var out_vals = OutputTensor[static_spec=val_spec].rand()
    var out_idxs = OutputTensor[static_spec=idx_spec].rand()

    var cpu_ctx = DeviceContext(api="cpu")

    @parameter
    @always_inline
    fn bench_cpu(mut b: Bencher) raises:
        @parameter
        @always_inline
        fn run_bench() raises:
            TopK.execute[K=K, target="cpu"](
                out_vals, out_idxs, in_vals, cpu_ctx
            )

        b.iter[run_bench]()

    var flops = ThroughputMeasure(BenchMetric.flops, els * log2_floor(K))
    var elements = ThroughputMeasure(BenchMetric.elements, els)

    var b = Bench()
    b.bench_function[bench_cpu](BenchId("top_k_custom", "cpu"), flops, elements)

    @parameter
    if has_nvidia_gpu_accelerator():
        var gpu_ctx = DeviceContext()

        var in_vals_dev_buff = gpu_ctx.enqueue_create_buffer[val_dtype](els)
        var out_vals_dev_buff = gpu_ctx.enqueue_create_buffer[val_dtype](els)
        var out_idxs_dev_buff = gpu_ctx.enqueue_create_buffer[idx_dtype](els)

        gpu_ctx.enqueue_copy(in_vals_dev_buff, in_vals.unsafe_ptr())

        var out_vals_dev = OutputTensor[static_spec=val_spec](
            out_vals_dev_buff.unsafe_ptr(), shape
        )
        var out_idxs_dev = OutputTensor[static_spec=idx_spec](
            out_idxs_dev_buff.unsafe_ptr(), shape
        )
        var in_vals_dev = InputTensor[static_spec=val_spec](
            in_vals_dev_buff.unsafe_ptr(), shape
        )

        @parameter
        @always_inline
        fn bench_gpu(mut b: Bencher) raises:
            @parameter
            @always_inline
            fn kernel_launch(gpu_ctx: DeviceContext) raises:
                TopK.execute[K=K, target="gpu"](
                    out_vals_dev, out_idxs_dev, in_vals_dev, gpu_ctx
                )

            b.iter_custom[kernel_launch](gpu_ctx)

        b.bench_function[bench_gpu](
            BenchId("top_k_custom", "gpu"), flops, elements
        )
        _ = in_vals_dev_buff
        _ = out_vals_dev_buff
        _ = out_idxs_dev_buff

    b.config.verbose_metric_names = False
    print(b)

    _ = in_vals
    _ = out_vals
    _ = out_idxs


def main():
    top_k()
