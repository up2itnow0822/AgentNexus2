/**
 * AgentNexus Homepage
 * 
 * Landing page with hero section and featured agents
 */

export default function Home(): JSX.Element {
  return (
    <main className="min-h-screen p-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 text-center">
          Welcome to AgentNexus
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-8">
          Decentralized AI Agent Marketplace on Base L2
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">🤖 20+ AI Agents</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Browse curated AI agents for trading, analytics, DeFi, and more
            </p>
          </div>
          
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">💳 Easy Payments</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Purchase with ETH, USDC, or USDT using Account Abstraction
            </p>
          </div>
          
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">⚡ Instant Execution</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Execute agents in isolated Docker containers with real-time results
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <a
            href="/marketplace"
            className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Marketplace
          </a>
        </div>
      </div>
    </main>
  );
}

