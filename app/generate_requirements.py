import sys
import subprocess

def filter_packages(lines):
    """Filter out OS-specific packages."""
    filtered = []
    for line in lines:
        if sys.platform.startswith("win") and "some-linux-package" in line:
            continue
        if sys.platform.startswith("linux") and "pywin32" in line:
            continue
        filtered.append(line)
    return filtered

def generate_requirements():
    if sys.platform.startswith("win"):
        filename = "requirements-windows.txt"
    elif sys.platform.startswith("linux"):
        filename = "requirements-ubuntu.txt"
    else:
        filename = "requirements.txt"

    # Capture pip freeze output
    result = subprocess.run([sys.executable, "-m", "pip", "freeze"], capture_output=True, text=True)
    lines = result.stdout.splitlines()

    # Filter OS-specific dependencies
    filtered_lines = filter_packages(lines)

    # Write to file
    with open(filename, "w") as f:
        f.write("\n".join(filtered_lines) + "\n")

    print(f"✅ Requirements file generated: {filename}")

if __name__ == "__main__":
    generate_requirements()