import { PostHog } from 'posthog-node';

export interface UserEvent {
  userId: string;
  eventType: string;
  properties: Record<string, any>;
  timestamp?: Date;
}

export interface AgentExecution {
  executionId: string;
  agentId: string;
  userId: string;
  input: any;
  output: any;
  duration: number;
  success: boolean;
  error?: string;
  chain?: string;
  gasUsed?: number;
  cost?: number;
  timestamp?: Date;
}

import { PrismaClient } from '@prisma/client';

export class AnalyticsService {
  private posthog: PostHog;

  constructor(
    private prisma: PrismaClient,
    apiKey?: string,
    host?: string
  ) {
    this.posthog = new PostHog(
      apiKey || process.env.POSTHOG_API_KEY || 'phc_placeholder',
      {
        host: host || process.env.POSTHOG_HOST || 'https://app.posthog.com',
        requestTimeout: 10000,
        maxCacheSize: 1000,
      }
    );
  }

  // ... (keep existing methods)

  /**
   * Get analytics dashboard data (for internal use)
   */
  async getDashboardData(timeRange: string = '7d'): Promise<any> {
    try {
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      if (timeRange === '24h') startDate.setHours(now.getHours() - 24);
      else if (timeRange === '30d') startDate.setDate(now.getDate() - 30);
      else startDate.setDate(now.getDate() - 7); // Default 7d

      const [
        totalUsers,
        newUsers,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        executionStats
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { createdAt: { gte: startDate } } }),
        this.prisma.execution.count(),
        this.prisma.execution.count({ where: { status: 'COMPLETED' } }),
        this.prisma.execution.count({ where: { status: 'FAILED' } }),
        this.prisma.execution.aggregate({
          _avg: { duration: true },
          where: { status: 'COMPLETED' }
        })
      ]);

      // Calculate retention (mock for now as it requires complex query)
      const retentionRate = 0;

      return {
        timeRange,
        userMetrics: {
          totalUsers,
          newUsers,
          activeUsers: totalUsers, // simplified
          retentionRate,
        },
        agentMetrics: {
          totalExecutions,
          successfulExecutions,
          failedExecutions,
          averageExecutionTime: executionStats._avg.duration || 0,
          topAgents: await this.getTopAgents(5),
        },
        funnelMetrics: {
          signupToWallet: 0,
          walletToFirstExecution: 0,
        },
        grantMetrics: {
          milestonesCompleted: 0,
          currentPhase: 'week1',
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get top agents by execution count
   */
  private async getTopAgents(limit: number): Promise<any[]> {
    try {
      const topAgents = await this.prisma.execution.groupBy({
        by: ['agentId'],
        _count: {
          agentId: true,
        },
        orderBy: {
          _count: {
            agentId: 'desc',
          },
        },
        take: limit,
      });

      // Fetch agent details
      const agentIds = topAgents.map(a => a.agentId);
      const agents = await this.prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, category: true }
      });

      return topAgents.map(item => {
        const agent = agents.find(a => a.id === item.agentId);
        return {
          id: item.agentId,
          name: agent?.name || 'Unknown Agent',
          category: agent?.category || 'Uncategorized',
          executions: item._count.agentId,
        };
      });
    } catch (error) {
      console.error('Error fetching top agents:', error);
      return [];
    }
  }

  /**
   * Flush any pending analytics events
   */
  async flush(): Promise<void> {
    try {
      await this.posthog.flush();
    } catch (error) {
      console.error('Failed to flush analytics:', error);
    }
  }

  /**
   * Shutdown analytics service
   */
  async shutdown(): Promise<void> {
    try {
      await this.posthog.shutdown();
    } catch (error) {
      console.error('Failed to shutdown analytics:', error);
    }
  }
}
