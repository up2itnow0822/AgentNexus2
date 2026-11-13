#!/usr/bin/env bash
# Validates PLATFORM_FEE_RECIPIENT before deploy (no on-chain calls).
set -euo pipefail

PLACEHOLDER_FEE_RECIPIENT="0x742d35cC6634c0532925A3b844bc9E7595F0beB1"
ZERO_ADDRESS="0x0000000000000000000000000000000000000000"

validate_platform_fee_recipient() {
  local recipient="${1:-}"

  if [ -z "$recipient" ]; then
    echo "Error: PLATFORM_FEE_RECIPIENT is required (treasury address)." >&2
    echo "Set PLATFORM_FEE_RECIPIENT in your deploy environment file." >&2
    exit 1
  fi

  if ! [[ "$recipient" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "Error: PLATFORM_FEE_RECIPIENT is malformed: $recipient" >&2
    echo "Expected 0x-prefixed 20-byte hex address (42 characters)." >&2
    exit 1
  fi

  local lower
  lower=$(echo "$recipient" | tr '[:upper:]' '[:lower:]')

  if [ "$lower" = "$(echo "$ZERO_ADDRESS" | tr '[:upper:]' '[:lower:]')" ]; then
    echo "Error: PLATFORM_FEE_RECIPIENT must not be the zero address." >&2
    exit 1
  fi

  if [ "$lower" = "$(echo "$PLACEHOLDER_FEE_RECIPIENT" | tr '[:upper:]' '[:lower:]')" ]; then
    echo "Error: PLATFORM_FEE_RECIPIENT must not be the placeholder treasury address." >&2
    exit 1
  fi
}
