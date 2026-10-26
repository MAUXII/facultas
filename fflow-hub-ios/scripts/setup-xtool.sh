#!/usr/bin/env bash
set -euo pipefail

echo "==> Instalando xtool (Linux/WSL)"
echo "    Docs: https://xtool.sh/documentation/xtool/installation-linux/"

if ! command -v swift >/dev/null 2>&1; then
  echo "Swift não encontrado. Instale Swift 6.3: https://swift.org/install/linux"
  exit 1
fi

if ! command -v usbmuxd >/dev/null 2>&1; then
  echo "usbmuxd não encontrado. Ex.: sudo apt-get install usbmuxd"
  exit 1
fi

curl -fL \
  "https://github.com/xtool-org/xtool/releases/latest/download/xtool-$(uname -m).AppImage" \
  -o /tmp/xtool
chmod +x /tmp/xtool
sudo mv /tmp/xtool /usr/local/bin/xtool

echo "==> xtool instalado"
xtool --help | head -5

echo ""
echo "Próximos passos:"
echo "  1. xtool setup          # login Apple + Xcode.xip"
echo "  2. cd fflow-hub-ios"
echo "  3. xtool dev              # iPhone USB"
echo "     xtool dev --simulator  # só macOS"
