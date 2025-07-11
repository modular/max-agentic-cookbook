#!/usr/bin/env python3
"""
Integration test for max-serve-anythingllm recipe.
Tests that the recipe can start and the endpoints are accessible.
"""

import os
import subprocess
import time
import signal
import sys
import tempfile
import shutil
from pathlib import Path

# Optional imports with fallbacks
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("Warning: requests not available, skipping HTTP tests")


class MaxServeAnythingLLMIntegrationTest:
    """Integration test for max-serve-anythingllm recipe."""
    
    def __init__(self):
        self.recipe_dir = Path(__file__).parent
        self.process = None
        self.max_endpoint = "http://localhost:3002"
        self.anythingllm_endpoint = "http://localhost:3001"
        self.startup_timeout = 300  # 5 minutes for startup
        self.check_interval = 5  # Check every 5 seconds
        self.test_data_dir = None
    
    def start_services(self):
        """Start the max-serve-anythingllm services."""
        print("Starting max-serve-anythingllm services...")
        
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
                universal_newlines=True,
                preexec_fn=os.setsid  # Create new process group
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
    
    def check_docker_available(self):
        """Check if Docker is available and running."""
        try:
            result = subprocess.run(
                ["docker", "ps"], 
                capture_output=True, 
                text=True, 
                timeout=10
            )
            if result.returncode == 0:
                print("✅ Docker is available and running")
                return True
            else:
                print(f"❌ Docker is not running: {result.stderr}")
                return False
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            print(f"❌ Docker not available: {e}")
            return False
    
    def test_setup_functionality(self):
        """Test the setup.py functionality."""
        print("Testing setup.py functionality...")
        
        # Create a temporary directory for testing
        self.test_data_dir = tempfile.mkdtemp(prefix="anythingllm_test_")
        
        try:
            # Set environment variable for test
            original_env = os.environ.get("UI_STORAGE_LOCATION")
            os.environ["UI_STORAGE_LOCATION"] = self.test_data_dir
            
            # Run setup
            result = subprocess.run(
                ["python", "setup.py"],
                capture_output=True,
                text=True,
                cwd=self.recipe_dir
            )
            
            if result.returncode != 0:
                print(f"❌ Setup failed: {result.stderr}")
                return False
            
            # Check that directory was created (it should already exist since we created it)
            if not os.path.exists(self.test_data_dir):
                print("❌ Data directory not created")
                return False
            
            # Check that .env file was created
            env_file = os.path.join(self.test_data_dir, ".env")
            if not os.path.exists(env_file):
                print("❌ .env file not created in data directory")
                return False
            
            print("✅ Setup functionality works correctly")
            return True
            
        finally:
            # Restore original environment
            if original_env is not None:
                os.environ["UI_STORAGE_LOCATION"] = original_env
            elif "UI_STORAGE_LOCATION" in os.environ:
                del os.environ["UI_STORAGE_LOCATION"]
            
            # Clean up test directory
            if self.test_data_dir and os.path.exists(self.test_data_dir):
                shutil.rmtree(self.test_data_dir)
    
    def wait_for_services(self):
        """Wait for both services to start and be ready."""
        print("Waiting for services to start...")
        start_time = time.time()
        max_ready = False
        anythingllm_ready = False
        
        while time.time() - start_time < self.startup_timeout:
            # Check if process is still running
            if self.process and self.process.poll() is not None:
                print("Process exited unexpectedly")
                return False
            
            # Check MAX endpoint
            if not max_ready:
                max_ready = self.check_endpoint(self.max_endpoint, "MAX")
            
            # Check AnythingLLM endpoint
            if not anythingllm_ready:
                anythingllm_ready = self.check_endpoint(self.anythingllm_endpoint, "AnythingLLM")
            
            # If both are ready, we're done
            if max_ready and anythingllm_ready:
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
            "main.py",
            "setup.py"
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
        
        return True
    
    def run_integration_test(self):
        """Run the full integration test."""
        print("=" * 60)
        print("MAX-SERVE-ANYTHINGLLM INTEGRATION TEST")
        print("=" * 60)
        
        try:
            # Test basic configuration
            if not self.test_basic_configuration():
                print("❌ Basic configuration test failed")
                return False
            
            # Test setup functionality
            if not self.test_setup_functionality():
                print("❌ Setup functionality test failed")
                return False
            
            # Check Docker availability
            if not self.check_docker_available():
                print("❌ Docker not available - skipping integration test")
                print("✅ Configuration tests passed!")
                return True
            
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
    essential_files = ["pyproject.toml", "metadata.yaml", "main.py", "setup.py"]
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
    
    # Test setup.py functionality
    test_data_dir = tempfile.mkdtemp(prefix="anythingllm_test_")
    try:
        original_env = os.environ.get("UI_STORAGE_LOCATION")
        os.environ["UI_STORAGE_LOCATION"] = test_data_dir
        
        result = subprocess.run(
            ["python", "setup.py"],
            capture_output=True,
            text=True,
            cwd=recipe_dir
        )
        
        if result.returncode != 0:
            print(f"❌ Setup test failed: {result.stderr}")
            return False
        
        env_file = os.path.join(test_data_dir, ".env")
        if not os.path.exists(env_file):
            print("❌ Setup didn't create .env file")
            return False
        
        print("✅ Setup functionality works")
        
    finally:
        if original_env is not None:
            os.environ["UI_STORAGE_LOCATION"] = original_env
        elif "UI_STORAGE_LOCATION" in os.environ:
            del os.environ["UI_STORAGE_LOCATION"]
        
        if os.path.exists(test_data_dir):
            shutil.rmtree(test_data_dir)
    
    print("✅ Quick configuration test passed!")
    return True


if __name__ == "__main__":
    # For CI environments, run quick test only
    if os.environ.get("CI") or "--quick" in sys.argv:
        print("Running in CI mode - quick configuration test only")
        success = run_quick_config_test()
    else:
        # Full integration test
        test = MaxServeAnythingLLMIntegrationTest()
        success = test.run_integration_test()
    
    if not success:
        sys.exit(1)
    
    print("🎉 All tests passed!")