// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/AgentNexusEntitlements.sol";

/**
 * @title AgentNexusEntitlementsTest
 * @notice Comprehensive tests for AgentNexusEntitlements ERC-1155 contract
 * @dev Tests all functionality including access control, minting, burning, and access checks
 */
contract AgentNexusEntitlementsTest is Test {
    AgentNexusEntitlements public entitlements;
    
    address public admin = address(0x1);
    address public minter = address(0x2);
    address public burner = address(0x3);
    address public uriManager = address(0x4);
    address public user1 = address(0x5);
    address public user2 = address(0x6);
    
    string public constant BASE_URI = "https://api.agentnexus.io/metadata/";
    
    uint256 public constant AGENT_ID_1 = 1;
    uint256 public constant AGENT_ID_2 = 2;
    
    event EntitlementCreated(
        uint256 indexed tokenId,
        uint256 indexed agentId,
        bool transferrable,
        uint256 expiration
    );
    
    event EntitlementMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount
    );
    
    event EntitlementBurned(
        address indexed from,
        uint256 indexed tokenId,
        uint256 amount
    );
    
    function setUp() public {
        vm.startPrank(admin);
        entitlements = new AgentNexusEntitlements(BASE_URI);
        
        // Grant roles
        entitlements.grantRole(entitlements.MINTER_ROLE(), minter);
        entitlements.grantRole(entitlements.BURNER_ROLE(), burner);
        entitlements.grantRole(entitlements.URI_MANAGER_ROLE(), uriManager);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        ENTITLEMENT CREATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCreateEntitlement() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(
            AGENT_ID_1,
            "ipfs://QmTest123",
            true, // transferrable
            0     // no expiration
        );
        
        assertEq(tokenId, 1);
        assertEq(entitlements.tokenIdToAgentId(tokenId), AGENT_ID_1);
        assertEq(entitlements.agentIdToTokenId(AGENT_ID_1), tokenId);
        assertTrue(entitlements.transferrable(tokenId));
        assertEq(entitlements.expirations(tokenId), 0);
    }

    function testCreateEntitlementWithExpiration() public {
        uint256 expiration = block.timestamp + 365 days;
        
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(
            AGENT_ID_1,
            "ipfs://QmTest123",
            false, // non-transferrable
            expiration
        );
        
        assertEq(entitlements.expirations(tokenId), expiration);
        assertFalse(entitlements.transferrable(tokenId));
    }

    function testCreateEntitlementRevertsIfNotAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
    }

    function testCreateEntitlementRevertsIfDuplicate() public {
        vm.startPrank(admin);
        entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        vm.expectRevert("Agent entitlement already exists");
        entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function testMint() public {
        // Create entitlement first
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        // Mint to user
        vm.prank(minter);
        entitlements.mint(user1, tokenId, 1, "");
        
        assertEq(entitlements.balanceOf(user1, tokenId), 1);
    }

    function testMintMultipleAmounts() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        vm.prank(minter);
        entitlements.mint(user1, tokenId, 5, "");
        
        assertEq(entitlements.balanceOf(user1, tokenId), 5);
    }

    function testMintRevertsIfNotMinter() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        vm.prank(user1);
        vm.expectRevert();
        entitlements.mint(user1, tokenId, 1, "");
    }

    function testMintRevertsIfTokenDoesNotExist() public {
        vm.prank(minter);
        vm.expectRevert("Token ID does not exist");
        entitlements.mint(user1, 999, 1, "");
    }

    function testMintRevertsIfToZeroAddress() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        vm.prank(minter);
        vm.expectRevert("Cannot mint to zero address");
        entitlements.mint(address(0), tokenId, 1, "");
    }

    function testMintBatch() public {
        vm.prank(admin);
        uint256 tokenId1 = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        vm.prank(admin);
        uint256 tokenId2 = entitlements.createEntitlement(AGENT_ID_2, "", true, 0);
        
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = tokenId1;
        tokenIds[1] = tokenId2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1;
        amounts[1] = 1;
        
        vm.prank(minter);
        entitlements.mintBatch(user1, tokenIds, amounts, "");
        
        assertEq(entitlements.balanceOf(user1, tokenId1), 1);
        assertEq(entitlements.balanceOf(user1, tokenId2), 1);
    }

    /*//////////////////////////////////////////////////////////////
                            BURNING TESTS
    //////////////////////////////////////////////////////////////*/

    function testBurn() public {
        // Setup: create and mint
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        vm.prank(minter);
        entitlements.mint(user1, tokenId, 5, "");
        
        // Burn
        vm.prank(burner);
        entitlements.burn(user1, tokenId, 2);
        
        assertEq(entitlements.balanceOf(user1, tokenId), 3);
    }

    function testBurnRevertsIfNotBurner() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        vm.prank(minter);
        entitlements.mint(user1, tokenId, 1, "");
        
        vm.prank(user1);
        vm.expectRevert();
        entitlements.burn(user1, tokenId, 1);
    }

    function testBurnBatch() public {
        vm.prank(admin);
        uint256 tokenId1 = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        vm.prank(admin);
        uint256 tokenId2 = entitlements.createEntitlement(AGENT_ID_2, "", true, 0);
        
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = tokenId1;
        tokenIds[1] = tokenId2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 5;
        amounts[1] = 3;
        
        vm.prank(minter);
        entitlements.mintBatch(user1, tokenIds, amounts, "");
        
        uint256[] memory burnAmounts = new uint256[](2);
        burnAmounts[0] = 2;
        burnAmounts[1] = 1;
        
        vm.prank(burner);
        entitlements.burnBatch(user1, tokenIds, burnAmounts);
        
        assertEq(entitlements.balanceOf(user1, tokenId1), 3);
        assertEq(entitlements.balanceOf(user1, tokenId2), 2);
    }

    /*//////////////////////////////////////////////////////////////
                        ACCESS CHECKING TESTS
    //////////////////////////////////////////////////////////////*/

    function testHasAccess() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        // Initially no access
        assertFalse(entitlements.hasAccess(user1, AGENT_ID_1));
        
        // Mint token
        vm.prank(minter);
        entitlements.mint(user1, tokenId, 1, "");
        
        // Now has access
        assertTrue(entitlements.hasAccess(user1, AGENT_ID_1));
    }

    function testHasAccessReturnsFalseIfNoBalance() public {
        vm.prank(admin);
        entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        assertFalse(entitlements.hasAccess(user1, AGENT_ID_1));
    }

    function testHasAccessReturnsFalseIfExpired() public {
        uint256 expiration = block.timestamp + 1 hours;
        
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, expiration);
        
        vm.prank(minter);
        entitlements.mint(user1, tokenId, 1, "");
        
        // Has access before expiration
        assertTrue(entitlements.hasAccess(user1, AGENT_ID_1));
        
        // Fast forward past expiration
        vm.warp(block.timestamp + 2 hours);
        
        // No longer has access
        assertFalse(entitlements.hasAccess(user1, AGENT_ID_1));
    }

    function testHasAccessBatch() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        // Mint to user1 only
        vm.prank(minter);
        entitlements.mint(user1, tokenId, 1, "");
        
        address[] memory users = new address[](2);
        users[0] = user1;
        users[1] = user2;
        
        bool[] memory accessList = entitlements.hasAccessBatch(users, AGENT_ID_1);
        
        assertTrue(accessList[0]);  // user1 has access
        assertFalse(accessList[1]); // user2 doesn't
    }

    /*//////////////////////////////////////////////////////////////
                        TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    function testTransferWorksIfTransferrable() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        vm.prank(minter);
        entitlements.mint(user1, tokenId, 1, "");
        
        // Transfer should work
        vm.prank(user1);
        entitlements.safeTransferFrom(user1, user2, tokenId, 1, "");
        
        assertEq(entitlements.balanceOf(user1, tokenId), 0);
        assertEq(entitlements.balanceOf(user2, tokenId), 1);
    }

    function testTransferRevertsIfNotTransferrable() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", false, 0); // non-transferrable
        
        vm.prank(minter);
        entitlements.mint(user1, tokenId, 1, "");
        
        // Transfer should fail
        vm.prank(user1);
        vm.expectRevert("Token is not transferrable");
        entitlements.safeTransferFrom(user1, user2, tokenId, 1, "");
    }

    /*//////////////////////////////////////////////////////////////
                            URI TESTS
    //////////////////////////////////////////////////////////////*/

    function testUriReturnsTokenSpecificUri() public {
        string memory customUri = "ipfs://QmCustom123";
        
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, customUri, true, 0);
        
        assertEq(entitlements.uri(tokenId), customUri);
    }

    function testUriReturnsBaseUriPlusTokenId() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        string memory expectedUri = string(abi.encodePacked(BASE_URI, "1"));
        assertEq(entitlements.uri(tokenId), expectedUri);
    }

    function testSetTokenURI() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        string memory newUri = "ipfs://QmNewUri456";
        vm.prank(uriManager);
        entitlements.setTokenURI(tokenId, newUri);
        
        assertEq(entitlements.uri(tokenId), newUri);
    }

    function testSetTokenURIRevertsIfNotUriManager() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        vm.prank(user1);
        vm.expectRevert();
        entitlements.setTokenURI(tokenId, "new-uri");
    }

    function testSetBaseURI() public {
        string memory newBaseUri = "https://new-api.agentnexus.io/";
        
        vm.prank(uriManager);
        entitlements.setBaseURI(newBaseUri);
        
        assertEq(entitlements.baseURI(), newBaseUri);
    }

    /*//////////////////////////////////////////////////////////////
                        GETTER TESTS
    //////////////////////////////////////////////////////////////*/

    function testGetAgentId() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        assertEq(entitlements.getAgentId(tokenId), AGENT_ID_1);
    }

    function testGetTokenId() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        assertEq(entitlements.getTokenId(AGENT_ID_1), tokenId);
    }

    function testIsExpired() public {
        uint256 expiration = block.timestamp + 1 days;
        
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, expiration);
        
        // Not expired yet
        assertFalse(entitlements.isExpired(tokenId));
        
        // Fast forward
        vm.warp(block.timestamp + 2 days);
        
        // Now expired
        assertTrue(entitlements.isExpired(tokenId));
    }

    function testIsExpiredReturnsFalseIfNoExpiration() public {
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        assertFalse(entitlements.isExpired(tokenId));
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzzMintAmount(uint8 amount) public {
        vm.assume(amount > 0);
        
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, 0);
        
        vm.prank(minter);
        entitlements.mint(user1, tokenId, amount, "");
        
        assertEq(entitlements.balanceOf(user1, tokenId), amount);
    }

    function testFuzzExpiration(uint32 futureSeconds) public {
        vm.assume(futureSeconds > 0);
        vm.assume(futureSeconds < 365 days * 10); // Max 10 years
        
        uint256 expiration = block.timestamp + futureSeconds;
        
        vm.prank(admin);
        uint256 tokenId = entitlements.createEntitlement(AGENT_ID_1, "", true, expiration);
        
        vm.prank(minter);
        entitlements.mint(user1, tokenId, 1, "");
        
        // Should have access before expiration
        assertTrue(entitlements.hasAccess(user1, AGENT_ID_1));
        
        // Fast forward past expiration
        vm.warp(block.timestamp + futureSeconds + 1);
        
        // Should not have access after expiration
        assertFalse(entitlements.hasAccess(user1, AGENT_ID_1));
    }
}

