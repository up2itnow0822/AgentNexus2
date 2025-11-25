import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';

export const initCommand = new Command('init')
    .description('Initialize a new AgentNexus project')
    .action(async () => {
        console.log(chalk.blue.bold('\n🚀 Initialize new AgentNexus Agent\n'));

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of your agent?',
                default: 'my-agent',
                validate: (input: string) => /^[a-z0-9-]+$/.test(input) || 'Name must be lowercase, numbers, and hyphens only'
            },
            {
                type: 'list',
                name: 'template',
                message: 'Which template would you like to use?',
                choices: ['TypeScript (Node.js)', 'Python', 'ELIZAOS (Recommended)']
            }
        ]);

        const spinner = ora('Creating project structure...').start();

        try {
            const projectPath = path.join(process.cwd(), answers.name);

            if (fs.existsSync(projectPath)) {
                spinner.fail(chalk.red(`Directory ${answers.name} already exists`));
                return;
            }

            await fs.ensureDir(projectPath);

            // Create basic files
            await fs.writeJSON(path.join(projectPath, 'nexus.json'), {
                name: answers.name,
                version: '0.1.0',
                template: answers.template,
                dockerImage: `${answers.name}:latest`
            }, { spaces: 2 });

            await fs.writeFile(path.join(projectPath, 'Dockerfile'),
                `FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]
`);

            spinner.succeed(chalk.green(`Successfully created agent project in ./${answers.name}`));
            console.log('\nNext steps:');
            console.log(chalk.cyan(`  cd ${answers.name}`));
            console.log(chalk.cyan('  nexus deploy'));

        } catch (error) {
            spinner.fail(chalk.red('Failed to create project'));
            console.error(error);
        }
    });
