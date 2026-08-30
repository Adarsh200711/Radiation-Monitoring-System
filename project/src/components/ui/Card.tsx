import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', onClick }: CardProps) {
  return (
    <div onClick={onClick} className={`border-b border-slate-800 px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardProps) {
  return <h3 className={`text-base font-semibold text-slate-100 ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '', onClick }: CardProps) {
  return (
    <div onClick={onClick} className={`p-5 ${className}`}>
      {children}
    </div>
  );
}
