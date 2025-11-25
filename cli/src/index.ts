#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { deployCommand } from './commands/deploy';
import { logsCommand } from './commands/logs';

const program = new Command();

program
    .name('nexus')
    .description('AgentNexus Developer CLI')
    .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(deployCommand);
program.addCommand(logsCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
