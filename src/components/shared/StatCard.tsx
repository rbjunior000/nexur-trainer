import type { ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
}

/** Single stat cell used in workout summary screens. */
export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={`bg-gray-800 rounded-xl p-3 text-center ${className ?? ''}`}>
      {icon && <div className="flex justify-center mb-1 text-gray-400">{icon}</div>}
      <p className="text-white font-bold text-lg tabular-nums leading-tight">{value}</p>
      <p className="text-gray-500 text-[10px] uppercase font-bold mt-0.5">{label}</p>
    </div>
  );
}
