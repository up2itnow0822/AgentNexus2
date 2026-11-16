// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

/**
 * @title FeeRecipientLib
 * @notice Pre-deploy validation for platform fee recipient addresses
 */
library FeeRecipientLib {
  /// @dev Historically hardcoded placeholder — must never be used in production deploys
  address internal constant PLACEHOLDER_FEE_RECIPIENT = 0x742d35cC6634c0532925A3b844bc9E7595F0beB1;

  function validatePlatformFeeRecipient(address recipient) internal pure {
    require(recipient != address(0), "PLATFORM_FEE_RECIPIENT not set");
    require(
      recipient != PLACEHOLDER_FEE_RECIPIENT,
      "PLATFORM_FEE_RECIPIENT must not be the placeholder address"
    );
  }
}
