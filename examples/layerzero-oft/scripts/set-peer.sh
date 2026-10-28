#!/usr/bin/env bash
set -euo pipefail

# Points the Injective OApp at the Solana OFT Store. The LayerZero wire task
# (`lz:oapp:wire`) does this for both sides and also applies DVN config, so this
# script is only for the Injective half when the wire task is not in use.
#
# A Solana peer is the OFT Store public key as 32 bytes. base58 decoding needs
# no dependency beyond python3.

source .env
: "${PRIVATE_KEY:?Set PRIVATE_KEY in .env}"
: "${OAPP_ADDRESS:?Set OAPP_ADDRESS in .env}"
: "${SOLANA_OFT_STORE:?Set SOLANA_OFT_STORE in .env}"
RPC_URL="${RPC_URL:-https://k8s.testnet.json-rpc.injective.network/}"
SOLANA_EID="${SOLANA_EID:-40168}"

PEER_HEX=$(python3 -I - "$SOLANA_OFT_STORE" <<'PY'
import sys
ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
s = sys.argv[1]
n = 0
for ch in s:
    n = n * 58 + ALPHABET.index(ch)
raw = n.to_bytes(32, "big")
print("0x" + raw.hex())
PY
)

echo "=== setPeer ==="
echo "  OApp:  $OAPP_ADDRESS"
echo "  eid:   $SOLANA_EID"
echo "  peer:  $PEER_HEX"
cast send "$OAPP_ADDRESS" "setPeer(uint32,bytes32)" "$SOLANA_EID" "$PEER_HEX" \
  --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY"

echo ""
echo "The Solana side still needs its peer and the pathway needs DVN config."
echo "Run lz:oapp:wire from the LayerZero oft-solana example with layerzero/layerzero.config.ts."
