// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import {FeeRecipientLib} from "../script/FeeRecipientLib.sol";

contract FeeRecipientLibTest is Test {
    address private constant PLACEHOLDER = 0x742d35cC6634c0532925A3b844bc9E7595F0beB1;

    function helper_validate(address recipient) external pure {
        FeeRecipientLib.validatePlatformFeeRecipient(recipient);
    }

    function test_validate_acceptsValidRecipient() public {
        this.helper_validate(address(0xBEEF));
    }

    function test_validate_rejectsZeroAddress() public {
        vm.expectRevert("PLATFORM_FEE_RECIPIENT not set");
        this.helper_validate(address(0));
    }

    function test_validate_rejectsPlaceholder() public {
        vm.expectRevert("PLATFORM_FEE_RECIPIENT must not be the placeholder address");
        this.helper_validate(PLACEHOLDER);
    }
}
