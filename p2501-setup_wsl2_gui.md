# P2501: Setup WSL2 GUI

1. Install VcXSrv
2. Add to ~/.bashrc:
```
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2; exit;}'):0.0
export LIBGL_ALWAYS_INDIRECT=1
sudo /etc/init.d/dbus start &> /dev/nulll
```