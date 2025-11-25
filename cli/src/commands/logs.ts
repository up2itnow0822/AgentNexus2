import { Command } from 'commander';
import chalk from 'chalk';

export const logsCommand = new Command('logs')
    .description('Stream logs from your agent')
    .argument('[agentId]', 'Agent ID to stream logs from')
    .action(async (agentId) => {
        if (!agentId) {
            console.log(chalk.yellow('Please provide an agent ID (or run inside agent directory)'));
            return;
        }

        console.log(chalk.blue(`Streaming logs for agent ${agentId}...\n`));

        // Mock log stream
        const logs = [
            '[INFO] Agent started',
            '[INFO] Connected to network',
            '[TASK] Received new task: "Analyze market data"',
            '[THOUGHT] Fetching data from CoinGecko...',
            '[ACTION] HTTP GET https://api.coingecko.com/...'
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i >= logs.length) {
                clearInterval(interval);
                return;
            }
            console.log(chalk.gray(new Date().toISOString()), logs[i]);
            i++;
        }, 800);
    });
