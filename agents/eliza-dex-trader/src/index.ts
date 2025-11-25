import { AgentRuntime, Character } from "@elizaos/core";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import evmPlugin from "@elizaos/plugin-evm";
import solanaPlugin from "@elizaos/plugin-solana";

dotenv.config();

async function main() {
    console.log("Starting NexusTrader (ELIZAOS DEX Agent)...");

    // Load character
    const characterPath = path.join(__dirname, "../dex.character.json");
    const characterData = JSON.parse(fs.readFileSync(characterPath, "utf-8"));

    // Validate and cast to Character type
    const character = {
        ...characterData,
        modelProvider: "openai",
        settings: {
            ...characterData.settings,
            secrets: {
                ...characterData.settings?.secrets,
                OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            },
        },
    } as Character;

    // Initialize Runtime
    const runtime = new AgentRuntime({
        character,
        plugins: [
            evmPlugin,
            solanaPlugin
        ].filter(Boolean) as any[],
        adapter: {} as any,
    });

    console.log("NexusTrader initialized. Ready to swap.");
}

main().catch((error) => {
    console.error("Failed to start agent:", error);
    process.exit(1);
});
