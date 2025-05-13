import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  UserCircle,
  Clock,
  Calendar,
  DollarSign,
  BarChart3,
  GraduationCap,
  Target,
  Plane,
  Heart,
  UserPlus,
  LogOut,
  Menu,
  X,
  Home,
  ClipboardCheck,
  Bell,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import NotificationCenter from "./NotificationCenter";
import Settings from "./Settings";
import logo from "../assets/image.png";
import axios from "axios";
import dayjs from "dayjs";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

const getNavigation = (
  hasPermission: (action: string, subject: string) => boolean
) => [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  {
    name: "Employee Management",
    href: "/employees",
    icon: Users,
    show: () => hasPermission("read", "employees"),
  },
  { name: "Self Service", href: "/self-service", icon: UserCircle },
  {
    name: "Job Openings",
    href: "/job-openings",
    icon: UserPlus,
    show: () => !hasPermission("read", "employees"), // Show for regular employees
  },
  {
    name: "Recruitment",
    href: "/recruitment",
    icon: UserPlus,
    show: () => hasPermission("read", "employees"), // Show for HR/managers
    submenu: [
      { name: "Job Postings", href: "/recruitment" },
      { name: "Referral Requests", href: "/recruitment/referrals" },
    ],
  },

  {
    name: "Time & Attendance",
    href: "/timesheet",
    icon: Clock,
    submenu: [
      { name: "My Timesheet", href: "/timesheet" },
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
    submenu: [
      { name: "My Leave", href: "/leave" },
      {
        name: "Request Leave",
        href: "/leave/request",
        show: () => hasPermission("submit", "leave"),
      },
      {
        name: "Approvals",
        href: "/leave/approvals",
        show: () => hasPermission("approve", "leave") && hasPermission("manage", "employees"),
      },
    ],
  },

  // {
  //   name: "HR Analytics",
  //   href: "/analytics",
  //   icon: BarChart3,
  //   show: () => hasPermission("read", "analytics"),
  // },
  // {
  //   name: "Performance",
  //   href: "/performance",
  //   icon: Target,
  //   show: () => hasPermission("manage", "performance"),
  // },
  {
    name: "Travel & Expense",
    href: "/travel",
    icon: Plane,
    submenu: [
      { name: "Overview", href: "/travel" },
      { name: "New Trip", href: "/travel/new-trip" },
      { name: "Submit Expense", href: "/travel/submit-expense" },
      {
        name: "Approvals",
        href: "/travel/approvals",
        show: () => hasPermission("approve", "expenses"),
      },
    ],
  },
  // { name: "Wellness", href: "/wellness", icon: Heart },

  // NEW: Admin Leave Management Section
  {
    name: "Admin",
    href: "/admin-leave",
    icon: Calendar,
    show: () => hasPermission("manage", "admin-leave"), // Only show to admins
    submenu: [
      {
        name: "Service Requests",
        href: "/admin/service-requests",
        show: () => hasPermission("read", "service-tickets"),
      },
      {
        name: "Employee Leave Requests",
        href: "/admin-leave/requests",
        show: () => hasPermission("approve", "leave"),
      },
      {
        name: "Leave Balance Management",
        href: "/admin-leave/balance",
        show: () => hasPermission("manage", "leave-balance"),
      },
      // {
      //   name: "Leave Policies",
      //   href: "/admin-leave/policies",
      //   show: () => hasPermission("manage", "leave-policies"),
      // },
      {
        name: "Leave Types Management", // ✅ New Leave Types Page
        href: "/admin-leave/types",
        show: () => hasPermission("manage", "leave-types"),
      },

      // ✅ Assign Manager Feature
      {
        name: "Assign Manager",
        href: "/admin/assign-manager",
        show: () => hasPermission("manage", "employees"),
      },

      {
        name: "Manange Entities",
        href: "/admin/manage-entities",
        show: () => hasPermission("manage", "employees"),
      },
      {
        name: "Project Management",
        href: "/project-management",
        icon: ClipboardCheck,
        show: () => hasPermission("manage", "projects"),
      },
    ],
  },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const navigation = getNavigation(hasPermission);

  const fetchNotificationCount = async () => {
    if (!user?.id) return;
    
    try {
      const endpoints = [
        // User's own requests
        axios.get(`${API_BASE_URL}/api/leave-requests/employee/${user.id}`),
        axios.get(`${API_BASE_URL}/api/travel-requests/employee/${user.id}`),
        axios.get(`${API_BASE_URL}/api/expenses/employee/${user.id}`),
        axios.get(`${API_BASE_URL}/api/timesheet/employee/${user.id}`)
      ];

      // Add approval requests if user has permission
      if (hasPermission('approve', 'leave')) {
        endpoints.push(axios.get(`${API_BASE_URL}/api/leave-requests`));
      }
      if (hasPermission('approve', 'travel') || hasPermission('approve', 'expenses')) {
        endpoints.push(axios.get(`${API_BASE_URL}/api/travel-requests`));
        endpoints.push(axios.get(`${API_BASE_URL}/api/expenses`));
      }
      if (hasPermission('approve', 'timesheet')) {
        endpoints.push(axios.get(`${API_BASE_URL}/api/timesheet`));
      }

      // Add referral notifications for HR and admin
      if (hasPermission('read', 'employees')) {
        endpoints.push(axios.get(`${API_BASE_URL}/api/referrals`));
      }

      const responses = await Promise.all(
        endpoints.map(p => p.catch(error => {
          console.error('Error fetching notifications:', error);
          return { data: [] };
        }))
      );
      
      const totalCount = responses.reduce((count, response) => {
        const items = response.data || [];
        if (!Array.isArray(items)) return count;
        
        return count + items.filter(item => 
          item && 
          dayjs(item.createdAt).isAfter(dayjs().subtract(7, 'day')) &&
          (item.status === 'PENDING' || !item.isRead)
        ).length;
      }, 0);

      setNotificationCount(totalCount);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
    // Set up polling every 5 minutes
    const interval = setInterval(fetchNotificationCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSubmenu = (name: string) => {
    setExpandedItem(expandedItem === name ? null : name);
  };

  const isSubmenuActive = (submenu: any[]) =>
    submenu.some((item) => location.pathname === item.href);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 to-gray-400">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full bg-[#3c1f3f] text-white overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center p-2 rounded-lg">
                <img
                  src={logo} // Use the imported logo here
                  alt="Company Logo"
                  className="h-18 w-auto" // Adjust height and width as needed
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
              <nav className="space-y-1">
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
                                ? "bg-white/10 text-white"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            } w-full group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
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
                                        ? "bg-white/10 text-white"
                                        : "text-white/70 hover:bg-white/5 hover:text-white"
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
                              ? "bg-white/10 text-white"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          } group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
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
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center">
                <div className="relative">
                  <UserCircle className="h-9 w-9 text-white" />
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white dark:ring-gray-900"></span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user?.firstName}
                   
                  </p>
                  <p className="text-xs text-white">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-auto p-2 text-white/70 hover:text-white transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top navigation */}
          <div className="bg-white shadow-sm z-10">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <button
                    type="button"
                    className="md:hidden px-4 text-gray-500 focus:outline-none"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </div>

                {/* Right side buttons */}
                <div className="flex items-center gap-4">
                  {/* Notification Bell */}
                  <button
                    onClick={() => setIsNotificationOpen(true)}
                    className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                  >
                    <Bell className="h-6 w-6" />
                    {notificationCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {notificationCount}
                      </span>
                    )}
                  </button>

                  {/* User dropdown */}
                  <div className="flex items-center">
                    <button
                      onClick={handleLogout}
                      className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="ml-2">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-gray-100">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        setNotificationCount={setNotificationCount}
      />
    </div>
  );
}
