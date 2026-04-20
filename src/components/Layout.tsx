import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  UserCircle,
  Clock,
  Calendar,
  IndianRupee,
  Plane,
  LogOut,
  Menu,
  X,
  Home,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.jpeg";
import api from "../api/axios";
import useOrganizationMenuSettings, {
  type OrganizationMenuSettings,
} from "../hooks/useOrganizationMenuSettings";
import { isMainPlatformAdmin, MAIN_PLATFORM_ADMIN_ROLE } from "../types/auth";

type AppUser = {
  role?: string;
  firstName?: string;
};

type NavigationSubItem = {
  name: string;
  href: string;
  show: () => boolean;
  icon?: typeof ClipboardCheck;
};

type NavigationItem = {
  name: string;
  href: string;
  icon: typeof ClipboardCheck;
  show: () => boolean;
  submenu?: NavigationSubItem[];
};

const toAbsoluteLogoUrl = (rawUrl: string) => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL_LOCAL || "").replace(/\/+$/, "");
  return `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

const getNavigation = (
  hasPermission: (action: string, subject: string) => boolean,
  user: AppUser | null | undefined,
  menuSettings: OrganizationMenuSettings
): NavigationItem[] => {
  const role = user?.role?.toLowerCase?.() || "";
  const isMainAdmin = isMainPlatformAdmin(user?.role);
  const adminSubmenu: NavigationSubItem[] = [
    {
      name: "Organizations",
      href: "/admin/organizations",
      show: () => isMainPlatformAdmin(user?.role),
    },
    {
      name: "Common Leave Policy",
      href: "/admin-leave/balance",
      show: () => hasPermission("manage", "leave-balance"),
    },
    {
      name: "Assign Manager",
      href: "/admin/assign-manager",
      show: () => hasPermission("manage", "employees"),
    },
    {
      name: "Manage Entities",
      href: "/admin/manage-entities",
      show: () => hasPermission("manage", "employees"),
    },
    {
      name: "Approval Hierarchy",
      href: "/admin/approval-hierarchy",
      show: () => hasPermission("manage", "settings"),
    },
    {
      name: "Project Management",
      href: "/project-management",
      icon: ClipboardCheck,
      show: () => hasPermission("manage", "projects"),
    },
  ];

  if (isMainAdmin) {
    return [
      { name: "Dashboard", href: "/dashboard", icon: Home, show: () => true },
      {
        name: "Organizations",
        href: "/admin/organizations",
        icon: ClipboardCheck,
        show: () => true,
      },
    ];
  }

  return [
  { name: "Dashboard", href: "/dashboard", icon: Home, show: () => true },
  {
    name: "Employee Management",
    href: "/employees",
    icon: Users,
    show: () => menuSettings.employeeManagementEnabled && hasPermission("read", "employees"),
  },
  // {
  //   name: "Manage Entities",
  //   href: "/admin/manage-entities",
  //   icon: ClipboardCheck,
  //   show: () => hasPermission("manage", "employees"),
  // },
  {
    name: "Self Service",
    href: "/self-service",
    icon: UserCircle,
    show: () => menuSettings.selfServiceEnabled,
  },
  {
    name: "Attendance",
    href: "/payroll/attendance",
    icon: ClipboardCheck,
    show: () =>
      menuSettings.attendanceEnabled &&
      ["hr", MAIN_PLATFORM_ADMIN_ROLE, "org_admin"].includes(user?.role?.toLowerCase?.() || ""),
  },
  {
    name: "Time Sheet",
    href: "/timesheet",
    icon: Clock,
    show: () => menuSettings.timesheetEnabled,
    submenu: [
      { name: "My Timesheet", href: "/timesheet", show: () => true },
      {
        name: "My Projects",
        href: "/timesheet/projects",
        show: () => true,
      },
      {
        name: "Submit Time",
        href: "/timesheet/submit",
        show: () => hasPermission("submit", "timesheet"),
      },
      {
        name: "Approvals",
        href: "/timesheet/approvals",
        show: () => hasPermission("approve", "timesheet"),
      },
    ],
  },
  {
    name: "Leave Management",
    href: "/leave",
    icon: Calendar,
    show: () => menuSettings.leaveManagementEnabled,
    submenu: [
      { name: "My Leave", href: "/leave", show: () => true },
      {
        name: "Request Leave",
        href: "/leave/request",
        show: () => hasPermission("submit", "leave"),
      },
      {
        name: "Holidays List",
        href: "/leave/holidays",
        show: () => true,
      },
      {
        name: "Approvals",
        href: "/leave/approvals",
        show: () => hasPermission("approve", "leave"),
      },
    ],
  },
  {
    name: "Holiday Management",
    href: "/admin/holidays",
    icon: Calendar,
    show: () =>
      menuSettings.holidayManagementEnabled &&
      ["hr", MAIN_PLATFORM_ADMIN_ROLE].includes(user?.role?.toLowerCase?.() || ""),
  },
  {
    name: "Payroll",
    href: "/payroll",
    icon: IndianRupee,
    show: () => menuSettings.payrollEnabled,
  },
  
  {
    name: "Travel & Expense",
    href: "/travel",
    icon: Plane,
    show: () => menuSettings.travelEnabled || menuSettings.expenseEnabled,
    submenu: [
      {
        name: "Overview",
        href: "/travel",
        show: () => menuSettings.travelEnabled || menuSettings.expenseEnabled,
      },
      { name: "New Trip", href: "/travel/new-trip", show: () => menuSettings.travelEnabled },
      { name: "Submit Expense", href: "/travel/submit-expense", show: () => menuSettings.expenseEnabled },
      {
        name: "Approvals",
        href: "/travel/approvals",
        show: () => (menuSettings.travelEnabled || menuSettings.expenseEnabled) && hasPermission("approve", "expenses"),
      },
    ],
  },
  {
    name: "Admin",
    href: "/admin-leave",
    icon: Calendar,
    show: () => adminSubmenu.some((item) => item.show()),
    submenu: adminSubmenu,
  },
];
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const { menuSettings } = useOrganizationMenuSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("");

  useEffect(() => {
    const loadOrganizationBranding = async () => {
      if (!user) {
        setOrganizationLogoUrl("");
        setOrganizationName("");
        return;
      }
      try {
        const response = await api.get("/api/organizations/current/branding");
        const logoFromApi = String(response.data?.logoUrl || "").trim();
        const orgNameFromApi = String(response.data?.organizationName || "").trim();
        setOrganizationLogoUrl(toAbsoluteLogoUrl(logoFromApi));
        setOrganizationName(orgNameFromApi);
      } catch {
        setOrganizationLogoUrl("");
        setOrganizationName("");
      }
    };

    loadOrganizationBranding();
  }, [user?.id]);

  const navigation = getNavigation(hasPermission, user, menuSettings);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSubmenu = (name: string) => {
    setExpandedItem(expandedItem === name ? null : name);
  };

  const isSubmenuActive = (submenu: NavigationSubItem[]) =>
    submenu.some((item) => location.pathname === item.href);

  return (
    <div className="app-shell">
      <div className="flex h-screen overflow-hidden p-2 sm:p-3">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform rounded-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="side-panel flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center p-1 rounded-lg w-full max-w-[170px]">
                <img
                  src={organizationLogoUrl || logo}
                  alt={organizationName || "ZenyraHR"}
                  className="h-14 w-full object-contain"
                />
              </div>
              <button
                className="md:hidden text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <nav className="space-y-1.5">
                {navigation.map((item) => {
                  if (item.show && !item.show()) return null;

                  const Icon = item.icon;
                  const isActive = item.submenu
                    ? isSubmenuActive(item.submenu)
                    : location.pathname === item.href;

                  return (
                    <div key={item.name}>
                      {item.submenu ? (
                        <>
                          <button
                            onClick={() => toggleSubmenu(item.name)}
                            className={`${
                              isActive
                                ? "bg-white/15 text-white shadow-sm"
                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                            } w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200`}
                          >
                            <Icon
                              className={`${
                                isActive
                                  ? "text-white"
                                  : "text-white/70 group-hover:text-white"
                              } mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200`}
                            />
                            {item.name}
                          </button>
                          {expandedItem === item.name && (
                            <div className="ml-4 mt-1 space-y-1">
                              {item.submenu.map((subItem) => {
                                if (subItem.show && !subItem.show())
                                  return null;

                                const isSubActive =
                                  location.pathname === subItem.href;
                                return (
                                  <Link
                                    key={subItem.name}
                                    to={subItem.href}
                                    className={`${
                                      isSubActive
                                        ? "bg-white/15 text-white"
                                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                                    } group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200`}
                                  >
                                    {subItem.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
                          to={item.href}
                          className={`${
                            isActive
                              ? "bg-white/15 text-white shadow-sm"
                              : "text-slate-300 hover:bg-white/10 hover:text-white"
                          } group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200`}
                        >
                          <Icon
                            className={`${
                              isActive
                                ? "text-white"
                                : "text-white/70 group-hover:text-white"
                            } mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200`}
                          />
                          {item.name}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center">
                <div className="relative">
                  <UserCircle className="h-9 w-9 text-white" />
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white dark:ring-gray-900"></span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user?.firstName}
                   
                  </p>
                  <p className="text-xs text-slate-300">{user?.role}</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={handleLogout}
                    className="p-2 text-white/70 transition-colors duration-200 hover:text-white"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden pl-0 md:pl-3">
          {/* Mobile top navigation */}
          <div className="top-nav z-10 md:hidden">
            <div className="px-4 sm:px-6">
              <div className="flex h-14 items-center">
                <button
                  type="button"
                  className="px-1 text-slate-500 focus:outline-none"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="page-surface p-4 sm:p-6">
                  <Outlet />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
