// index.ts
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import { createNosanaClient, NosanaNetwork, address } from "@nosana/kit";
import type { NosanaClient, Address, JobState } from "@nosana/kit";

// Configuration schema
const ConfigSchema = Type.Object({
  network: Type.Optional(Type.Union([
    Type.Literal("mainnet"),
    Type.Literal("devnet")
  ], { description: "Solana network to connect to" })),
  rpcEndpoint: Type.Optional(Type.String({
    description: "Custom Solana RPC endpoint URL"
  })),
  commitment: Type.Optional(Type.Union([
    Type.Literal("processed"),
    Type.Literal("confirmed"),
    Type.Literal("finalized")
  ], { description: "Solana commitment level" })),
  ipfs: Type.Optional(Type.Object({
    api: Type.Optional(Type.String({ description: "IPFS API endpoint" })),
    jwt: Type.Optional(Type.String({ description: "IPFS JWT token" })),
    gateway: Type.Optional(Type.String({ description: "IPFS gateway URL" }))
  })),
  apiKey: Type.Optional(Type.String({
    description: "Nosana API key for authenticated requests"
  }))
});

// Helper function to create client based on config
function createClient(config: any = {}): NosanaClient {
  const network = config.network === "devnet"
    ? NosanaNetwork.DEVNET
    : NosanaNetwork.MAINNET;

  const clientConfig: any = {};

  if (config.rpcEndpoint || config.commitment) {
    clientConfig.solana = {
      ...(config.rpcEndpoint && { rpcEndpoint: config.rpcEndpoint }),
      ...(config.commitment && { commitment: config.commitment })
    };
  }

  if (config.ipfs) {
    clientConfig.ipfs = config.ipfs;
  }

  if (config.apiKey) {
    clientConfig.api = { apiKey: config.apiKey };
  }

  return createNosanaClient(network, clientConfig);
}

export default definePluginEntry({
  id: "nosana",
  name: "Nosana Network",
  description: "Interact with Nosana decentralized compute network on Solana - query jobs, markets, tokens, and manage compute resources",

  register(api) {
    // ========== JOB QUERY TOOLS ==========

    // Get a specific job by address
    api.registerTool({
      name: "nosana_get_job",
      description: "Get detailed information about a specific Nosana job by its address. Returns job state, market, node assignment, timeout, IPFS hashes, pricing, and run history.",
      parameters: Type.Object({
        jobAddress: Type.String({
          description: "The Solana address of the job to query"
        })
      }, { additionalProperties: false }),
      async execute(_id, params, ctx) {
        try {
          const client = createClient(ctx?.config);
          const job = await client.jobs.get(address(params.jobAddress));

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                address: params.jobAddress,
                state: job.state,
                market: job.market,
                node: job.node || null,
                price: job.price.toString(),
                timeout: job.timeout,
                ipfsJob: job.ipfsJob,
                ipfsResult: job.ipfsResult || null,
                project: job.project || null,
                runs: job.runs
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error fetching job: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    });

    // List/query jobs with filters
    api.registerTool({
      name: "nosana_list_jobs",
      description: "List and filter Nosana jobs. Can filter by job state (queued, running, stopped, done, etc.), market address, node address, or project. Returns an array of matching jobs with their details.",
      parameters: Type.Object({
        state: Type.Optional(Type.String({
          description: "Filter by job state: 'queued', 'running', 'stopped', 'done', 'completed', 'failed', or 'cancelled'"
        })),
        market: Type.Optional(Type.String({
          description: "Filter by market address"
        })),
        node: Type.Optional(Type.String({
          description: "Filter by node address"
        })),
        project: Type.Optional(Type.String({
          description: "Filter by project address"
        })),
        limit: Type.Optional(Type.Number({
          description: "Maximum number of jobs to return",
          minimum: 1,
          maximum: 100
        }))
      }, { additionalProperties: false }),
      async execute(_id, params, ctx) {
        try {
          const client = createClient(ctx?.config);

          const filters: any = {};
          if (params.state) filters.state = params.state;
          if (params.market) filters.market = address(params.market);
          if (params.node) filters.node = address(params.node);
          if (params.project) filters.project = address(params.project);

          let jobs = await client.jobs.all(filters);

          if (params.limit) {
            jobs = jobs.slice(0, params.limit);
          }

          const jobsData = jobs.map(job => ({
            address: job.address,
            state: job.state,
            market: job.market,
            node: job.node || null,
            price: job.price.toString(),
            timeout: job.timeout,
            ipfsJob: job.ipfsJob,
            ipfsResult: job.ipfsResult || null,
            project: job.project || null
          }));

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                total: jobs.length,
                filters: params,
                jobs: jobsData
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error listing jobs: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    });

    // Get job run details
    api.registerTool({
      name: "nosana_get_run",
      description: "Get detailed information about a specific job run by its address. Returns run state, timestamps, node, result IPFS hash, and execution metadata.",
      parameters: Type.Object({
        runAddress: Type.String({
          description: "The Solana address of the run to query"
        })
      }, { additionalProperties: false }),
      async execute(_id, params, ctx) {
        try {
          const client = createClient(ctx?.config);
          const run = await client.jobs.run(address(params.runAddress));

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                address: params.runAddress,
                state: run.state,
                job: run.job,
                node: run.node,
                time: run.time,
                ipfsResult: run.ipfsResult || null
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error fetching run: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    });

    // ========== MARKET TOOLS ==========

    // Get market details
    api.registerTool({
      name: "nosana_get_market",
      description: "Get detailed information about a specific Nosana market by its address. Returns market configuration including job price, timeout settings, node stake requirements, and queue statistics.",
      parameters: Type.Object({
        marketAddress: Type.String({
          description: "The Solana address of the market to query"
        })
      }, { additionalProperties: false }),
      async execute(_id, params, ctx) {
        try {
          const client = createClient(ctx?.config);
          const market = await client.jobs.market(address(params.marketAddress));

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                address: params.marketAddress,
                jobPrice: market.jobPrice.toString(),
                jobTimeout: market.jobTimeout,
                jobExpiration: market.jobExpiration,
                nodeStakeMinimum: market.nodeStakeMinimum.toString(),
                queueType: market.queueType,
                vault: market.vault,
                jobsTotal: market.jobsTotal
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error fetching market: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    });

    // List all markets
    api.registerTool({
      name: "nosana_list_markets",
      description: "List all available Nosana markets. Returns an array of all markets with their configuration details, pricing, and requirements.",
      parameters: Type.Object({}, { additionalProperties: false }),
      async execute(_id, params, ctx) {
        try {
          const client = createClient(ctx?.config);
          const markets = await client.jobs.markets();

          const marketsData = markets.map(market => ({
            address: market.address,
            jobPrice: market.jobPrice.toString(),
            jobTimeout: market.jobTimeout,
            jobExpiration: market.jobExpiration,
            nodeStakeMinimum: market.nodeStakeMinimum.toString(),
            queueType: market.queueType,
            jobsTotal: market.jobsTotal
          }));

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                total: markets.length,
                markets: marketsData
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error listing markets: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    });

    // ========== TOKEN & BALANCE TOOLS ==========

    // Get NOS token balance
    api.registerTool({
      name: "nosana_get_balance",
      description: "Get the NOS token balance for a specific Solana wallet address. Returns the balance in NOS tokens.",
      parameters: Type.Object({
        walletAddress: Type.String({
          description: "The Solana wallet address to check balance for"
        })
      }, { additionalProperties: false }),
      async execute(_id, params, ctx) {
        try {
          const client = createClient(ctx?.config);
          const balance = await client.nos.getBalance(address(params.walletAddress));

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                walletAddress: params.walletAddress,
                balance: balance.toString(),
                balanceNOS: (Number(balance) / 1e6).toFixed(6) + " NOS"
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error fetching balance: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    });

    // Get all token holders
    api.registerTool({
      name: "nosana_get_token_holders",
      description: "Get a list of all NOS token holders with their balances. Useful for analyzing token distribution and identifying major holders.",
      parameters: Type.Object({
        limit: Type.Optional(Type.Number({
          description: "Maximum number of holders to return",
          minimum: 1,
          maximum: 1000
        }))
      }, { additionalProperties: false }),
      async execute(_id, params, ctx) {
        try {
          const client = createClient(ctx?.config);
          let holders = await client.nos.getAllTokenHolders();

          if (params.limit) {
            holders = holders.slice(0, params.limit);
          }

          const holdersData = holders.map(holder => ({
            address: holder.address,
            balance: holder.amount.toString(),
            balanceNOS: (Number(holder.amount) / 1e6).toFixed(6) + " NOS"
          }));

          const totalBalance = holders.reduce((sum, h) => sum + Number(h.amount), 0);

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                total: holders.length,
                totalBalance: totalBalance.toString(),
                totalBalanceNOS: (totalBalance / 1e6).toFixed(6) + " NOS",
                holders: holdersData
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error fetching token holders: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    });

    // ========== STAKING TOOLS ==========

    // Get stake account details
    api.registerTool({
      name: "nosana_get_stake",
      description: "Get detailed information about a specific stake account by its address. Returns staking amount, node association, and staking status.",
      parameters: Type.Object({
        stakeAddress: Type.String({
          description: "The Solana address of the stake account to query"
        })
      }, { additionalProperties: false }),
      async execute(_id, params, ctx) {
        try {
          const client = createClient(ctx?.config);
          const stake = await client.stake.get(address(params.stakeAddress));

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                address: params.stakeAddress,
                amount: stake.amount.toString(),
                amountNOS: (Number(stake.amount) / 1e6).toFixed(6) + " NOS",
                authority: stake.authority,
                node: stake.node || null,
                xnos: stake.xnos || null
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error fetching stake: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    });

    // List all stakes
    api.registerTool({
      name: "nosana_list_stakes",
      description: "List all stake accounts in the Nosana network. Returns an array of all stakes with amounts and node associations. Useful for analyzing network staking distribution.",
      parameters: Type.Object({
        limit: Type.Optional(Type.Number({
          description: "Maximum number of stakes to return",
          minimum: 1,
          maximum: 500
        }))
      }, { additionalProperties: false }),
      async execute(_id, params, ctx) {
        try {
          const client = createClient(ctx?.config);
          let stakes = await client.stake.all();

          if (params.limit) {
            stakes = stakes.slice(0, params.limit);
          }

          const stakesData = stakes.map(stake => ({
            address: stake.address,
            amount: stake.amount.toString(),
            amountNOS: (Number(stake.amount) / 1e6).toFixed(6) + " NOS",
            authority: stake.authority,
            node: stake.node || null
          }));

          const totalStaked = stakes.reduce((sum, s) => sum + Number(s.amount), 0);

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                total: stakes.length,
                totalStaked: totalStaked.toString(),
                totalStakedNOS: (totalStaked / 1e6).toFixed(6) + " NOS",
                stakes: stakesData
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error listing stakes: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    });

    // ========== NETWORK STATISTICS ==========

    // Get network overview
    api.registerTool({
      name: "nosana_network_stats",
      description: "Get comprehensive statistics about the Nosana network including total jobs, markets, stakes, and token distribution. Provides a high-level overview of network activity.",
      parameters: Type.Object({}, { additionalProperties: false }),
      async execute(_id, params, ctx) {
        try {
          const client = createClient(ctx?.config);

          // Gather stats in parallel
          const [jobs, markets, stakes, holders] = await Promise.all([
            client.jobs.all({}),
            client.jobs.markets(),
            client.stake.all(),
            client.nos.getAllTokenHolders()
          ]);

          // Compute aggregates
          const totalStaked = stakes.reduce((sum, s) => sum + Number(s.amount), 0);
          const totalTokens = holders.reduce((sum, h) => sum + Number(h.amount), 0);

          const jobsByState = jobs.reduce((acc: any, job) => {
            acc[job.state] = (acc[job.state] || 0) + 1;
            return acc;
          }, {});

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                network: ctx?.config?.network || "mainnet",
                timestamp: new Date().toISOString(),
                jobs: {
                  total: jobs.length,
                  byState: jobsByState
                },
                markets: {
                  total: markets.length,
                  averagePrice: markets.length > 0
                    ? (markets.reduce((sum, m) => sum + Number(m.jobPrice), 0) / markets.length / 1e6).toFixed(6) + " NOS"
                    : "0 NOS"
                },
                staking: {
                  totalAccounts: stakes.length,
                  totalStaked: totalStaked.toString(),
                  totalStakedNOS: (totalStaked / 1e6).toFixed(6) + " NOS"
                },
                tokens: {
                  totalHolders: holders.length,
                  totalSupply: totalTokens.toString(),
                  totalSupplyNOS: (totalTokens / 1e6).toFixed(6) + " NOS"
                }
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error fetching network stats: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    });
  }
});
