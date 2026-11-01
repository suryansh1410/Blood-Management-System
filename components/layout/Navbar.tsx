"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Droplet,
  Menu,
  X,
  Bell,
  LogOut,
  User,
  Activity,
  Layers,
  Users,
  Building2,
  FileText,
  BarChart3,
  Search,
  PlusCircle,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = session?.user as { id: string; role: string; name?: string; email?: string } | undefined;
  const role = user?.role;

  // Poll or fetch unread notifications count
  useEffect(() => {
    if (status === "authenticated") {
      const fetchNotifs = async () => {
        try {
          const res = await fetch("/api/notifications");
          if (res.ok) {
            const data = await res.json();
            const unread = data.data.filter((n: any) => !n.isRead).length;
            setUnreadCount(unread);
          }
        } catch {
          // Silent ignore
        }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 15000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const publicNavLinks = [
    { href: "/", label: "Home" },
    { href: "/emergency", label: "Emergency Request", isEmergency: true },
    { href: "/donors/finder", label: "Nearby Donors" },
    { href: "/heatmap", label: "Network Heatmap" },
    { href: "/inventory/live", label: "Live Stock" },
    { href: "/appointments/book", label: "Book Appointment" },
    { href: "/track", label: "Track Request" },
  ];

  const donorLinks = [
    { href: "/donor/dashboard", label: "Dashboard", icon: Activity },
    { href: "/appointments/book", label: "Book Appointment", icon: Calendar },
    { href: "/donor/alerts", label: "Emergency Alerts", icon: Bell },
    { href: "/donors/finder", label: "Nearby Donors", icon: Users },
    { href: "/heatmap", label: "Heatmap", icon: Search },
    { href: "/donor/donations", label: "My History", icon: Calendar },
    { href: "/donor/profile", label: "Profile & Privacy", icon: User },
  ];

  const patientLinks = [
    { href: "/patient/dashboard", label: "Dashboard", icon: Activity },
    { href: "/emergency", label: "Emergency Request", icon: PlusCircle, isEmergency: true },
    { href: "/track", label: "Track Request", icon: FileText },
    { href: "/donors/finder", label: "Nearby Donors", icon: Users },
    { href: "/heatmap", label: "Network Heatmap", icon: Search },
    { href: "/patient/requests", label: "My Requests", icon: FileText },
    { href: "/patient/profile", label: "Profile", icon: User },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Overview", icon: BarChart3 },
    { href: "/inventory/live", label: "Live Inventory", icon: Layers },
    { href: "/admin/requests", label: "Emergency Requests", icon: FileText },
    { href: "/admin/appointments", label: "Appointments", icon: Calendar },
    { href: "/donors/finder", label: "Donor Finder", icon: Users },
    { href: "/heatmap", label: "Network Map", icon: Search },
    { href: "/admin/reports", label: "Audit Log", icon: FileText },
  ];

  const hospitalLinks = [
    { href: "/inventory/live", label: "Live Inventory", icon: Layers },
    { href: "/admin/requests", label: "Emergency Requests", icon: FileText },
    { href: "/admin/appointments", label: "Appointments", icon: Calendar },
    { href: "/donors/finder", label: "Nearby Donors", icon: Users },
    { href: "/heatmap", label: "Network Map", icon: Search },
  ];

  const currentNavLinks =
    role === "ADMIN"
      ? adminLinks
      : role === "HOSPITAL"
      ? hospitalLinks
      : role === "DONOR"
      ? donorLinks
      : role === "PATIENT"
      ? patientLinks
      : publicNavLinks;

  const notificationsUrl =
    role === "ADMIN" || role === "HOSPITAL"
      ? "/admin/notifications"
      : role === "DONOR"
      ? "/donor/notifications"
      : "/patient/notifications";

  const roleBadge = role && (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
        role === "ADMIN"
          ? "bg-purple-950/80 text-purple-300 border border-purple-800"
          : role === "DONOR"
          ? "bg-rose-950/80 text-rose-300 border border-rose-800"
          : "bg-teal-950/80 text-teal-300 border border-teal-800"
      }`}
    >
      {role}
    </span>
  );

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-rose-950/50 group-hover:scale-105 transition-transform">
                <Droplet className="w-6 h-6 fill-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white block leading-tight">
                  Life<span className="text-rose-500">Pulse</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase block leading-none">
                  Blood Management
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {currentNavLinks.map((item) => {
              const isActive = pathname === item.href;
              const isEmerg = (item as any).isEmergency;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isEmerg
                      ? "bg-rose-600 hover:bg-rose-500 text-white font-extrabold shadow-sm shadow-rose-950 flex items-center gap-1.5 animate-pulse"
                      : isActive
                      ? "bg-slate-800 text-teal-400 font-semibold"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {status === "authenticated" ? (
              <div className="flex items-center gap-3">
                <a
                  href={notificationsUrl}
                  className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </a>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-200 block leading-tight">
                      {user?.name || "User"}
                    </span>
                    <div className="mt-0.5">{roleBadge}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a href="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </a>
                <a href="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </a>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {status === "authenticated" && (
              <a
                href={notificationsUrl}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </a>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top-2">
          {status === "authenticated" && (
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
              <div>
                <p className="font-semibold text-slate-100">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              {roleBadge}
            </div>
          )}

          {currentNavLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-base font-medium ${
                pathname === item.href
                  ? "bg-slate-800 text-teal-400 font-bold"
                  : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              {item.label}
            </a>
          ))}

          <div className="pt-4 border-t border-slate-800">
            {status === "authenticated" ? (
              <Button
                variant="danger"
                size="md"
                className="w-full justify-center gap-2"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <a href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full">
                    Sign In
                  </Button>
                </a>
                <a href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full">
                    Register
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
