"use client";

import React, { useState } from "react";
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
  Plus,
  BarChart3,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

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
      {
        title: "Create Event",
        href: "/event-organizer/event-management/create",
      },
      {
        title: "Event Analytics",
        href: "/event-organizer/event-management/analytics",
      },
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
        href: "/event-organizer/transaction-management?status=WAITING_CONFIRMATION",
      },
      {
        title: "Transaction Stats",
        href: "/event-organizer/transaction-management/stats",
      },
    ],
  },
  {
    title: "Attendee Management",
    icon: Users,
    href: "/event-organizer/attendees",
    description: "Manage event attendees",
  },
  {
    title: "Reports & Analytics",
    icon: BarChart3,
    href: "/event-organizer/reports",
    description: "View detailed reports",
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/event-organizer/documents",
    description: "Manage event documents",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/event-organizer/settings",
    description: "Account and app settings",
  },
];

export default function EOSidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/signin");
  };

  const toggleMenu = (title: string) => {
    if (expandedMenu === title) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(title);
    }
  };

  const isActive = (href: string) => {
    if (href === "/event-organizer") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div
          className={cn(
            "flex h-full flex-col bg-white border-r border-gray-200 shadow-lg",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-[#00481a]" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    Event Organizer
                  </h1>
                  <p className="text-xs text-gray-500">Dashboard</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex"
            >
              {isCollapsed ? (
                <Menu className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
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
                        toggleMenu(item.title);
                      } else {
                        handleNavigation(item.href);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      isMenuActive
                        ? "bg-[#c6ee9a] text-[#00481a] border-r-2 border-[#00481a]"
                        : "text-gray-700 hover:bg-[#c6ee9a] hover:text-[#00481a]",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon
                      className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")}
                    />
                    {!isCollapsed && (
                      <span className="flex-1 text-left">{item.title}</span>
                    )}
                    {!isCollapsed && hasSubItems && (
                      <div
                        className={cn(
                          "ml-auto transition-transform duration-200",
                          isExpanded ? "rotate-90" : ""
                        )}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </button>

                  {/* Sub Menu Items */}
                  {!isCollapsed && hasSubItems && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems?.map((subItem) => (
                        <button
                          key={subItem.href}
                          onClick={() => handleNavigation(subItem.href)}
                          className={cn(
                            "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                            isActive(subItem.href)
                              ? "bg-[#97d753] text-[#00481a]"
                              : "text-gray-600 hover:bg-[#c6ee9a] hover:text-[#00481a]"
                          )}
                        >
                          <div className="w-2 h-2 bg-[#00481a] rounded-full mr-3" />
                          {subItem.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className={cn(
                "w-full text-red-600 hover:text-red-700 hover:bg-red-50",
                isCollapsed && "justify-center"
              )}
            >
              <LogOut
                className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")}
              />
              {!isCollapsed && "Logout"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Spacer */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      />
    </>
  );
}

// Helper component for chevron icon
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
