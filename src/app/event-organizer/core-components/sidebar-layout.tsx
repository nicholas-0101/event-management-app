"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Calendar,
  CreditCard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  UserCheck,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiCall } from "@/helper/axios";
import { clearAuthData } from "@/lib/auth-utils";

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/event-organizer",
    description: "Overview of your events",
  },
  {
    title: "Event Management",
    icon: Calendar,
    href: "/event-organizer/event-management",
    description: "Create, edit, and manage events",
    subItems: [
      { title: "All Events", href: "/event-organizer/event-management" },
      { title: "Create Event", href: "/event-organizer/event-creation" },
    ],
  },
  {
    title: "Transaction Management",
    icon: CreditCard,
    href: "/event-organizer/transaction-management",
    description: "Manage payment transactions",
    subItems: [
      {
        title: "All Transactions",
        href: "/event-organizer/transaction-management",
      },
      {
        title: "Pending Approval",
        href: "/event-organizer/pending-approval",
      },
    ],
  },
  {
    title: "Attendee Management",
    icon: UserCheck,
    href: "/event-organizer/attendees",
    description: "Manage event attendees",
  },
  {
    title: "Edit Profile",
    icon: Settings,
    href: "/event-organizer/edit-profile",
    description: "Update organizer account settings",
  },
];

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();

  const getProfilePicUrl = (pic?: string | null) => {
    if (!pic)
      return "https://i.pinimg.com/736x/1c/c5/35/1cc535901e32f18db87fa5e340a18aff.jpg";
    if (pic.startsWith("http")) return pic;
    return `https://event-management-api-sigma.vercel.app/${pic}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiCall.get("/auth/keep");
        const data = res.data.data || res.data;
        setProfilePicUrl(getProfilePicUrl(data?.profile_pic));
        setUsername(data?.username || "");
      } catch {
        const raw = localStorage.getItem("user");
        if (raw) {
          try {
            const u = JSON.parse(raw);
            setProfilePicUrl(getProfilePicUrl(u?.profile_pic));
            setUsername(u?.username || "");
          } catch {}
        }
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    clearAuthData();
    window.location.href = "/";
  };

  const toggleMenu = (title: string) => {
    setExpandedMenu((prev) => (prev === title ? null : title));
  };

  const isActive = (href: string) => {
    if (href === "/event-organizer") return pathname === href;
    return pathname.startsWith(href);
  };

  const isSubItemActive = (subItem: { title: string; href: string }) => {
    if (subItem.title === "All Events")
      return pathname === "/event-organizer/event-management";
    return isActive(subItem.href);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileOpen(false);
  };

  // Sidebar width constants
  const expandedW = "w-64";
  const collapsedW = "w-16";
  const expandedML = "lg:ml-64";
  const collapsedML = "lg:ml-16";

  return (
    <div className="min-h-screen bg-white">
      {/* ── Mobile hamburger ── */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md rounded-xl"
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* ── Mobile overlay ── */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen flex flex-col bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out",
          isCollapsed ? collapsedW : expandedW,
          // Mobile: slide in/out; Desktop: always visible
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-3 border-b border-gray-100 flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center space-x-2 overflow-hidden">
              <img src="/TicketNest-nobg.png" className="h-8 w-auto flex-shrink-0" alt="TicketNest" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("hidden lg:flex rounded-xl flex-shrink-0", isCollapsed && "mx-auto")}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isMenuActive = isActive(item.href);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenu === item.title;

            return (
              <div key={item.title}>
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      if (!isCollapsed) toggleMenu(item.title);
                      else handleNavigation(item.href);
                    } else {
                      handleNavigation(item.href);
                    }
                  }}
                  title={isCollapsed ? item.title : undefined}
                  className={cn(
                    "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                    isMenuActive
                      ? "bg-[#c6ee9a] text-[#09431C] font-semibold shadow-sm"
                      : "text-gray-700 hover:bg-[#c6ee9a]/50 hover:text-[#09431C]",
                    isCollapsed && "justify-center"
                  )}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.title}</span>
                      {hasSubItems && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 ml-1 transition-transform duration-200 flex-shrink-0",
                            isExpanded && "rotate-90"
                          )}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Sub-items */}
                {!isCollapsed && hasSubItems && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems?.map((subItem) => (
                      <button
                        key={subItem.href}
                        onClick={() => handleNavigation(subItem.href)}
                        className={cn(
                          "w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200",
                          isSubItemActive(subItem)
                            ? "bg-[#97d753]/70 text-[#09431C] font-semibold"
                            : "text-gray-600 hover:bg-[#c6ee9a]/40 hover:text-[#09431C]"
                        )}
                      >
                        <div className="w-2 h-2 bg-[#09431C] rounded-full mr-3 flex-shrink-0" />
                        {subItem.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer / Profile */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          {isCollapsed ? (
            /* Collapsed: just centered avatar */
            <div className="flex justify-center">
              <img
                src={profilePicUrl || "/TicketNest-nobg.png"}
                className="h-9 w-9 rounded-full object-cover border-2 border-gray-200"
                alt="Profile"
              />
            </div>
          ) : (
            /* Expanded: avatar + name + logout */
            <div className="flex items-center gap-3">
              <img
                src={profilePicUrl || "/TicketNest-nobg.png"}
                className="h-9 w-9 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                alt="Profile"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{username || "Organizer"}</p>
                <p className="text-xs text-gray-500 truncate">Event Organizer</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl p-2 flex-shrink-0"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
          {isCollapsed && (
            <div className="mt-2 flex justify-center">
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl p-2"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content — shifts with sidebar ── */}
      <main
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen bg-white",
          isCollapsed ? collapsedML : expandedML
        )}
      >
        {children}
      </main>
    </div>
  );
}
