import React from "react";

export function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-md">
      <table className={`w-full text-left text-sm text-slate-200 divide-y divide-slate-800 ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <thead className={`bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400 ${className}`}>{children}</thead>;
}

export function TableBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tbody className={`divide-y divide-slate-800/60 ${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tr className={`hover:bg-slate-800/40 transition-colors ${className}`}>{children}</tr>;
}

export function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th scope="col" className={`px-5 py-3.5 font-semibold text-slate-300 ${className}`}>{children}</th>;
}

export function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3.5 text-slate-200 whitespace-nowrap ${className}`}>{children}</td>;
}
