import { AgentRuntime, Character } from "@elizaos/core";
import { TwitterPlugin } from "@elizaos/plugin-twitter";
import discordPlugin from "@elizaos/plugin-discord";
import { PrismaClient } from "@prisma/client";
import { Agent } from "@prisma/client";

export class ElizaAgentService {
    private prisma: PrismaClient;
    private activeRuntimes: Map<string, AgentRuntime> = new Map();

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Converts a database Agent record into an ELIZAOS Character
     */
    private mapAgentToCharacter(agent: Agent): Character {
        // Parse configuration from JSON fields
        const config = (agent as any).configuration || {};

        return {
            name: agent.name,
            bio: Array.isArray(config.bio) ? config.bio : [agent.description],
            lore: Array.isArray(config.lore) ? config.lore : [],
            knowledge: Array.isArray(config.knowledge) ? config.knowledge : [],
            messageExamples: Array.isArray(config.messageExamples) ? config.messageExamples : [],
            style: config.style || {},
            topics: config.topics || [],
            adjectives: config.adjectives || [],
            clients: config.clients || [],
            plugins: [], // Plugins handled separately
            modelProvider: "openai", // Defaulting to OpenAI for now
            settings: {
                secrets: {
                    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
                    // Add other secrets as needed
                },
                voice: config.voice || { model: "en_US-male-medium" },
            },
        } as Character;
    }

    /**
     * Starts an ELIZAOS runtime for a given agent
     */
    async startAgent(agentId: string): Promise<boolean> {
        if (this.activeRuntimes.has(agentId)) {
            console.log(`Agent ${agentId} is already running.`);
            return true;
        }

        const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        console.log(`Starting ELIZAOS runtime for agent: ${agent.name}`);

        const character = this.mapAgentToCharacter(agent);

        // Initialize Plugins based on configuration
        const plugins = [];
        const config = (agent as any).configuration || {};

        if (config.clients?.includes("twitter") && process.env.TWITTER_USERNAME) {
            plugins.push(TwitterPlugin);
        }
        if (config.clients?.includes("discord") && process.env.DISCORD_API_TOKEN) {
            plugins.push(discordPlugin);
        }

        try {
            const runtime = new AgentRuntime({
                character,
                plugins: plugins as any[],
                adapter: {} as any, // Use default/memory adapter for now
                // Add token if required by specific providers, though we put it in secrets above
            });

            // Store the runtime
            this.activeRuntimes.set(agentId, runtime);

            // In a real implementation, we might need to call a start() method if exposed,
            // or the runtime starts processing upon initialization/events.
            // ELIZAOS runtime usually needs an external loop or event trigger.
            // For the pilot, we just instantiate it.

            console.log(`Agent ${agent.name} started successfully.`);
            return true;
        } catch (error) {
            console.error(`Failed to start agent ${agent.name}:`, error);
            return false;
        }
    }

    /**
     * Stops an agent runtime
     */
    async stopAgent(agentId: string): Promise<boolean> {
        const runtime = this.activeRuntimes.get(agentId);
        if (!runtime) return false;

        // Perform any cleanup if necessary
        this.activeRuntimes.delete(agentId);
        console.log(`Stopped agent ${agentId}`);
        return true;
    }

    /**
     * Get status of an agent
     */
    getAgentStatus(agentId: string): 'running' | 'stopped' {
        return this.activeRuntimes.has(agentId) ? 'running' : 'stopped';
    }
}
