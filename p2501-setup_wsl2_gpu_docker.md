# P2501: Setup WSL2 + GPU + Docker
> Taken directly from [this site](https://ocdevel.com/blog/20201207-wsl2-gpu-docker).

Full details for this post at docs.nvidia.com/cuda/wsl-user-guide, this post expands links' instructions and distills just the essential commands without their about text.

## Switch to Windows Dev Channel
1. Register for Windows Insider Program
2. Settings > Update & Security > Windows Insider Program > switch from Beta Channel (Recommended) to Dev Channel
3. Settings > Update & Security > Advanced Options > turn on Receive updates for other Microsoft products when you update Windows
4. Settings > Update & Security > Check for updates, download, restart

## Install Nvidia WSL2-compatible driver
1. [Nvidia link](https://developer.nvidia.com/cuda/wsl) > Get CUDA Driver > download, install

## Install WSL2
1. Install WSL2
2. Set WSL2 as default `wsl --set-default-version 2`

## Install Ubuntu
1. Install Ubuntu from MS Store
2. [Update Linux kernel](https://docs.microsoft.com/en-us/windows/wsl/install-win10#step-4---download-the-linux-kernel-update-package)

## Install Docker + Nvidia stuff
1. Install Docker and Nvidia stuff
    ```
    $ distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    $ curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
    $ curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
    $ curl -s -L https://nvidia.github.io/libnvidia-container/experimental/$distribution/libnvidia-container-experimental.list | sudo tee /etc/apt/sources.list.d/libnvidia-container-experimental.list
    ```
2. Restart Docker service

## Test
1. `docker run --gpus all nvcr.io/nvidia/k8s/cuda-sample:nbody nbody -gpu -benchmark`