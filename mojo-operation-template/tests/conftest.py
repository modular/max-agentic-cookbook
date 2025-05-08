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

from pathlib import Path
import pytest
from max.driver import Accelerator, CPU, accelerator_count
from max.engine import InferenceSession


@pytest.fixture(scope="session")
def session() -> InferenceSession:
    # Note: change this to the ID of the GPU you will use.
    DEVICE_ID = 0

    device = CPU() if accelerator_count() == 0 else Accelerator(id=DEVICE_ID)
    return InferenceSession(devices=[device])
