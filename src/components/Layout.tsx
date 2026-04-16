import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  UserCircle,
  Clock,
  Calendar,
  IndianRupee,
  Plane,
  UserPlus,
  LogOut,
  Bell,
  Menu,
  X,
  Home,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.jpeg";
import api from "../api/axios";

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

type OrganizationMenuSettings = {
  employeeManagementEnabled: boolean;
  selfServiceEnabled: boolean;
  attendanceEnabled: boolean;
  timesheetEnabled: boolean;
  recruitmentEnabled: boolean;
  leaveManagementEnabled: boolean;
  holidayManagementEnabled: boolean;
  payrollEnabled: boolean;
  travelEnabled: boolean;
  expenseEnabled: boolean;
};

type ApprovalNotificationItem = {
  key: string;
  label: string;
  count: number;
  href: string;
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
  const isMainAdmin = role === "admin";
  const adminSubmenu: NavigationSubItem[] = [
    {
      name: "Organizations",
      href: "/admin/organizations",
      show: () => (user?.role?.toLowerCase?.() || "") === "admin",
    },
    {
      name: "Service Requests",
      href: "/admin/service-requests",
      show: () => hasPermission("read", "service-tickets"),
    },
    // {
    //   name: "Employee Leave Requests",
    //   href: "/admin-leave/requests",
    //   show: () => hasPermission("approve", "leave"),
    // },
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
    name: "Job Openings",
    href: "/job-openings",
    icon: UserPlus,
    show: () => menuSettings.recruitmentEnabled && !hasPermission("read", "employees"),
  },
  {
    name: "Recruitment",
    href: "/recruitment",
    icon: UserPlus,
    show: () => menuSettings.recruitmentEnabled && hasPermission("read", "employees"),
    submenu: [
      { name: "Job Postings", href: "/recruitment", show: () => true },
      { name: "Referral Requests", href: "/recruitment/referrals", show: () => role === "hr" },
    ],
  },
  {
    name: "Attendance",
    href: "/payroll/attendance",
    icon: ClipboardCheck,
    show: () =>
      menuSettings.attendanceEnabled &&
      ["hr", "admin", "org_admin"].includes(user?.role?.toLowerCase?.() || ""),
  },
  {
    name: "Time Sheet",
    href: "/timesheet",
    icon: Clock,
    show: () => menuSettings.timesheetEnabled,
    submenu: [
      { name: "My Timesheet", href: "/timesheet", show: () => true },
      {
        name: "Submit Time",
        href: "/timesheet/submit",
        show: () => hasPermission("submit", "timesheet"),
      },
      {
        name: "Approvals",
        href: "/timesheet/approvals",
        show: () => hasPermission("approve", "timesheet") && hasPermission("manage", "employees"),
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
      ["hr", "admin"].includes(user?.role?.toLowerCase?.() || ""),
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [menuSettings, setMenuSettings] = useState<OrganizationMenuSettings>({
    employeeManagementEnabled: true,
    selfServiceEnabled: true,
    attendanceEnabled: true,
    timesheetEnabled: true,
    recruitmentEnabled: true,
    leaveManagementEnabled: true,
    holidayManagementEnabled: true,
    payrollEnabled: true,
    travelEnabled: true,
    expenseEnabled: true,
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [approvalNotifications, setApprovalNotifications] = useState<ApprovalNotificationItem[]>([]);
  const [newApprovalToast, setNewApprovalToast] = useState<{ delta: number } | null>(null);
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("");
  const previousNotificationCountRef = useRef<number | null>(null);

  useEffect(() => {
    const role = user?.role?.toLowerCase?.() || "";
    if (!user || role === "admin") {
      setMenuSettings({
        employeeManagementEnabled: true,
        selfServiceEnabled: true,
        attendanceEnabled: true,
        timesheetEnabled: true,
        recruitmentEnabled: true,
        leaveManagementEnabled: true,
        holidayManagementEnabled: true,
        payrollEnabled: true,
        travelEnabled: true,
        expenseEnabled: true,
      });
      return;
    }
    const loadMenuSettings = async () => {
      try {
        const response = await api.get("/api/organizations/current/menu-settings");
        setMenuSettings({
          employeeManagementEnabled: response.data?.employeeManagementEnabled !== false,
          selfServiceEnabled: response.data?.selfServiceEnabled !== false,
          attendanceEnabled: response.data?.attendanceEnabled !== false,
          timesheetEnabled: response.data?.timesheetEnabled !== false,
          recruitmentEnabled: response.data?.recruitmentEnabled !== false,
          leaveManagementEnabled: response.data?.leaveManagementEnabled !== false,
          holidayManagementEnabled: response.data?.holidayManagementEnabled !== false,
          payrollEnabled: response.data?.payrollEnabled !== false,
          travelEnabled: response.data?.travelEnabled !== false,
          expenseEnabled: response.data?.expenseEnabled !== false,
        });
      } catch {
        setMenuSettings({
          employeeManagementEnabled: true,
          selfServiceEnabled: true,
          attendanceEnabled: true,
          timesheetEnabled: true,
          recruitmentEnabled: true,
          leaveManagementEnabled: true,
          holidayManagementEnabled: true,
          payrollEnabled: true,
          travelEnabled: true,
          expenseEnabled: true,
        });
      }
    };
    loadMenuSettings();
  }, [user?.id, user?.role]);

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

  useEffect(() => {
    const fetchApprovalNotifications = async () => {
      if (!user?.id) {
        setApprovalNotifications([]);
        setNotificationCount(0);
        return;
      }

      const canApproveLeave = menuSettings.leaveManagementEnabled && hasPermission("approve", "leave");
      const canApproveTimesheet = menuSettings.timesheetEnabled && hasPermission("approve", "timesheet");
      const canApproveTravel = menuSettings.travelEnabled && hasPermission("approve", "travel");
      const canApproveExpenses = menuSettings.expenseEnabled && hasPermission("approve", "expenses");

      if (!canApproveLeave && !canApproveTimesheet && !canApproveTravel && !canApproveExpenses) {
        setApprovalNotifications([]);
        setNotificationCount(0);
        return;
      }

      const requests: Promise<unknown>[] = [];
      const keys: string[] = [];
      const addRequest = (key: string, request: Promise<unknown>) => {
        keys.push(key);
        requests.push(request);
      };

      if (canApproveLeave) addRequest("leave", api.get("/api/leave-requests"));
      if (canApproveTimesheet) addRequest("timesheet", api.get("/api/timesheet"));
      if (canApproveTravel) addRequest("travel", api.get("/api/travel-requests/pending"));
      if (canApproveExpenses) addRequest("expense", api.get("/api/expenses/pending"));

      try {
        const settled = await Promise.allSettled(requests);
        const responseByKey: Record<string, any> = {};
        settled.forEach((result, index) => {
          if (result.status === "fulfilled") {
            responseByKey[keys[index]] = result.value;
          }
        });

        const items: ApprovalNotificationItem[] = [];
        if (responseByKey.leave?.data) {
          const rows = Array.isArray(responseByKey.leave.data) ? responseByKey.leave.data : [];
          const pendingCount = rows.filter((row: any) => {
            const status = String(row?.status || "").toUpperCase();
            const revokePending = Boolean(row?.revocationRequested) && status === "APPROVED";
            return status === "PENDING" || status === "REVOCATION_PENDING" || revokePending;
          }).length;
          if (pendingCount > 0) {
            items.push({ key: "leave", label: "Leave approvals", count: pendingCount, href: "/leave/approvals" });
          }
        }

        if (responseByKey.timesheet?.data) {
          const rows = Array.isArray(responseByKey.timesheet.data) ? responseByKey.timesheet.data : [];
          const pendingCount = rows.filter((row: any) => {
            const status = String(row?.status || "").toUpperCase();
            return status === "PENDING" || status === "SUBMITTED";
          }).length;
          if (pendingCount > 0) {
            items.push({ key: "timesheet", label: "Timesheet approvals", count: pendingCount, href: "/timesheet/approvals" });
          }
        }

        if (responseByKey.travel?.data) {
          const rows = Array.isArray(responseByKey.travel.data) ? responseByKey.travel.data : [];
          if (rows.length > 0) {
            items.push({ key: "travel", label: "Travel approvals", count: rows.length, href: "/travel/approvals" });
          }
        }

        if (responseByKey.expense?.data) {
          const rows = Array.isArray(responseByKey.expense.data) ? responseByKey.expense.data : [];
          if (rows.length > 0) {
            items.push({ key: "expense", label: "Expense approvals", count: rows.length, href: "/travel/approvals" });
          }
        }

        setApprovalNotifications(items);
        setNotificationCount(items.reduce((sum, item) => sum + item.count, 0));
      } catch {
        setApprovalNotifications([]);
        setNotificationCount(0);
      }
    };

    fetchApprovalNotifications();
    const interval = setInterval(fetchApprovalNotifications, 30000);
    return () => clearInterval(interval);
  }, [
    user?.id,
    hasPermission,
    menuSettings.leaveManagementEnabled,
    menuSettings.timesheetEnabled,
    menuSettings.travelEnabled,
    menuSettings.expenseEnabled,
  ]);

  useEffect(() => {
    setIsNotificationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const previous = previousNotificationCountRef.current;
    if (previous != null && notificationCount > previous) {
      const delta = notificationCount - previous;
      setNewApprovalToast({ delta });
      const timer = setTimeout(() => setNewApprovalToast(null), 3500);
      return () => clearTimeout(timer);
    }
    previousNotificationCountRef.current = notificationCount;
    return;
  }, [notificationCount]);

  useEffect(() => {
    previousNotificationCountRef.current = notificationCount;
  }, [approvalNotifications.length, notificationCount]);

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
      {newApprovalToast && (
        <div className="fixed right-5 top-5 z-[70] rounded-xl border border-sky-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur">
          <p className="text-xs font-semibold text-sky-700">
            +{newApprovalToast.delta} new approval{newApprovalToast.delta > 1 ? "s" : ""}
          </p>
          <p className="text-[11px] text-slate-600">Review pending requests in notifications.</p>
        </div>
      )}
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
                  {approvalNotifications.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsNotificationOpen((prev) => !prev)}
                        className="relative p-2 text-white/70 transition-colors duration-200 hover:text-white"
                        title="Approval notifications"
                      >
                        <Bell className="h-5 w-5" />
                        {notificationCount > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </span>
                        )}
                      </button>
                      {isNotificationOpen && (
                        <div className="absolute bottom-10 right-0 z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Pending approvals
                          </p>
                          <div className="mt-1 space-y-1">
                            {approvalNotifications.map((item) => (
                              <Link
                                key={item.key}
                                to={item.href}
                                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <span>{item.label}</span>
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                                  {item.count}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
