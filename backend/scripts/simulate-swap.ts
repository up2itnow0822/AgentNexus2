// Hardhat injects ethers globally when running with 'npx hardhat run'
// @ts-expect-error - Hardhat's type definitions don't export ethers, but it's available at runtime
import { ethers } from 'hardhat';

async function main() {
    console.log("🚀 Starting Forked Mainnet Simulation...");

    // 1. Setup: Impersonate a Whale to get funds
    const WHALE_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Binance Hot Wallet (Example)
    const impersonatedSigner = await ethers.getImpersonatedSigner(WHALE_ADDRESS);

    console.log(`🐳 Impersonating Whale: ${WHALE_ADDRESS}`);
    const balance = await ethers.provider.getBalance(WHALE_ADDRESS);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

    // 2. Define Swap Parameters (Uniswap V2 Router for simplicity in test)
    const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

    // Minimal Interface for Router & ERC20
    const IUniswapV2Router02 = [
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)"
    ];
    const IERC20 = [
        "function balanceOf(address account) external view returns (uint256)"
    ];

    const router = new ethers.Contract(UNISWAP_V2_ROUTER, IUniswapV2Router02, impersonatedSigner);

    // 3. Execute Swap: ETH -> USDC
    const amountIn = ethers.parseEther("1.0"); // 1 ETH
    const amountOutMin = 0; // Accept any slippage for test
    const path = [WETH, USDC];
    const to = WHALE_ADDRESS;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 mins

    console.log(`🔄 Swapping 1.0 ETH for USDC...`);

    const tx = await router.swapExactETHForTokens(
        amountOutMin,
        path,
        to,
        deadline,
        { value: amountIn }
    );

    console.log(`   Tx Hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Swap Confirmed! Gas Used: ${receipt?.gasUsed}`);

    // 4. Verify USDC Balance
    const usdc = new ethers.Contract(USDC, IERC20, impersonatedSigner);
    const usdcBalance = await usdc.balanceOf(WHALE_ADDRESS);
    console.log(`💰 New USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
}



main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

