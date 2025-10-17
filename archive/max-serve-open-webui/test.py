#!/usr/bin/env python3
"""
Integration test for max-serve-open-webui recipe.
Tests that the recipe can start and the endpoints are accessible.
"""

import os
import subprocess
import time
import signal
import sys
from pathlib import Path

# Optional imports with fallbacks
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("Warning: requests not available, skipping HTTP tests")


class MaxServeOpenWebUIIntegrationTest:
    """Integration test for max-serve-open-webui recipe."""
    
    def __init__(self):
        self.recipe_dir = Path(__file__).parent
        self.process = None
        self.max_endpoint = "http://localhost:8000"
        self.openwebui_endpoint = "http://localhost:8080"
        self.startup_timeout = 300  # 5 minutes for startup
        self.check_interval = 5  # Check every 5 seconds
    
    def start_services(self):
        """Start the max-serve-open-webui services."""
        print("Starting max-serve-open-webui services...")
        
        # Change to recipe directory
        os.chdir(self.recipe_dir)
        
        # Start the services using pixi run app
        try:
            self.process = subprocess.Popen(
                ["pixi", "run", "app"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            print(f"Started process with PID: {self.process.pid}")
            return True
        except Exception as e:
            print(f"Failed to start services: {e}")
            return False
    
    def stop_services(self):
        """Stop the services."""
        if self.process:
            print("Stopping services...")
            try:
                # Send SIGTERM to the process group
                os.killpg(os.getpgid(self.process.pid), signal.SIGTERM)
                self.process.wait(timeout=10)
            except (subprocess.TimeoutExpired, ProcessLookupError):
                # If graceful shutdown fails, force kill
                try:
                    os.killpg(os.getpgid(self.process.pid), signal.SIGKILL)
                except ProcessLookupError:
                    pass
            self.process = None
            print("Services stopped")
    
    def check_endpoint(self, url, service_name):
        """Check if an endpoint is responding."""
        if not HAS_REQUESTS:
            print(f"Skipping {service_name} endpoint check (requests not available)")
            return False
        
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {service_name} is responding at {url}")
                return True
            else:
                print(f"❌ {service_name} returned status {response.status_code} at {url}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ {service_name} not responding at {url}: {e}")
            return False
    
    def wait_for_services(self):
        """Wait for both services to start and be ready."""
        print("Waiting for services to start...")
        start_time = time.time()
        max_ready = False
        openwebui_ready = False
        
        while time.time() - start_time < self.startup_timeout:
            # Check if process is still running
            if self.process and self.process.poll() is not None:
                print("Process exited unexpectedly")
                return False
            
            # Check MAX endpoint
            if not max_ready:
                max_ready = self.check_endpoint(self.max_endpoint, "MAX")
            
            # Check OpenWebUI endpoint
            if not openwebui_ready:
                openwebui_ready = self.check_endpoint(self.openwebui_endpoint, "OpenWebUI")
            
            # If both are ready, we're done
            if max_ready and openwebui_ready:
                print("✅ Both services are ready!")
                return True
            
            # Wait before next check
            time.sleep(self.check_interval)
            elapsed = time.time() - start_time
            print(f"Elapsed time: {elapsed:.1f}s / {self.startup_timeout}s")
        
        print(f"❌ Services did not start within {self.startup_timeout} seconds")
        return False
    
    def test_basic_configuration(self):
        """Test basic configuration files exist."""
        print("Testing basic configuration...")
        
        # Check essential files exist
        essential_files = [
            "pyproject.toml",
            "metadata.yaml",
            "Procfile",
            "Procfile.clean"
        ]
        
        for file_name in essential_files:
            file_path = self.recipe_dir / file_name
            if not file_path.exists():
                print(f"❌ Missing essential file: {file_name}")
                return False
            print(f"✅ Found {file_name}")
        
        # Check pyproject.toml has pixi configuration
        pyproject_path = self.recipe_dir / "pyproject.toml"
        with open(pyproject_path) as f:
            content = f.read()
            if "[tool.pixi" not in content:
                print("❌ pyproject.toml missing pixi configuration")
                return False
            print("✅ pyproject.toml has pixi configuration")
        
        return True
    
    def run_integration_test(self):
        """Run the full integration test."""
        print("=" * 60)
        print("MAX-SERVE-OPEN-WEBUI INTEGRATION TEST")
        print("=" * 60)
        
        try:
            # Test basic configuration
            if not self.test_basic_configuration():
                print("❌ Basic configuration test failed")
                return False
            
            # Start services
            if not self.start_services():
                print("❌ Failed to start services")
                return False
            
            # Wait for services to be ready
            if not self.wait_for_services():
                print("❌ Services failed to start properly")
                return False
            
            print("✅ Integration test passed!")
            return True
            
        except KeyboardInterrupt:
            print("\nTest interrupted by user")
            return False
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            return False
        finally:
            self.stop_services()


def run_quick_config_test():
    """Run a quick configuration test without starting services."""
    print("Running quick configuration test...")
    
    recipe_dir = Path(__file__).parent
    
    # Test that essential files exist
    essential_files = ["pyproject.toml", "metadata.yaml", "Procfile"]
    for file_name in essential_files:
        file_path = recipe_dir / file_name
        if not file_path.exists():
            print(f"❌ Missing {file_name}")
            return False
        print(f"✅ {file_name} exists")
    
    # Test pyproject.toml has pixi configuration
    pyproject_path = recipe_dir / "pyproject.toml"
    with open(pyproject_path) as f:
        content = f.read()
        if "[tool.pixi" not in content:
            print("❌ pyproject.toml missing pixi configuration")
            return False
        print("✅ pyproject.toml has pixi configuration")
    
    # Test that it references pixi, not magic
    if "magic" in content.lower():
        print("❌ Found 'magic' references in pyproject.toml")
        return False
    print("✅ No 'magic' references found")
    
    # Test that it uses modular package
    if "modular" not in content:
        print("❌ Missing 'modular' package reference")
        return False
    print("✅ Found 'modular' package reference")
    
    print("✅ Quick configuration test passed!")
    return True


if __name__ == "__main__":
    # For CI environments, run quick test only
    if os.environ.get("CI") or "--quick" in sys.argv:
        print("Running in CI mode - quick configuration test only")
        success = run_quick_config_test()
    else:
        # Full integration test
        test = MaxServeOpenWebUIIntegrationTest()
        success = test.run_integration_test()
    
    if not success:
        sys.exit(1)
    
    print("🎉 All tests passed!")