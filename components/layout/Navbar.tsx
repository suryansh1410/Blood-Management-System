"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Droplet,
  Menu,
  X,
  Bell,
  LogOut,
  User,
  Heart,
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
import { Badge } from "@/components/ui/Badge";

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
    { href: "/blood-availability", label: "Blood Availability" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/become-a-donor", label: "Become a Donor" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const donorLinks = [
    { href: "/donor/dashboard", label: "Dashboard", icon: Activity },
    { href: "/donor/donations/new", label: "Record Donation", icon: PlusCircle },
    { href: "/donor/donations", label: "My History", icon: Calendar },
    { href: "/donor/availability", label: "Availability", icon: CheckCircle },
    { href: "/donor/profile", label: "Profile", icon: User },
    { href: "/donor/notifications", label: "Notifications", icon: Bell },
  ];

  const patientLinks = [
    { href: "/patient/dashboard", label: "Dashboard", icon: Activity },
    { href: "/patient/requests/new", label: "Request Blood", icon: PlusCircle },
    { href: "/patient/requests", label: "My Requests", icon: FileText },
    { href: "/patient/search", label: "Search Stock", icon: Search },
    { href: "/patient/profile", label: "Profile", icon: User },
    { href: "/patient/notifications", label: "Notifications", icon: Bell },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Activity },
    { href: "/admin/inventory", label: "Blood Stock", icon: Layers },
    { href: "/admin/requests", label: "Requests", icon: FileText },
    { href: "/admin/donations", label: "Donations", icon: Heart },
    { href: "/admin/donors", label: "Donors", icon: Users },
    { href: "/admin/patients", label: "Patients", icon: Building2 },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
  ];

  let currentNavLinks = publicNavLinks;
  let notificationsUrl = "/login";
  if (role === "DONOR") {
    currentNavLinks = donorLinks;
    notificationsUrl = "/donor/notifications";
  } else if (role === "PATIENT") {
    currentNavLinks = patientLinks;
    notificationsUrl = "/patient/notifications";
  } else if (role === "ADMIN") {
    currentNavLinks = adminLinks;
    notificationsUrl = "/admin/notifications";
  }

  const roleBadge = (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
        role === "ADMIN"
          ? "bg-purple-100 text-purple-800"
          : role === "DONOR"
          ? "bg-rose-100 text-rose-800"
          : "bg-teal-100 text-teal-800"
      }`}
    >
      {role}
    </span>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-rose-200 group-hover:scale-105 transition-transform">
                <Droplet className="w-6 h-6 fill-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                  Life<span className="text-rose-600">Pulse</span>
                </span>
                <span className="text-[10px] text-slate-600 font-medium tracking-wide uppercase block leading-none">
                  Blood Management
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {currentNavLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-100 text-teal-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </a>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-900 block leading-tight">
                      {user?.name || "User"}
                    </span>
                    <div className="mt-0.5">{roleBadge}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
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
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
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
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2">
          {status === "authenticated" && (
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
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
                  ? "bg-teal-50 text-teal-700 font-bold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </a>
          ))}

          <div className="pt-4 border-t border-slate-100">
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
