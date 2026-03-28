# Nosana OpenClaw Plugin

An OpenClaw plugin that integrates the Nosana decentralized compute network on Solana. This plugin provides AI agents with tools to query jobs, markets, tokens, stakes, and network statistics from the Nosana Network.

## Features

### Job Operations
- **nosana_get_job** - Get detailed information about a specific job
- **nosana_list_jobs** - List and filter jobs by state, market, node, or project
- **nosana_get_run** - Get execution details for a specific job run

### Market Operations
- **nosana_get_market** - Get market configuration and statistics
- **nosana_list_markets** - List all available markets

### Token & Balance
- **nosana_get_balance** - Get NOS token balance for a wallet
- **nosana_get_token_holders** - List all NOS token holders with balances

### Staking
- **nosana_get_stake** - Get stake account details
- **nosana_list_stakes** - List all stake accounts in the network

### Network Analytics
- **nosana_network_stats** - Get comprehensive network statistics (jobs, markets, stakes, tokens)

## Installation

### For Development

1. Install dependencies:
```bash
bun install
```

2. Install the plugin locally in OpenClaw:
```bash
openclaw plugins install -l .
```

3. Enable the plugin in your OpenClaw config:
```json5
{
  "plugins": {
    "entries": {
      "nosana": {
        "enabled": true,
        "config": {
          "network": "mainnet",
          "commitment": "confirmed"
        }
      }
    }
  }
}
```

4. Restart OpenClaw gateway:
```bash
openclaw gateway restart
```

### For Production

1. Update package.json with your details and make it public

2. Publish to npm:
```bash
npm publish
```

3. Install via OpenClaw:
```bash
openclaw plugins install @nosanaai/openclaw
```

## Configuration

Configure the plugin in your OpenClaw config file:

```json5
{
  "plugins": {
    "entries": {
      "nosana": {
        "enabled": true,
        "config": {
          // Network selection (default: "mainnet")
          "network": "mainnet",  // or "devnet"

          // Custom RPC endpoint (optional)
          "rpcEndpoint": "https://api.mainnet-beta.solana.com",

          // Solana commitment level (optional)
          "commitment": "confirmed",  // "processed", "confirmed", or "finalized"

          // IPFS configuration (optional)
          "ipfs": {
            "api": "https://api.pinata.cloud",
            "jwt": "your-pinata-jwt-token",
            "gateway": "https://gateway.pinata.cloud/ipfs/"
          },

          // Nosana API key (optional, for authenticated requests)
          "apiKey": "your-nosana-api-key"
        }
      }
    }
  }
}
```

## Usage Examples

### Query Running Jobs

Ask your AI agent:
```
Show me all running jobs on Nosana
```

The agent will use `nosana_list_jobs` with state filter:
```json
{
  "state": "running",
  "limit": 10
}
```

### Get Network Statistics

Ask your AI agent:
```
What's the current state of the Nosana network?
```

The agent will use `nosana_network_stats` to fetch comprehensive statistics.

### Check Token Balance

Ask your AI agent:
```
What's the NOS token balance for wallet <address>?
```

The agent will use `nosana_get_balance` with the wallet address.

### Analyze Markets

Ask your AI agent:
```
Show me all available Nosana markets and their prices
```

The agent will use `nosana_list_markets` to fetch all markets.

## Tool Reference

### nosana_get_job
Get detailed information about a specific job.

**Parameters:**
- `jobAddress` (string) - The Solana address of the job

**Returns:**
Job details including state, market, node, price, timeout, IPFS hashes, and run history.

### nosana_list_jobs
List and filter jobs.

**Parameters:**
- `state` (optional string) - Filter by state: 'queued', 'running', 'stopped', 'done', etc.
- `market` (optional string) - Filter by market address
- `node` (optional string) - Filter by node address
- `project` (optional string) - Filter by project address
- `limit` (optional number) - Max results (1-100)

**Returns:**
Array of jobs matching the filters.

### nosana_get_run
Get execution details for a job run.

**Parameters:**
- `runAddress` (string) - The Solana address of the run

**Returns:**
Run state, job, node, timestamps, and result IPFS hash.

### nosana_get_market
Get market details.

**Parameters:**
- `marketAddress` (string) - The Solana address of the market

**Returns:**
Market configuration including price, timeout, stake requirements, and statistics.

### nosana_list_markets
List all markets.

**Parameters:** None

**Returns:**
Array of all markets with their configurations.

### nosana_get_balance
Get NOS token balance.

**Parameters:**
- `walletAddress` (string) - The Solana wallet address

**Returns:**
Balance in raw tokens and formatted NOS.

### nosana_get_token_holders
List all NOS token holders.

**Parameters:**
- `limit` (optional number) - Max holders to return (1-1000)

**Returns:**
Array of token holders with balances and total supply statistics.

### nosana_get_stake
Get stake account details.

**Parameters:**
- `stakeAddress` (string) - The Solana address of the stake account

**Returns:**
Stake amount, authority, node association, and xNOS details.

### nosana_list_stakes
List all stake accounts.

**Parameters:**
- `limit` (optional number) - Max stakes to return (1-500)

**Returns:**
Array of stakes with total staking statistics.

### nosana_network_stats
Get comprehensive network statistics.

**Parameters:** None

**Returns:**
Complete overview including:
- Total jobs by state
- Market statistics and average prices
- Total staked NOS
- Token distribution
- Timestamp and network info

## Development

### Project Structure

```
nosana_openclaw/
├── index.ts           # Main plugin entry point
├── package.json       # Package configuration
├── README.md          # This file
└── bun.lockb          # Bun lock file
```

### Building

The plugin uses TypeScript and is executed directly by OpenClaw. No build step is required.

### Testing

1. Install the plugin locally
2. Use OpenClaw CLI to test tools:

```bash
# Check plugin status
openclaw plugins inspect nosana

# List available plugins
openclaw plugins list

# Test in OpenClaw
openclaw chat
> Show me Nosana network stats
```

## Requirements

- OpenClaw CLI installed
- Node.js 20.18.0+ (or Bun)
- TypeScript 5.3.0+
- Solana wallet (optional, for write operations)

## Resources

- [Nosana Kit](https://github.com/nosana-ci/nosana-kit) - Official Nosana SDK
- [Nosana Docs](https://docs.nosana.com) - Nosana Network documentation
- [OpenClaw Docs](https://docs.claude.com/en/docs/claude-code) - OpenClaw documentation
- [Solana Docs](https://docs.solana.com) - Solana blockchain documentation

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Support

For issues with:
- **This plugin**: Open an issue in this repository
- **Nosana Kit**: See [nosana-kit issues](https://github.com/nosana-ci/nosana-kit/issues)
- **OpenClaw**: See [OpenClaw documentation](https://docs.claude.com/en/docs/claude-code)
