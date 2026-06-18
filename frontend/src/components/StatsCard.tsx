import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: string;
}

export default function StatsCard({ title, value, subtitle, icon, color }: StatsCardProps) {
  return (
    <div className="stats-card" style={color ? { borderTopColor: color } : undefined}>
      <div className="stats-card-header">
        <span className="stats-icon" style={color ? { color } : undefined}>{icon}</span>
        <span className="stats-title">{title}</span>
      </div>
      <div className="stats-value">{value}</div>
      {subtitle && <div className="stats-subtitle">{subtitle}</div>}
    </div>
  );
}
