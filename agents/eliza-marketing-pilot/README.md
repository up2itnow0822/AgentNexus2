# NexusGrowth (ELIZAOS Pilot)

This is a pilot implementation of the **Social Growth Manager** agent using the **ELIZAOS** framework.

## Overview
NexusGrowth is an autonomous marketing agent designed to:
-   Manage Twitter/X engagement.
-   Interact with users on Discord.
-   Analyze crypto trends and post insights.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Create a `.env` file with the following:
    ```env
    OPENAI_API_KEY=sk-...
    TWITTER_USERNAME=...
    TWITTER_PASSWORD=...
    TWITTER_EMAIL=...
    DISCORD_API_TOKEN=...
    ```

3.  **Run the Agent**:
    ```bash
    npm start
    ```

## Architecture
-   **Framework**: ELIZAOS (@elizaos/core)
-   **Character**: `marketing.character.json`
-   **Plugins**: Twitter, Discord
