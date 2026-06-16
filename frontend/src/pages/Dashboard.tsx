import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import * as api from '../api';
import StatsCard from '../components/StatsCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDay(d: string) {
  const date = new Date(d + 'T00:00:00');
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export default function Dashboard() {
  const { tenant } = useAuth();
  const [graphStats, setGraphStats] = useState<api.GraphStats | null>(null);
  const [kbCount, setKbCount] = useState(0);
  const [routeCount, setRouteCount] = useState(0);
  const [roleCount, setRoleCount] = useState(0);
  const [overview, setOverview] = useState<api.UsageOverview | null>(null);
  const [dailyData, setDailyData] = useState<api.DailyUsagePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [stats, kb, routes, roles, ov, daily] = await Promise.all([
          api.getGraphStats().catch(() => null),
          api.getKnowledgeBase().catch<api.KBEntry[]>(() => []),
          api.getRoutes().catch<api.RouteEntry[]>(() => []),
          api.getRoles().catch<api.RoleEntry[]>(() => []),
          api.getUsageOverview().catch(() => null),
          api.getDailyUsage(30).catch(() => null),
        ]);
        setGraphStats(stats);
        setKbCount(kb.length);
        setRouteCount(routes.length);
        setRoleCount(roles.length);
        if (ov) setOverview(ov);
        if (daily) setDailyData(daily.data);
      } catch {
        // Partial data is fine
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const neo4jConnected = graphStats && !graphStats.message;

  // Build chart data from real daily usage
  const chartData = dailyData.map((d) => ({
    month: formatDay(d.date),
    messages: d.messages,
    tokens: d.tokens,
  }));

  const hasUsage = chartData.some((d) => d.messages > 0);

  const quotaPercent = overview?.current_month?.percent_used ?? 0;
  const quotaColor =
    quotaPercent > 90 ? '#ef4444' : quotaPercent > 70 ? '#f59e0b' : '#10b981';

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <StatsCard
          title="Plan"
          value={tenant?.plan || 'Free'}
          subtitle={`${(tenant?.monthly_message_quota || 0).toLocaleString()} msgs/mo`}
          icon="📋"
          color="#6366f1"
        />
        <StatsCard
          title="This Month"
          value={(overview?.current_month?.total_messages ?? 0).toLocaleString()}
          subtitle={`${quotaPercent}% of quota used`}
          icon="📊"
          color={quotaColor}
        />
        <StatsCard
          title="Messages (30d)"
          value={(overview?.range?.total_messages ?? 0).toLocaleString()}
          subtitle={`${overview?.range?.successful ?? 0} successful`}
          icon="💬"
          color="#06b6d4"
        />
        <StatsCard
          title="Tokens (30d)"
          value={(overview?.range?.total_tokens ?? 0).toLocaleString()}
          subtitle={`≈ $${(overview?.range?.total_cost_usd ?? 0).toFixed(4)}`}
          icon="🔤"
          color="#10b981"
        />
        <StatsCard
          title="Knowledge Base"
          value={kbCount}
          subtitle="Trained pages"
          icon="📚"
          color="#f59e0b"
        />
        <StatsCard
          title="Routes"
          value={routeCount}
          subtitle="Registered paths"
          icon="🗺️"
          color="#8b5cf6"
        />
        <StatsCard
          title="Roles"
          value={roleCount}
          subtitle="User roles configured"
          icon="👤"
          color="#ec4899"
        />
        <StatsCard
          title="Lifetime"
          value={(overview?.lifetime?.total_messages ?? 0).toLocaleString()}
          subtitle={`${(overview?.lifetime?.total_tokens ?? 0).toLocaleString()} tokens total`}
          icon="🏆"
          color="#6366f1"
        />
        {neo4jConnected && (
          <>
            <StatsCard
              title="Graph Roles"
              value={graphStats!.roles}
              subtitle="Neo4j"
              icon="🔷"
              color="#8b5cf6"
            />
            <StatsCard
              title="Graph Pages"
              value={graphStats!.pages}
              subtitle="Neo4j"
              icon="📄"
              color="#ec4899"
            />
          </>
        )}
      </div>

      <div className="dashboard-chart-section">
        <h2 className="section-title">Daily Messages (Last 30 Days)</h2>
        <div className="chart-card">
          {!hasUsage ? (
            <div className="chart-empty">
              <span className="chart-empty-icon">📊</span>
              <p>No usage data yet. Start sending messages to see your daily usage chart here.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  fontSize={12}
                  interval="preserveStartEnd"
                />
                <YAxis stroke="#9ca3af" fontSize={13} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar
                  dataKey="messages"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="dashboard-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <a href="/api-keys" className="action-card">
            <span className="action-icon">🔑</span>
            <span className="action-label">Manage API Keys</span>
          </a>
          <a href="/knowledge-base" className="action-card">
            <span className="action-icon">📚</span>
            <span className="action-label">Train a Page</span>
          </a>
          <a href="/routes" className="action-card">
            <span className="action-icon">🗺️</span>
            <span className="action-label">Manage Routes</span>
          </a>
          <a href="/settings" className="action-card">
            <span className="action-icon">⚙️</span>
            <span className="action-label">Settings</span>
          </a>
        </div>
      </div>
    </div>
  );
}
