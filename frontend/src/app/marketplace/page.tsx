'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';

export default function MarketplacePage() {
    const [activeTab, setActiveTab] = useState<'agents' | 'tokens'>('agents');

    // Mock Data for Agent Tokens
    const agentTokens = [
        { id: 1, name: 'NexusQuant', symbol: 'NQT', price: '0.045 ETH', change: '+12.5%', volume: '125 ETH' },
        { id: 2, name: 'NexusFarmer', symbol: 'NXF', price: '0.022 ETH', change: '-3.2%', volume: '45 ETH' },
        { id: 3, name: 'PrivacyGuardian', symbol: 'PRV', price: '0.015 ETH', change: '+5.8%', volume: '28 ETH' },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-cyan-500 selection:text-white">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                        Agent Marketplace
                    </h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('agents')}
                            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'agents' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Browse Agents
                        </button>
                        <button
                            onClick={() => setActiveTab('tokens')}
                            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'tokens' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Trade Tokens (IAO)
                        </button>
                    </div>
                </div>

                {activeTab === 'agents' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Placeholder for existing agent cards */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-cyan-500 transition-all">
                            <h3 className="text-xl font-bold mb-2">NexusQuant</h3>
                            <p className="text-gray-400 mb-4">Autonomous DeFi trading agent specializing in arbitrage.</p>
                            <Button variant="default" className="w-full">View Details</Button>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-cyan-500 transition-all">
                            <h3 className="text-xl font-bold mb-2">NexusFarmer</h3>
                            <p className="text-gray-400 mb-4">Yield farming optimization across Aave and Compound.</p>
                            <Button variant="default" className="w-full">View Details</Button>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-cyan-500 transition-all">
                            <h3 className="text-xl font-bold mb-2">PrivacyGuardian</h3>
                            <p className="text-gray-400 mb-4">Protects your wallet from malicious contracts and drainers.</p>
                            <Button variant="default" className="w-full">View Details</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-gray-800 rounded-xl p-6 border border-purple-500/30">
                            <h2 className="text-2xl font-bold mb-4 text-purple-400">Initial Agent Offerings (IAO)</h2>
                            <p className="text-gray-300 mb-6">
                                Invest in the future revenue of high-performing autonomous agents.
                                Buy tokens early on the bonding curve.
                            </p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-400 border-b border-gray-700">
                                            <th className="pb-3">Agent</th>
                                            <th className="pb-3">Symbol</th>
                                            <th className="pb-3">Price</th>
                                            <th className="pb-3">24h Change</th>
                                            <th className="pb-3">Volume</th>
                                            <th className="pb-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {agentTokens.map((token) => (
                                            <tr key={token.id} className="group hover:bg-gray-700/50 transition-colors">
                                                <td className="py-4 font-medium text-white">{token.name}</td>
                                                <td className="py-4 text-purple-400">{token.symbol}</td>
                                                <td className="py-4">{token.price}</td>
                                                <td className={`py-4 ${token.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                                    {token.change}
                                                </td>
                                                <td className="py-4 text-gray-400">{token.volume}</td>
                                                <td className="py-4">
                                                    <Button variant="secondary" size="sm" className="bg-purple-600 hover:bg-purple-500 border-none text-white">
                                                        Trade
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
