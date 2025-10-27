from e2b_code_interpreter import Sandbox
from dotenv import load_dotenv

load_dotenv()


sbx = Sandbox() # By default the sandbox is alive for 5 minutes
execution = sbx.run_code("print('hello world')") # Execute Python inside the sandbox

print("\n=== Execution Output ===")
for line in execution.logs.stdout:
    print(line.strip())
print("========================\n")

print("=== Files in Sandbox Root Directory ===")
files = sbx.files.list("/")
file_info = []

directories = []
regular_files = []

for entry in files:
    if entry.type.value == 'dir':
        directories.append(entry.name)
    else:
        regular_files.append(entry.name)

print("\nDirectories:")
for directory in sorted(directories):
    print(f"  📁 {directory}")

print("\nFiles:")
for file in sorted(regular_files):
    print(f"  📄 {file}")

print("=======================================")
