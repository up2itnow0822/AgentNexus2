import OpenAI from 'openai';
import { VectorMemory } from '../memory/VectorMemory';
import { AgentZeroAdapter } from './AgentZeroAdapter';
import { WalletService } from '../WalletService';

interface Tool {
    name: string;
    description: string;
    execute: (input: string) => Promise<string>;
}

export class AgentZero {
    private openai: OpenAI;
    private memory: VectorMemory;
    private adapter: AgentZeroAdapter;
    private walletService: WalletService;
    private tools: Tool[];

    constructor(
        memory: VectorMemory,
        adapter: AgentZeroAdapter,
        walletService: WalletService
    ) {
        this.memory = memory;
        this.adapter = adapter;
        this.walletService = walletService;
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        this.tools = [
            {
                name: 'check_wallet',
                description: 'Check your own wallet balance and address. No input required.',
                execute: async () => {
                    // In a real implementation, we'd get the agent's specific TBA address
                    // For now, we'll use a deterministic address based on agent-zero ID
                    const address = await this.walletService.getAgentAddress('agent-zero');
                    const balance = await this.walletService.getBalance(address);
                    return `Address: ${address}\nBalance: ${balance} ETH`;
                }
            },
            {
                name: 'code_interpreter',
                description: 'Execute Python code. Input should be valid Python code.',
                execute: async (code: string) => {
                    // Check balance before expensive operation
                    const address = await this.walletService.getAgentAddress('agent-zero');
                    const balance = await this.walletService.getBalance(address);
                    if (parseFloat(balance) < 0.001) {
                        throw new Error("Insufficient funds to execute code. Please request funding.");
                    }

                    const result = await this.adapter.execute({
                        userId: 'system',
                        agentId: 'agent-zero',
                        prompt: code,
                        tier: 'PRO'
                    });
                    return result.response || 'No output';
                }
            },
            {
                name: 'search_memory',
                description: 'Search long-term memory for information. Input is a query string.',
                execute: async (query: string) => {
                    const results = await this.memory.searchMemories('agent-zero', query);
                    return results.map(r => r.content).join('\n');
                }
            }
        ];
    }

    async run(userId: string, prompt: string): Promise<string> {
        // 0. Autonomous Check: Ensure solvency
        const address = await this.walletService.getAgentAddress('agent-zero');
        const balance = await this.walletService.getBalance(address);

        if (parseFloat(balance) < 0.005) {
            console.warn(`[AgentZero] Low balance (${balance} ETH). Requesting funds.`);
            // In a real system, this might trigger a notification or a specific "Request Funds" tool
        }

        // 1. Retrieve Context
        const memories = await this.memory.searchMemories('agent-zero', prompt);
        const context = memories.map(m => m.content).join('\n');

        const systemPrompt = `
You are Agent Zero, an advanced AI capable of reasoning, using tools, and managing your own finances.
Your Wallet Address: ${address}
Your Current Balance: ${balance} ETH

You have access to the following tools:

${this.tools.map(t => `${t.name}: ${t.description}`).join('\n')}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do (including checking your budget)
Action: the action to take, should be one of [${this.tools.map(t => t.name).join(', ')}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Context from memory:
${context}
`;

        let messages: any[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Question: ${prompt}` }
        ];

        let steps = 0;
        const maxSteps = 10;

        while (steps < maxSteps) {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages,
                stop: ['Observation:']
            });

            const content = response.choices[0].message?.content || '';
            console.log(`[Step ${steps}] Agent: ${content}`);
            messages.push({ role: 'assistant', content });

            // Parse Action
            const actionMatch = content.match(/Action: (.*)/);
            const inputMatch = content.match(/Action Input: ([\s\S]*)/);

            if (content.includes('Final Answer:')) {
                const finalAnswer = content.split('Final Answer:')[1].trim();

                // Save interaction to memory
                await this.memory.createMemory('agent-zero', userId, `User: ${prompt}\nAgent: ${finalAnswer}`);

                return finalAnswer;
            }

            if (actionMatch && inputMatch) {
                const action = actionMatch[1].trim();
                const input = inputMatch[1].trim();

                const tool = this.tools.find(t => t.name === action);
                if (tool) {
                    console.log(`Executing tool ${action} with input: ${input}`);
                    try {
                        const observation = await tool.execute(input);
                        messages.push({ role: 'user', content: `Observation: ${observation}` });
                    } catch (e) {
                        messages.push({ role: 'user', content: `Observation: Error executing tool: ${e}` });
                    }
                } else {
                    messages.push({ role: 'user', content: `Observation: Tool ${action} not found.` });
                }
            } else {
                // No action found, maybe just thinking or malformed
                messages.push({ role: 'user', content: `Observation: Please specify an Action and Action Input, or Final Answer.` });
            }

            steps++;
        }

        return "I reached the maximum number of steps without finding a final answer.";
    }
}
