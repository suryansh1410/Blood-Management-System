import { Droplet, Heart, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-medium text-slate-200">
          <div className="w-6 h-6 rounded-md bg-rose-600 flex items-center justify-center text-white shadow-xs shadow-rose-950/50">
            <Droplet className="w-3.5 h-3.5 fill-white" />
          </div>
          LifePulse Blood Management System &copy; 2026
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Role-Based Access Enforced
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Heart className="w-4 h-4 text-rose-400" />
            Every Unit Saves Lives
          </span>
        </div>
      </div>
    </footer>
  );
}
