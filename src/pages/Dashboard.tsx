import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Clock,
  Calendar,
  Bell,
  Briefcase,
  IndianRupee,
  Target,
  UserPlus,
  FileText,
  LogIn,
  LogOut,
  Megaphone,
  Send,
  Trash2,
  FolderKanban,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../api/axios";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import LoadingButton from "../components/LoadingButton";
import useOrganizationMenuSettings from "../hooks/useOrganizationMenuSettings";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { getPublicHolidays, type Holiday } from "../api/holidays";
import {
  getAllEmployees,
  getTodayAttendance,
  punchInEmployee,
  punchOutEmployee,
  type Attendance as TodayAttendanceRecord,
  type PunchPayload,
} from "../api/payroll";

dayjs.extend(relativeTime);

async function buildPunchPayload(): Promise<PunchPayload> {
  if (!navigator.geolocation) {
    return { locationLabel: "Geolocation not supported by browser" };
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        resolve({
          latitude,
          longitude,
          locationLabel: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        });
      },
      () =>
        resolve({
          locationLabel: "Location unavailable (permission denied or timeout)",
        }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function formatRemainingTime(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resolveDesignationName(employee: any) {
  const position = typeof employee?.position === "string" ? employee.position.trim() : "";
  if (position) return position;

  const designation = employee?.designation;
  if (typeof designation === "string" && designation.trim()) {
    return designation.trim();
  }
  if (designation && typeof designation === "object") {
    const fromName = typeof designation.name === "string" ? designation.name.trim() : "";
    if (fromName) return fromName;
    const fromTitle = typeof designation.title === "string" ? designation.title.trim() : "";
    if (fromTitle) return fromTitle;
  }
  return "Not Assigned";
}

function todayAttendanceHeadline(row: TodayAttendanceRecord | null) {
  if (!row?.checkInTime) {
    return "You have not punched in today.";
  }
  if (!row.checkOutTime) {
    return "You are checked in. Punch out when your shift ends.";
  }
  if (row.status === "HALF_DAY") {
    return "Day closed: half day (less than 8 hours between punch in and out).";
  }
  if (row.status === "PRESENT") {
    return "Day closed: full day (8+ hours recorded).";
  }
  return `Day status: ${row.status}`;
}

function toSafeNumber(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function isApproved(value: unknown): boolean {
  return String(value || "").toUpperCase() === "APPROVED";
}

function parseQueueDate(row: any): Date | null {
  const candidates = [
    row?.submittedAt,
    row?.createdAt,
    row?.requestDate,
    row?.requestedAt,
    row?.entryDate,
    row?.updatedAt,
    row?.date,
  ];
  for (const value of candidates) {
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function parseNotificationTimestamp(row: any): number | null {
  const candidates = [
    row?.updatedAt,
    row?.submittedAt,
    row?.createdAt,
    row?.requestDate,
    row?.requestedAt,
    row?.entryDate,
    row?.date,
  ];
  for (const value of candidates) {
    if (!value) continue;
    const parsed = new Date(value).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

function readNotificationState(storageKey: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeNotificationState(storageKey: string, state: Record<string, number>) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Ignore storage failures and keep notifications functional.
  }
}

function buildPendingInsights(rows: any[], statuses?: string[]) {
  const normalizedStatuses = statuses?.map((status) => status.toUpperCase());
  const pendingRows = normalizedStatuses?.length
    ? rows.filter((row) => normalizedStatuses.includes(String(row?.status || "").toUpperCase()))
    : rows;

  const now = Date.now();
  let overdueCount = 0;
  let oldestPendingDays = 0;

  pendingRows.forEach((row) => {
    const queueDate = parseQueueDate(row);
    if (!queueDate) return;
    const ageDays = Math.max(0, Math.floor((now - queueDate.getTime()) / (1000 * 60 * 60 * 24)));
    oldestPendingDays = Math.max(oldestPendingDays, ageDays);
    if (ageDays >= 3) overdueCount += 1;
  });

  const pendingCount = pendingRows.length;
  const priorityScore =
    pendingCount * 2 +
    overdueCount * 3 +
    (oldestPendingDays >= 7 ? 5 : oldestPendingDays >= 3 ? 2 : 0);

  return {
    pendingCount,
    overdueCount,
    oldestPendingDays,
    priorityScore,
  };
}

interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

interface DashboardStats {
  totalEmployees: number;
  averageAttendance: number;
  leaveRequests: number;
  openPositions: number;
  activeProjects: number;
  employeeGrowth: number;
  attendanceTrend: number;
  leaveRequestTrend: number;
  positionTrend: number;
}

type AttendanceStats = {
  month: string;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  total: number;
};

type OrganizationOverview = {
  id: number;
  name: string;
  code?: string;
  active?: boolean;
  userCount?: number;
  activeUserCount?: number;
  activeProjectCount?: number;
  maxActiveUsers?: number;
  timesheetEnabled?: boolean;
};

type FinancialSummary = {
  totalExpenses: number;
  totalSalariesPaid: number;
  accountBalance: number;
  travelExpenses: number;
};

type AdminActionMetric = {
  key: string;
  title: string;
  description: string;
  count: number;
  overdueCount: number;
  oldestPendingDays: number;
  priorityScore: number;
  href: string;
  tone: "amber" | "sky" | "violet" | "rose";
};

type ComplianceAlert = {
  key: string;
  title: string;
  description: string;
  count: number;
  tone: "rose" | "amber" | "emerald";
};

type Announcement = {
  id: number;
  title: string;
  message: string;
  postedByName: string;
  postedByRole: string;
  active: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type LeaveBalanceSummary = {
  totalRemaining: number;
  byType: { typeName: string; remaining: number }[];
};

type TeamLeaveItem = {
  id: number;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
};

type HiringPipelineItem = {
  status: string;
  count: number;
};

type AttritionInsight = {
  inactiveCount: number;
  inactiveRatio: number;
};

type EmployeeTaskSummary = {
  pendingLeaves: number;
  pendingTimesheets: number;
  pendingTravel: number;
  submittedGoals: number;
};

type DashboardNotificationItem = {
  key: string;
  label: string;
  count: number;
  href: string;
  latestAt: number;
  itemType?: "travel" | "expense";
  itemId?: number;
};

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const { menuSettings, loading: menuSettingsLoading } = useOrganizationMenuSettings();
  const navigate = useNavigate();
  const isMainAdmin = (user?.role || "").toLowerCase() === "admin";
  const currentUserRole = (user?.role || "").toLowerCase();
  const isEmployee = currentUserRole === "employee";
  const isManager = currentUserRole === "manager";
  const isHrOrOrgAdmin = currentUserRole === "hr" || currentUserRole === "org_admin";
  const canViewAllTimesheets = ["hr", "org_admin"].includes(currentUserRole);
  const canViewTeamTimesheets = currentUserRole === "manager";
  const canManageEmployees = hasPermission("manage", "employees");
  const shouldShowPeopleInsights = !isMainAdmin && !isEmployee;
  const canPublishAnnouncements = currentUserRole === "org_admin" || currentUserRole === "hr";
  const canSeeApprovalCenter =
    !isMainAdmin &&
    (
      hasPermission("manage", "employees") ||
      hasPermission("approve", "leave") ||
      hasPermission("approve", "timesheet") ||
      hasPermission("approve", "travel") ||
      hasPermission("approve", "expenses")
    );
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    averageAttendance: 0,
    leaveRequests: 0,
    openPositions: 0,
    activeProjects: 0,
    employeeGrowth: 0,
    attendanceTrend: 0,
    leaveRequestTrend: 0,
    positionTrend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [todayPunchIns, setTodayPunchIns] = useState(0);
  const [period, setPeriod] = useState('monthly');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState<
    { name: string; value: number }[]
  >([]);
  const [designationBreakdown, setDesignationBreakdown] = useState<
    { name: string; value: number }[]
  >([]);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendanceRecord | null>(null);
  const [todayAttendanceLoading, setTodayAttendanceLoading] = useState(true);
  const [punchBusy, setPunchBusy] = useState(false);
  const [punchFeedback, setPunchFeedback] = useState<string | null>(null);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [organizationOverview, setOrganizationOverview] = useState<OrganizationOverview[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalExpenses: 0,
    totalSalariesPaid: 0,
    accountBalance: 0,
    travelExpenses: 0,
  });
  const [adminApprovalMetrics, setAdminApprovalMetrics] = useState<AdminActionMetric[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementHistory, setAnnouncementHistory] = useState<Announcement[]>([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementBusy, setAnnouncementBusy] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
  });
  const [announcementFeedback, setAnnouncementFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [leaveBalanceSummary, setLeaveBalanceSummary] = useState<LeaveBalanceSummary>({
    totalRemaining: 0,
    byType: [],
  });
  const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([]);
  const [teamLeaveCalendar, setTeamLeaveCalendar] = useState<TeamLeaveItem[]>([]);
  const [hiringPipeline, setHiringPipeline] = useState<HiringPipelineItem[]>([]);
  const [attritionInsight, setAttritionInsight] = useState<AttritionInsight>({
    inactiveCount: 0,
    inactiveRatio: 0,
  });
  const [employeeTaskSummary, setEmployeeTaskSummary] = useState<EmployeeTaskSummary>({
    pendingLeaves: 0,
    pendingTimesheets: 0,
    pendingTravel: 0,
    submittedGoals: 0,
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [notifications, setNotifications] = useState<DashboardNotificationItem[]>([]);
  const [notificationReads, setNotificationReads] = useState<Record<string, number>>({});
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement | null>(null);

  const notificationStorageKey = useMemo(
    () => `dashboardNotificationReads:${user?.id || "anonymous"}`,
    [user?.id]
  );

  useEffect(() => {
    setNotificationReads(readNotificationState(notificationStorageKey));
  }, [notificationStorageKey]);

  const toAbsoluteMediaUrl = (rawUrl?: string) => {
    const trimmed = String(rawUrl || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL_LOCAL || "").replace(/\/+$/, "");
    return `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  };

  useEffect(() => {
    let cancelled = false;
    const loadProfileImage = async () => {
      if (!user?.id || isMainAdmin) {
        setProfileImageUrl("");
        return;
      }
      try {
        const response = await api.get(`/auth/employees/${user.id}`);
        if (cancelled) return;
        const nextUrl = toAbsoluteMediaUrl(response.data?.documents?.profileImageUrl);
        setProfileImageUrl(nextUrl);
      } catch {
        if (!cancelled) setProfileImageUrl("");
      }
    };
    void loadProfileImage();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isMainAdmin]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id || isMainAdmin || menuSettingsLoading || !menuSettings.attendanceEnabled) {
      setTodayAttendance(null);
      setTodayAttendanceLoading(false);
      return () => {
        cancelled = true;
      };
    }
    setTodayAttendanceLoading(true);
    getTodayAttendance(Number(user.id))
      .then((row) => {
        if (!cancelled) {
          setTodayAttendance(row);
          setPunchFeedback(null);
        }
      })
      .catch(() => {
        if (!cancelled) setTodayAttendance(null);
      })
      .finally(() => {
        if (!cancelled) setTodayAttendanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, isMainAdmin, menuSettingsLoading, menuSettings.attendanceEnabled]);

  useEffect(() => {
    const hasOpenShift = Boolean(todayAttendance?.checkInTime) && !todayAttendance?.checkOutTime;
    if (!hasOpenShift) return;

    const timer = setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [todayAttendance?.checkInTime, todayAttendance?.checkOutTime]);

  useEffect(() => {
    if (isMainAdmin) {
      setDepartments([]);
      setDepartmentBreakdown([]);
      setDesignationBreakdown([]);
      return;
    }
    getAllEmployees().then((emps) => {
      const uniqueDeps = Array.from(new Set(emps.map((e) => e.department).filter(Boolean)));
      setDepartments(uniqueDeps);

      const departmentMap: Record<string, number> = {};
      const designationMap: Record<string, number> = {};

      emps.forEach((employee: any) => {
        const depName = employee.department || "Unassigned";
        const designationName = resolveDesignationName(employee);
        departmentMap[depName] = (departmentMap[depName] || 0) + 1;
        designationMap[designationName] = (designationMap[designationName] || 0) + 1;
      });

      setDepartmentBreakdown(
        Object.entries(departmentMap).map(([name, value]) => ({ name, value }))
      );
      setDesignationBreakdown(
        Object.entries(designationMap).map(([name, value]) => ({ name, value }))
      );
    });
  }, [isMainAdmin]);

  useEffect(() => {
    if (isMainAdmin) {
      fetchMainAdminOverview();
      const interval = setInterval(() => {
        fetchMainAdminOverview();
      }, 30000);
      return () => clearInterval(interval);
    }
    if (menuSettingsLoading) {
      return;
    }

    if (canManageEmployees) {
      fetchDashboardData();
    } else {
      void fetchEmployeeDashboardData();
    }
    if (shouldShowPeopleInsights) {
      void fetchRecentActivities();
    } else {
      setRecentActivities([]);
    }
    if (menuSettings.attendanceEnabled) {
      getAttendanceStats()
        .then((data) => setAttendanceStats(data))
        .catch(() => setAttendanceStats([]))
        .finally(() => setLoadingStats(false));
      void fetchTodayPunchIns();
    } else {
      setAttendanceStats([]);
      setTodayPunchIns(0);
      setLoadingStats(false);
    }
    void fetchFinancialSummary();
    void fetchAdminActionCenter();
    void fetchAnnouncements();
    void fetchEmployeeEssentials();
    void fetchEmployeeTaskSummary();
    void fetchDashboardNotifications();
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      if (canManageEmployees) {
        fetchDashboardData();
      } else {
        void fetchEmployeeDashboardData();
      }
      if (shouldShowPeopleInsights) {
        void fetchRecentActivities();
      } else {
        setRecentActivities([]);
      }
      if (menuSettings.attendanceEnabled) {
        getAttendanceStats()
          .then((data) => setAttendanceStats(data))
          .catch(() => setAttendanceStats([]));
        void fetchTodayPunchIns();
      } else {
        setAttendanceStats([]);
        setTodayPunchIns(0);
      }
      void fetchFinancialSummary();
      void fetchAdminActionCenter();
      void fetchAnnouncements();
      void fetchEmployeeEssentials();
      void fetchEmployeeTaskSummary();
      void fetchDashboardNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [
    period,
    department,
    isMainAdmin,
    menuSettings.attendanceEnabled,
    menuSettings.timesheetEnabled,
    menuSettings.recruitmentEnabled,
    menuSettings.leaveManagementEnabled,
    menuSettings.travelEnabled,
    menuSettings.expenseEnabled,
    menuSettingsLoading,
    canPublishAnnouncements,
    user?.id,
    currentUserRole,
    canManageEmployees,
    shouldShowPeopleInsights,
  ]);

  useEffect(() => {
    if (!isNotificationOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationDropdownRef.current) return;
      if (!notificationDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isNotificationOpen]);

  const fetchEmployeeDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      if (menuSettings.timesheetEnabled) {
        const attendanceResponse = await getScopedTimesheets();
        void attendanceResponse;
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching employee dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMainAdminOverview = async () => {
    try {
      setLoading(true);
      const response = await api.get<OrganizationOverview[]>("/api/organizations/overview");
      const rows = Array.isArray(response.data) ? response.data : [];
      setOrganizationOverview(rows);
      setError(null);
    } catch (err) {
      console.error("Error fetching organization overview:", err);
      setOrganizationOverview([]);
      setError("Failed to load organization overview.");
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all required data in parallel, including recruitment details
      const [employeesResponse, leaveRequestsResponse, recruitmentResponse, projectsResponse] = await Promise.all([
        api.get(`/auth/employees`),
        api.get(`/api/leave-requests`),
        api.get(`/api/recruitment-details`),
        menuSettings.timesheetEnabled ? api.get(`/api/projects`) : Promise.resolve({ data: [] }),
      ]);

      // Calculate total employees and growth
      const currentEmployees = Array.isArray(employeesResponse.data)
        ? employeesResponse.data
        : [];
      const totalEmployees = currentEmployees.length;

      const lastMonthEmployees = currentEmployees.filter((emp: any) =>
        dayjs(emp.joinDate).isAfter(dayjs().subtract(1, "month"))
      );

      const newThisMonth = lastMonthEmployees.length;
      const employeeGrowth =
        newThisMonth > 0
          ? ((newThisMonth / totalEmployees) * 100).toFixed(2)
          : 0;

      // Calculate leave requests stats
      const pendingLeaveRequests = (leaveRequestsResponse.data || []).filter(
        (req: any) => req.status === "PENDING"
      );
      const lastMonthLeaveRequests = (leaveRequestsResponse.data || []).filter(
        (req: any) => dayjs(req.createdAt).isAfter(dayjs().subtract(1, "month"))
      );
      const leaveRequestTrend =
        lastMonthLeaveRequests.length > 0
          ? (
              ((pendingLeaveRequests.length - lastMonthLeaveRequests.length) /
                lastMonthLeaveRequests.length) *
              100
            ).toFixed(2)
          : 0;

      // Fetch open positions from recruitment data
      const recruitmentData = recruitmentResponse.data || [];
      const openPositions = recruitmentData.filter((job: any) => job.status === "OPEN").length;
      const projectRows = Array.isArray(projectsResponse.data) ? projectsResponse.data : [];
      const activeProjects = projectRows.filter(
        (project: any) => String(project?.status || "").toUpperCase() === "ACTIVE"
      ).length;
      const positionTrend = 3.1; // You can update this if you want to calculate a trend

      // For now, set some default values for attendance
      const averageAttendance = 95;
      const attendanceTrend = 1.2;

      // Update stats
      setStats({
        totalEmployees,
        averageAttendance,
        leaveRequests: pendingLeaveRequests.length,
        openPositions,
        activeProjects,
        employeeGrowth: Number(employeeGrowth),
        attendanceTrend,
        leaveRequestTrend: Number(leaveRequestTrend),
        positionTrend,
      });

      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getScopedTimesheets = async () => {
    if (!user?.id) {
      return { data: [] };
    }

    if (canViewAllTimesheets) {
      return api.get(`/api/timesheet`);
    }

    if (canViewTeamTimesheets) {
      const [employeesResponse, timesheetsResponse] = await Promise.all([
        api.get(`/auth/employees`),
        api.get(`/api/timesheet`),
      ]);

      const employees = Array.isArray(employeesResponse.data) ? employeesResponse.data : [];
      const timesheets = Array.isArray(timesheetsResponse.data) ? timesheetsResponse.data : [];
      const currentUserId = Number(user.id);
      const managedEmployeeIds = new Set(
        employees
          .filter((employee: any) => employee.reportingManager?.id === currentUserId)
          .map((employee: any) => employee.id)
      );

      return {
        data: timesheets.filter((timesheet: any) =>
          managedEmployeeIds.has(Number(timesheet.employeeId))
        ),
      };
    }

    return api.get(`/api/timesheet/employee/${user.id}`);
  };

  const fetchRecentActivities = async () => {
    if (!shouldShowPeopleInsights) {
      setRecentActivities([]);
      return;
    }
    try {
      const [
        employeesResponse,
        leaveRequestsResponse,
        jobPostingsResponse,
      ] = await Promise.all([
        api.get(`/auth/employees`),
        api.get(`/api/leave-requests`),
        menuSettings.recruitmentEnabled
          ? api.get(`/api/recruitment-details`)
          : Promise.resolve({ data: [] }),
      ]);
      const timesheetsResponse = menuSettings.timesheetEnabled
        ? await getScopedTimesheets()
        : { data: null };

      const activities: Activity[] = [];

      // Process new employees (last 30 days)
      employeesResponse.data.forEach((emp: any) => {
        if (dayjs(emp.joinDate).isAfter(dayjs().subtract(30, "day"))) {
          activities.push({
            id: emp.id,
            type: "employee",
            title: "New employee onboarded",
            description: `${emp.firstName} ${emp.lastName} joined as ${emp.designation}`,
            timestamp: emp.joinDate,
          });
        }
      });

      // Process leave requests (last 7 days)
      if (menuSettings.leaveManagementEnabled && Array.isArray(leaveRequestsResponse.data)) {
        leaveRequestsResponse.data.forEach((leave: any) => {
          if (dayjs(leave.updatedAt).isAfter(dayjs().subtract(7, "day"))) {
            activities.push({
              id: leave.id,
              type: "leave",
              title: `Leave request ${leave.status.toLowerCase()}`,
              description: `${leave.employee?.firstName} ${leave.employee?.lastName}'s leave request`,
              timestamp: leave.updatedAt,
            });
          }
        });
      }

      // Process timesheets (last 7 days)
      if (menuSettings.timesheetEnabled && timesheetsResponse.data) {
        timesheetsResponse.data.forEach((timesheet: any) => {
          if (dayjs(timesheet.updatedAt).isAfter(dayjs().subtract(7, "day"))) {
            activities.push({
              id: timesheet.id,
              type: "timesheet",
              title: `Timesheet ${timesheet.status.toLowerCase()}`,
              description: `${timesheet.employee?.firstName} ${timesheet.employee?.lastName}'s timesheet`,
              timestamp: timesheet.updatedAt,
            });
          }
        });
      }

      // Process job postings (last 30 days)
      if (menuSettings.recruitmentEnabled && Array.isArray(jobPostingsResponse.data)) {
        jobPostingsResponse.data.forEach((job: any) => {
          if (dayjs(job.createdAt).isAfter(dayjs().subtract(30, "day"))) {
            activities.push({
              id: job.id,
              type: "job",
              title: "New job posted",
              description: job.title,
              timestamp: job.createdAt,
            });
          }
        });
      }

      // Sort activities by timestamp (most recent first)
      activities.sort(
        (a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
      );

      // Take only the 10 most recent activities
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      console.error("Error fetching recent activities:", error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "employee":
        return UserPlus;
      case "leave":
        return Calendar;
      case "timesheet":
        return FileText;
      case "job":
        return Briefcase;
      default:
        return Bell;
    }
  };

  type DashboardQuickLink = {
    name: string;
    icon: typeof Users;
    color: string;
    href: string;
  };

  const hrDashboardQuickLinks = useMemo((): DashboardQuickLink[] => {
    const items: DashboardQuickLink[] = [];
    if (menuSettings.employeeManagementEnabled) {
      items.push({
        name: "Add Employee",
        icon: Users,
        color: "bg-blue-500",
        href: "/employees/add",
      });
    }
    if (menuSettings.recruitmentEnabled) {
      items.push({
        name: "Posted Jobs",
        icon: Briefcase,
        color: "bg-purple-500",
        href: "/recruitment",
      });
    }
    return items;
  }, [menuSettings.employeeManagementEnabled, menuSettings.recruitmentEnabled]);

  const employeeDashboardQuickLinks = useMemo((): DashboardQuickLink[] => {
    const items: DashboardQuickLink[] = [];
    if (menuSettings.timesheetEnabled) {
      items.push({
        name: "My Projects",
        icon: FolderKanban,
        color: "bg-cyan-600",
        href: "/timesheet/projects",
      });
    }
    if (menuSettings.timesheetEnabled && hasPermission("submit", "timesheet")) {
      items.push({
        name: "Submit Timesheet",
        icon: Clock,
        color: "bg-blue-500",
        href: "/timesheet/submit",
      });
    }
    if (menuSettings.leaveManagementEnabled && hasPermission("submit", "leave")) {
      items.push({
        name: "Request Leave",
        icon: Calendar,
        color: "bg-purple-500",
        href: "/leave/request",
      });
    }
    if (menuSettings.expenseEnabled && hasPermission("submit", "expenses")) {
      items.push({
        name: "Submit Expense",
        icon: IndianRupee,
        color: "bg-green-500",
        href: "/travel/submit-expense",
      });
    }
    if (
      hasPermission("manage", "performance") ||
      hasPermission("read", "performance")
    ) {
      items.push({
        name: "View Performance",
        icon: Target,
        color: "bg-pink-500",
        href: "/performance",
      });
    }
    return items;
  }, [
    menuSettings.timesheetEnabled,
    menuSettings.leaveManagementEnabled,
    menuSettings.expenseEnabled,
    hasPermission,
  ]);

  const getAttendanceStats = async () => {
    // console.log("Fetching attendance stats with filters...", period, department);
    const response = await api.get('/api/payroll/attendance/stats', {
      params: { period, department }
    });
    return response.data;
  };

  const fetchTodayPunchIns = async () => {
    if (!menuSettings.attendanceEnabled || !canManageEmployees) return;
    try {
      const response = await api.get('/api/payroll/attendance/today-punch-ins');
      setTodayPunchIns(Number(response.data?.totalPunchIns || 0));
    } catch {
      setTodayPunchIns(0);
    }
  };

  const fetchFinancialSummary = async () => {
    if (isMainAdmin) {
      setFinancialSummary({
        totalExpenses: 0,
        totalSalariesPaid: 0,
        accountBalance: 0,
        travelExpenses: 0,
      });
      return;
    }
    const hasTeamAccess = hasPermission("manage", "employees");
    const currentEmployeeId = Number(user?.id);
    if (!hasTeamAccess && !currentEmployeeId) {
      setFinancialSummary({
        totalExpenses: 0,
        totalSalariesPaid: 0,
        accountBalance: 0,
        travelExpenses: 0,
      });
      return;
    }

    try {
      const employeeIds = hasTeamAccess
        ? ((await api.get("/auth/employees")).data || [])
            .filter((emp: any) => emp && emp.id != null)
            .map((emp: any) => Number(emp.id))
            .filter((id: number) => Number.isFinite(id) && id > 0)
        : [currentEmployeeId];

      const [expensesResponse, travelResponse, salaryDetailsResponse, payslipGroups] =
        await Promise.all([
          hasTeamAccess
            ? api.get("/api/expenses/approved")
            : api.get(`/api/expenses/employee/${currentEmployeeId}`),
          hasTeamAccess
            ? api.get("/api/travel-requests/approved")
            : api.get(`/api/travel-requests/employee/${currentEmployeeId}`),
          hasTeamAccess
            ? api.get("/api/SalaryAndBankDetails")
            : api.get(`/api/SalaryAndBankDetails/employee/${currentEmployeeId}`),
          Promise.all(
            employeeIds.map((employeeId: number) =>
              api
                .get("/api/payroll/payslips", { params: { employeeId } })
                .then((res) => (Array.isArray(res.data) ? res.data : []))
                .catch(() => [])
            )
          ),
        ]);

      const expenseRows = Array.isArray(expensesResponse.data) ? expensesResponse.data : [];
      const approvedExpenses = hasTeamAccess
        ? expenseRows
        : expenseRows.filter(
            (row: any) =>
              isApproved(row?.secondLevelApprovalStatus) ||
              (isApproved(row?.firstLevelApprovalStatus) && !row?.secondLevelApprovalStatus)
          );
      const otherExpensesAmount = approvedExpenses.reduce(
        (sum: number, row: any) => sum + toSafeNumber(row?.amount),
        0
      );

      const travelRows = Array.isArray(travelResponse.data) ? travelResponse.data : [];
      const approvedTravel = hasTeamAccess
        ? travelRows
        : travelRows.filter(
            (row: any) =>
              isApproved(row?.status) ||
              isApproved(row?.secondLevelApprovalStatus) ||
              (isApproved(row?.firstLevelApprovalStatus) && !row?.secondLevelApprovalStatus)
          );
      const travelExpenses = approvedTravel.reduce(
        (sum: number, row: any) => sum + toSafeNumber(row?.budget),
        0
      );

      const payslips = payslipGroups.flat();
      const totalSalariesPaid = payslips
        .filter((row: any) => {
          const status = String(row?.status || "").toUpperCase();
          return status === "APPROVED" || status === "PAID";
        })
        .reduce((sum: number, row: any) => sum + toSafeNumber(row?.netPay), 0);

      const salaryRows = Array.isArray(salaryDetailsResponse.data)
        ? salaryDetailsResponse.data
        : salaryDetailsResponse.data
          ? [salaryDetailsResponse.data]
          : [];
      const salaryBudget = salaryRows.reduce(
        (sum: number, row: any) => sum + toSafeNumber(row?.ctc),
        0
      );

      const totalExpenses = otherExpensesAmount + travelExpenses;
      const accountBalance = Math.max(0, salaryBudget - totalSalariesPaid - totalExpenses);

      setFinancialSummary({
        totalExpenses,
        totalSalariesPaid,
        accountBalance,
        travelExpenses,
      });
    } catch (summaryError) {
      console.error("Error fetching financial summary:", summaryError);
      setFinancialSummary({
        totalExpenses: 0,
        totalSalariesPaid: 0,
        accountBalance: 0,
        travelExpenses: 0,
      });
    }
  };

  const fetchAdminActionCenter = async () => {
    if (isMainAdmin || !user?.id) {
      setAdminApprovalMetrics([]);
      setComplianceAlerts([]);
      setTeamLeaveCalendar([]);
      setHiringPipeline([]);
      setAttritionInsight({ inactiveCount: 0, inactiveRatio: 0 });
      return;
    }

    const hasTeamAccess = hasPermission("manage", "employees");
    const canApproveLeave = hasPermission("approve", "leave");
    const canApproveTimesheet = hasPermission("approve", "timesheet");
    const canApproveTravel = hasPermission("approve", "travel") || hasPermission("approve", "expenses");
    const canApproveExpenses = hasPermission("approve", "expenses");

    const requests: Promise<unknown>[] = [];
    const requestKeys: string[] = [];
    const addRequest = (key: string, request: Promise<unknown>) => {
      requestKeys.push(key);
      requests.push(request);
    };

    if (menuSettings.leaveManagementEnabled && canApproveLeave) {
      addRequest("leave", api.get("/api/leave-requests"));
    }
    if (menuSettings.timesheetEnabled && canApproveTimesheet) {
      addRequest("timesheet", api.get("/api/timesheet"));
    }
    if (menuSettings.travelEnabled && canApproveTravel) {
      addRequest("travel", api.get("/api/travel-requests/pending"));
    }
    if (menuSettings.expenseEnabled && canApproveExpenses) {
      addRequest("expense", api.get("/api/expenses/pending"));
    }
    if (hasTeamAccess || isManager) {
      addRequest("employees", api.get("/auth/employees"));
    }
    if (menuSettings.leaveManagementEnabled && (hasTeamAccess || isManager || canApproveLeave)) {
      addRequest("leaveCalendar", api.get("/api/leave-requests"));
    }
    if (menuSettings.recruitmentEnabled && hasTeamAccess) {
      addRequest("recruitment", api.get("/api/recruitment-details"));
    }

    try {
      const settled = await Promise.allSettled(requests);
      const responseByKey: Record<string, any> = {};
      settled.forEach((result, index) => {
        if (result.status === "fulfilled") {
          responseByKey[requestKeys[index]] = result.value;
        }
      });

      const nextMetrics: AdminActionMetric[] = [];
      const pushMetric = (
        key: string,
        title: string,
        description: string,
        insights: {
          pendingCount: number;
          overdueCount: number;
          oldestPendingDays: number;
          priorityScore: number;
        },
        href: string,
        tone: AdminActionMetric["tone"]
      ) => {
        nextMetrics.push({
          key,
          title,
          description,
          count: insights.pendingCount,
          overdueCount: insights.overdueCount,
          oldestPendingDays: insights.oldestPendingDays,
          priorityScore: insights.priorityScore,
          href,
          tone,
        });
      };

      if (menuSettings.leaveManagementEnabled && responseByKey.leave?.data) {
        const rows = Array.isArray(responseByKey.leave.data) ? responseByKey.leave.data : [];
        const insights = buildPendingInsights(rows, ["PENDING", "REVOCATION_PENDING"]);
        pushMetric(
          "leave",
          "Leave approvals",
          "Requests and revoke requests waiting for review",
          insights,
          "/leave/approvals",
          "amber"
        );
      }

      if (menuSettings.timesheetEnabled && responseByKey.timesheet?.data) {
        const rows = Array.isArray(responseByKey.timesheet.data) ? responseByKey.timesheet.data : [];
        const actionableRows = rows.filter((row: any) => row?.canCurrentUserApprove !== false);
        const insights = buildPendingInsights(actionableRows, ["PENDING", "SUBMITTED"]);
        pushMetric(
          "timesheet",
          "Timesheet approvals",
          "Submissions awaiting decision",
          insights,
          "/timesheet/approvals",
          "sky"
        );
      }

      if (menuSettings.travelEnabled && responseByKey.travel?.data) {
        const rows = Array.isArray(responseByKey.travel.data) ? responseByKey.travel.data : [];
        const insights = buildPendingInsights(rows);
        pushMetric(
          "travel",
          "Travel approvals",
          "Pending trip requests",
          insights,
          "/travel/approvals",
          "violet"
        );
      }

      if (menuSettings.expenseEnabled && responseByKey.expense?.data) {
        const rows = Array.isArray(responseByKey.expense.data) ? responseByKey.expense.data : [];
        const insights = buildPendingInsights(rows);
        pushMetric(
          "expense",
          "Expense approvals",
          "Claims waiting for action",
          insights,
          "/travel/approvals",
          "rose"
        );
      }

      setAdminApprovalMetrics(
        nextMetrics.sort((a, b) => b.priorityScore - a.priorityScore || b.count - a.count)
      );

      const employeeRows = Array.isArray(responseByKey.employees?.data)
        ? responseByKey.employees.data
        : [];
      const incompleteProfiles = employeeRows.filter(
        (employee: any) =>
          !employee?.department ||
          !employee?.position ||
          !employee?.workLocation ||
          !employee?.joinDate
      ).length;
      const missingContacts = employeeRows.filter(
        (employee: any) => !employee?.phone || !employee?.username
      ).length;
      const inactiveUsers = employeeRows.filter((employee: any) => employee?.active === false).length;

      const nextCompliance: ComplianceAlert[] = [];
      if (incompleteProfiles > 0) {
        nextCompliance.push({
          key: "incomplete",
          title: "Incomplete employee profiles",
          description: "Missing department, designation, location, or join date",
          count: incompleteProfiles,
          tone: "rose",
        });
      }
      if (missingContacts > 0) {
        nextCompliance.push({
          key: "contact",
          title: "Contact information gaps",
          description: "Employees missing phone number or work email",
          count: missingContacts,
          tone: "amber",
        });
      }
      if (inactiveUsers > 0) {
        nextCompliance.push({
          key: "inactive",
          title: "Inactive accounts",
          description: "Review offboarded users and access cleanup",
          count: inactiveUsers,
          tone: "amber",
        });
      }
      if (nextCompliance.length === 0) {
        nextCompliance.push({
          key: "healthy",
          title: "Compliance checks healthy",
          description: "No critical profile or contact data issues found",
          count: 0,
          tone: "emerald",
        });
      }
      setComplianceAlerts(nextCompliance);

      if (employeeRows.length > 0) {
        const inactiveCount = employeeRows.filter((employee: any) => employee?.active === false).length;
        const inactiveRatio = (inactiveCount / employeeRows.length) * 100;
        setAttritionInsight({
          inactiveCount,
          inactiveRatio,
        });
      } else {
        setAttritionInsight({ inactiveCount: 0, inactiveRatio: 0 });
      }

      const leaveCalendarRows = Array.isArray(responseByKey.leaveCalendar?.data)
        ? responseByKey.leaveCalendar.data
        : [];
      const upcomingLeaveRows = leaveCalendarRows
        .filter((row: any) => String(row?.status || "").toUpperCase() === "APPROVED")
        .filter((row: any) => dayjs(row?.endDate).isAfter(dayjs().subtract(1, "day")))
        .sort((a: any, b: any) => dayjs(a?.startDate).valueOf() - dayjs(b?.startDate).valueOf())
        .slice(0, 6)
        .map((row: any) => ({
          id: Number(row?.id),
          employeeName: `${row?.employee?.firstName || ""} ${row?.employee?.lastName || ""}`.trim() || "Employee",
          leaveType: row?.leaveType?.name || "Leave",
          startDate: row?.startDate,
          endDate: row?.endDate,
        }));
      setTeamLeaveCalendar(upcomingLeaveRows);

      const recruitmentRows = Array.isArray(responseByKey.recruitment?.data)
        ? responseByKey.recruitment.data
        : [];
      const pipelineMap: Record<string, number> = {};
      recruitmentRows.forEach((row: any) => {
        const key = String(row?.status || "UNKNOWN").toUpperCase();
        pipelineMap[key] = (pipelineMap[key] || 0) + 1;
      });
      const orderedStages = ["OPEN", "IN_PROGRESS", "CLOSED"];
      const pipeline = orderedStages
        .filter((status) => pipelineMap[status] != null)
        .map((status) => ({ status, count: pipelineMap[status] }))
        .concat(
          Object.entries(pipelineMap)
            .filter(([status]) => !orderedStages.includes(status))
            .map(([status, count]) => ({ status, count }))
        );
      setHiringPipeline(pipeline);
    } catch {
      setAdminApprovalMetrics([]);
      setComplianceAlerts([
        {
          key: "fallback",
          title: "Compliance checks unavailable",
          description: "Try again shortly to load action center insights",
          count: 0,
          tone: "amber",
        },
      ]);
      setTeamLeaveCalendar([]);
      setHiringPipeline([]);
      setAttritionInsight({ inactiveCount: 0, inactiveRatio: 0 });
    }
  };

  const fetchAnnouncements = async () => {
    if (isMainAdmin || !user?.id) {
      setAnnouncements([]);
      setAnnouncementHistory([]);
      return;
    }

    try {
      setAnnouncementLoading(true);
      const currentResponse = await api.get<Announcement[]>("/api/announcements/current");
      const currentRows = Array.isArray(currentResponse.data) ? currentResponse.data : [];
      setAnnouncements(currentRows);

      if (canPublishAnnouncements) {
        const historyResponse = await api.get<Announcement[]>("/api/announcements/history");
        const historyRows = Array.isArray(historyResponse.data) ? historyResponse.data : [];
        setAnnouncementHistory(
          historyRows.filter((item) => item.deleted === true || item.active === false)
        );
      } else {
        setAnnouncementHistory([]);
      }
    } catch (announcementError) {
      console.error("Error fetching announcements:", announcementError);
      setAnnouncements([]);
      setAnnouncementHistory([]);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const fetchEmployeeEssentials = async () => {
    if (isMainAdmin || !user?.id) {
      setLeaveBalanceSummary({ totalRemaining: 0, byType: [] });
      setUpcomingHolidays([]);
      return;
    }

    try {
      const [leaveTypesResponse, balancesResponse, holidaysResponse] = await Promise.all([
        menuSettings.leaveManagementEnabled ? api.get("/api/leave-types") : Promise.resolve({ data: [] }),
        menuSettings.leaveManagementEnabled
          ? api.get(`/api/leave-balances/employee/${user.id}`)
          : Promise.resolve({ data: [] }),
        getPublicHolidays(new Date().getFullYear()),
      ]);

      if (menuSettings.leaveManagementEnabled) {
        const leaveTypes = Array.isArray(leaveTypesResponse.data) ? leaveTypesResponse.data : [];
        const balances = Array.isArray(balancesResponse.data) ? balancesResponse.data : [];

        const leaveByType = leaveTypes.map((type: any) => {
          const match = balances.find((row: any) => row.leaveTypeId === type.id);
          const remaining = Number(match?.balance ?? type.defaultBalance ?? 0);
          return {
            typeName: String(type?.name || "Leave"),
            remaining,
          };
        });
        setLeaveBalanceSummary({
          totalRemaining: leaveByType.reduce((sum, item) => sum + Number(item.remaining || 0), 0),
          byType: leaveByType,
        });
      } else {
        setLeaveBalanceSummary({ totalRemaining: 0, byType: [] });
      }

      const now = dayjs().startOf("day");
      const holidayRows = Array.isArray(holidaysResponse) ? holidaysResponse : [];
      const nextHolidays = holidayRows
        .filter((holiday) => dayjs(holiday.date).isSame(now) || dayjs(holiday.date).isAfter(now))
        .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
        .slice(0, 5);
      setUpcomingHolidays(nextHolidays);
    } catch (err) {
      console.error("Error fetching employee essentials:", err);
      setLeaveBalanceSummary({ totalRemaining: 0, byType: [] });
      setUpcomingHolidays([]);
    }
  };

  const fetchEmployeeTaskSummary = async () => {
    if (!user?.id || isMainAdmin || hasPermission("manage", "employees")) {
      setEmployeeTaskSummary({
        pendingLeaves: 0,
        pendingTimesheets: 0,
        pendingTravel: 0,
        submittedGoals: 0,
      });
      return;
    }

    try {
      const [leaveResponse, timesheetResponse, travelResponse] = await Promise.all([
        menuSettings.leaveManagementEnabled
          ? api.get(`/api/leave-requests/employee/${user.id}`)
          : Promise.resolve({ data: [] }),
        menuSettings.timesheetEnabled
          ? getScopedTimesheets()
          : Promise.resolve({ data: [] }),
        menuSettings.travelEnabled
          ? api.get(`/api/travel-requests/employee/${user.id}`)
          : Promise.resolve({ data: [] }),
      ]);

      const leaveRows = Array.isArray(leaveResponse.data) ? leaveResponse.data : [];
      const timesheetRows = Array.isArray(timesheetResponse.data) ? timesheetResponse.data : [];
      const travelRows = Array.isArray(travelResponse.data) ? travelResponse.data : [];

      const pendingLeaves = menuSettings.leaveManagementEnabled
        ? leaveRows.filter((row: any) => String(row?.status || "").toUpperCase() === "PENDING").length
        : 0;
      const pendingTimesheets = menuSettings.timesheetEnabled
        ? timesheetRows.filter((row: any) => {
            const status = String(row?.status || "").toUpperCase();
            return status === "PENDING" || status === "SUBMITTED";
          }).length
        : 0;
      const pendingTravel = menuSettings.travelEnabled
        ? travelRows.filter((row: any) => {
            const status = String(row?.status || "").toUpperCase();
            return status === "PENDING" || status === "IN_PROGRESS";
          }).length
        : 0;
      const submittedGoals = menuSettings.timesheetEnabled
        ? timesheetRows.filter((row: any) => {
            const status = String(row?.status || "").toUpperCase();
            return status === "APPROVED" || status === "PAID";
          }).length
        : 0;

      setEmployeeTaskSummary({
        pendingLeaves,
        pendingTimesheets,
        pendingTravel,
        submittedGoals,
      });
    } catch (err) {
      console.error("Error fetching employee task summary:", err);
      setEmployeeTaskSummary({
        pendingLeaves: 0,
        pendingTimesheets: 0,
        pendingTravel: 0,
        submittedGoals: 0,
      });
    }
  };

  const fetchDashboardNotifications = async () => {
    if (!user?.id || isMainAdmin) {
      setNotifications([]);
      return;
    }

    const role = currentUserRole;
    const isNotificationEmployee = role === "employee";
    const isOrgAdminOrHr = role === "org_admin" || role === "hr";
    const canApproveLeave = menuSettings.leaveManagementEnabled && hasPermission("approve", "leave");
    const canApproveTimesheet = menuSettings.timesheetEnabled && hasPermission("approve", "timesheet");
    const canApproveTravel =
      menuSettings.travelEnabled &&
      (hasPermission("approve", "travel") || hasPermission("approve", "expenses"));
    const canApproveExpenses = menuSettings.expenseEnabled && hasPermission("approve", "expenses");
    const sinceMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const computeNotificationLatestAt = (rows: any[]) => {
      const parsed = rows
        .map((row: any) => parseNotificationTimestamp(row))
        .filter((value): value is number => value != null);
      if (parsed.length > 0) {
        return Math.max(...parsed);
      }
      const maxId = rows.reduce((max, row) => Math.max(max, Number(row?.id) || 0), 0);
      return maxId > 0 ? maxId : 0;
    };
    const pickLatestNotificationRow = (rows: any[]) => {
      if (!rows || rows.length === 0) return null;
      return rows.reduce((latest: any, row: any) => {
        if (!latest) return row;
        const latestTs = parseNotificationTimestamp(latest) ?? 0;
        const rowTs = parseNotificationTimestamp(row) ?? 0;
        if (rowTs !== latestTs) return rowTs > latestTs ? row : latest;
        const latestId = Number(latest?.id) || 0;
        const rowId = Number(row?.id) || 0;
        return rowId > latestId ? row : latest;
      }, null);
    };


    const requests: Promise<unknown>[] = [];
    const keys: string[] = [];
    const addRequest = (key: string, request: Promise<unknown>) => {
      keys.push(key);
      requests.push(request);
    };

    if (menuSettings.leaveManagementEnabled) {
      addRequest(
        "leave",
        isNotificationEmployee
          ? api.get(`/api/leave-requests/employee/${user.id}`)
          : api.get("/api/leave-requests")
      );
    }
    if (menuSettings.timesheetEnabled && (canApproveTimesheet || isNotificationEmployee || isOrgAdminOrHr)) {
      addRequest(
        "timesheet",
        isNotificationEmployee ? api.get(`/api/timesheet/employee/${user.id}`) : api.get("/api/timesheet")
      );
    }
    if (menuSettings.travelEnabled) {
      addRequest(
        "travel",
        isNotificationEmployee
          ? api.get(`/api/travel-requests/employee/${user.id}`)
          : canApproveTravel
            ? api.get("/api/travel-requests/pending")
            : api.get("/api/travel-requests")
      );
    }
    if (menuSettings.expenseEnabled) {
      addRequest(
        "expense",
        isNotificationEmployee
          ? api.get(`/api/expenses/employee/${user.id}`)
          : canApproveExpenses
            ? api.get("/api/expenses/pending")
            : api.get("/api/expenses")
      );
    }
    if (menuSettings.timesheetEnabled && (isNotificationEmployee || isOrgAdminOrHr)) {
      addRequest("projects", api.get("/api/projects"));
    }

    try {
      const settled = await Promise.allSettled(requests);
      const responseByKey: Record<string, any> = {};
      settled.forEach((result, index) => {
        if (result.status === "fulfilled") {
          responseByKey[keys[index]] = result.value;
        }
      });

      const items: DashboardNotificationItem[] = [];

      if (responseByKey.leave?.data) {
        const rows = Array.isArray(responseByKey.leave.data) ? responseByKey.leave.data : [];
        const relevantRows = isNotificationEmployee
          ? rows.filter((row: any) => {
              const status = String(row?.status || "").toUpperCase();
              const updatedAt = parseNotificationTimestamp(row);
              return updatedAt != null && updatedAt >= sinceMs && status !== "PENDING";
            })
          : rows.filter((row: any) => {
              const updatedAt = parseNotificationTimestamp(row);
              return updatedAt != null && updatedAt >= sinceMs;
            });
        if (relevantRows.length > 0) {
          items.push({
            key: "leave",
            label: isNotificationEmployee ? "Leave updates" : "Leave activity",
            count: relevantRows.length,
            href: canApproveLeave ? "/leave/approvals" : "/leave",
            latestAt: Math.max(...relevantRows.map((row: any) => parseNotificationTimestamp(row) || 0)),
          });
        }
      }

      if (responseByKey.timesheet?.data) {
        const rows = Array.isArray(responseByKey.timesheet.data) ? responseByKey.timesheet.data : [];
        const relevantRows = rows.filter((row: any) => {
          const updatedAt = parseNotificationTimestamp(row);
          return updatedAt != null && updatedAt >= sinceMs;
        });
        if (relevantRows.length > 0) {
          items.push({
            key: "timesheet",
            label: canApproveTimesheet ? "Timesheet updates" : "Timesheet activity",
            count: relevantRows.length,
            href: canApproveTimesheet ? "/timesheet/approvals" : "/timesheet",
            latestAt: Math.max(...relevantRows.map((row: any) => parseNotificationTimestamp(row) || 0)),
          });
        }
      }

      if (responseByKey.travel?.data) {
        const rows = Array.isArray(responseByKey.travel.data) ? responseByKey.travel.data : [];
        const relevantRows = isNotificationEmployee
          ? rows.filter((row: any) => {
              const status = String(
                row?.status || row?.firstLevelApprovalStatus || row?.secondLevelApprovalStatus || ""
              ).toUpperCase();
              const updatedAt = parseNotificationTimestamp(row);
              return updatedAt != null && updatedAt >= sinceMs && status !== "PENDING" && status !== "IN_PROGRESS";
            })
          : canApproveTravel
            ? rows
            : rows.filter((row: any) => {
                const updatedAt = parseNotificationTimestamp(row);
                return updatedAt != null && updatedAt >= sinceMs;
              });
        if (relevantRows.length > 0) {
          const latestRow = pickLatestNotificationRow(relevantRows);
          items.push({
            key: "travel",
            label: isNotificationEmployee
              ? "Travel updates"
              : canApproveTravel
                ? "Travel approvals pending"
                : "Travel activity",
            count: relevantRows.length,
            href: canApproveTravel ? "/travel/approvals" : "/travel",
            latestAt: computeNotificationLatestAt(relevantRows),
            itemType: canApproveTravel ? "travel" : undefined,
            itemId: canApproveTravel ? Number(latestRow?.id) || undefined : undefined,
          });
        }
      }

      if (responseByKey.expense?.data) {
        const rows = Array.isArray(responseByKey.expense.data) ? responseByKey.expense.data : [];
        const relevantRows = isNotificationEmployee
          ? rows.filter((row: any) => {
              const status = String(
                row?.status || row?.firstLevelApprovalStatus || row?.secondLevelApprovalStatus || ""
              ).toUpperCase();
              const updatedAt = parseNotificationTimestamp(row);
              return updatedAt != null && updatedAt >= sinceMs && status !== "PENDING" && status !== "IN_PROGRESS";
            })
          : canApproveExpenses
            ? rows
            : rows.filter((row: any) => {
                const updatedAt = parseNotificationTimestamp(row);
                return updatedAt != null && updatedAt >= sinceMs;
              });
        if (relevantRows.length > 0) {
          const latestRow = pickLatestNotificationRow(relevantRows);
          items.push({
            key: "expense",
            label: isNotificationEmployee
              ? "Expense updates"
              : canApproveExpenses
                ? "Expense approvals pending"
                : "Expense activity",
            count: relevantRows.length,
            href: canApproveExpenses ? "/travel/approvals" : "/travel",
            latestAt: computeNotificationLatestAt(relevantRows),
            itemType: canApproveExpenses ? "expense" : undefined,
            itemId: canApproveExpenses ? Number(latestRow?.id) || undefined : undefined,
          });
        }
      }

      if (responseByKey.projects?.data) {
        const rows = Array.isArray(responseByKey.projects.data) ? responseByKey.projects.data : [];
        const relevantProjects = isNotificationEmployee
          ? rows.filter((project: any) =>
              String(project?.status || "").toUpperCase() === "ACTIVE" &&
              Array.isArray(project.employeeIds) &&
              project.employeeIds.includes(Number(user.id))
            )
          : rows.filter((project: any) => String(project?.status || "").toUpperCase() === "ACTIVE");
        if (relevantProjects.length > 0) {
          items.push({
            key: "projects",
            label: isNotificationEmployee ? "Project updates" : "Active projects",
            count: relevantProjects.length,
            href: isNotificationEmployee ? "/timesheet" : "/project-management",
            latestAt: relevantProjects.length,
          });
        }
      }

      setNotifications(items);
    } catch {
      setNotifications([]);
    }
  };

  const readAnnouncementError = (err: unknown, fallback: string) => {
    if (
      axios.isAxiosError(err) &&
      err.response?.data &&
      typeof (err.response.data as { message?: unknown }).message === "string"
    ) {
      return (err.response.data as { message: string }).message;
    }
    return fallback;
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPublishAnnouncements) return;

    const title = announcementForm.title.trim();
    const message = announcementForm.message.trim();
    if (!title || !message) {
      setAnnouncementFeedback({
        tone: "error",
        message: "Both title and message are required.",
      });
      return;
    }

    try {
      setAnnouncementBusy(true);
      await api.post("/api/announcements", { title, message });
      setAnnouncementForm({ title: "", message: "" });
      setAnnouncementFeedback({
        tone: "success",
        message: "Announcement posted successfully.",
      });
      await fetchAnnouncements();
    } catch (err) {
      setAnnouncementFeedback({
        tone: "error",
        message: readAnnouncementError(err, "Failed to post announcement."),
      });
    } finally {
      setAnnouncementBusy(false);
    }
  };

  const handleArchiveAnnouncement = async (announcementId: number) => {
    if (!canPublishAnnouncements) return;
    try {
      setAnnouncementBusy(true);
      await api.delete(`/api/announcements/${announcementId}`);
      setAnnouncementFeedback({
        tone: "success",
        message: "Announcement archived successfully.",
      });
      await fetchAnnouncements();
    } catch (err) {
      setAnnouncementFeedback({
        tone: "error",
        message: readAnnouncementError(err, "Failed to archive announcement."),
      });
    } finally {
      setAnnouncementBusy(false);
    }
  };

  const handleNotificationClick = (item: DashboardNotificationItem) => {
    const nextState = {
      ...notificationReads,
      [item.key]: item.latestAt,
    };
    setNotificationReads(nextState);
    writeNotificationState(notificationStorageKey, nextState);
    setIsNotificationOpen(false);
    if (item.itemType && item.itemId != null) {
      const query = new URLSearchParams({
        notificationId: `${item.key}-${item.latestAt}`,
        type: item.itemType,
        itemId: String(item.itemId),
      });
      navigate(`${item.href}?${query.toString()}`);
      return;
    }
    navigate(item.href);
  };

  const handleMarkAllNotificationsRead = () => {
    if (notifications.length === 0) return;
    const nextState = notifications.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.key] = item.latestAt;
        return acc;
      },
      { ...notificationReads }
    );
    setNotificationReads(nextState);
    writeNotificationState(notificationStorageKey, nextState);
  };

  const handleMarkNotificationRead = (item: DashboardNotificationItem) => {
    const nextState = {
      ...notificationReads,
      [item.key]: item.latestAt,
    };
    setNotificationReads(nextState);
    writeNotificationState(notificationStorageKey, nextState);
  };

  const punchErrorMessage = (err: unknown) => {
    if (
      axios.isAxiosError(err) &&
      err.response?.data &&
      typeof (err.response.data as { message?: unknown }).message === "string"
    ) {
      return (err.response.data as { message: string }).message;
    }
    return "Something went wrong. Try again.";
  };

  const handlePunchIn = async () => {
    if (!user?.id || !menuSettings.attendanceEnabled) return;
    setPunchBusy(true);
    setPunchFeedback(null);
    try {
      const payload = await buildPunchPayload();
      const updated = await punchInEmployee(Number(user.id), payload);
      setTodayAttendance(updated);
      setPunchFeedback("Punched in. Your location and time were saved.");
      const data = await getAttendanceStats();
      setAttendanceStats(data);
      fetchTodayPunchIns();
    } catch (e: unknown) {
      setPunchFeedback(punchErrorMessage(e));
    } finally {
      setPunchBusy(false);
    }
  };

  const handlePunchOut = async () => {
    if (!user?.id || !menuSettings.attendanceEnabled) return;
    setPunchBusy(true);
    setPunchFeedback(null);
    try {
      const payload = await buildPunchPayload();
      const updated = await punchOutEmployee(Number(user.id), payload);
      setTodayAttendance(updated);
      setPunchFeedback(
        updated.status === "HALF_DAY"
          ? "Punched out. Marked as half day (under 8 hours between in and out)."
          : "Punched out. Marked as present (8+ hours)."
      );
      const data = await getAttendanceStats();
      setAttendanceStats(data);
      fetchTodayPunchIns();
    } catch (e: unknown) {
      setPunchFeedback(punchErrorMessage(e));
    } finally {
      setPunchBusy(false);
    }
  };

  const canPunchIn = Boolean(user?.id) && !todayAttendance?.checkInTime;
  const canPunchOut =
    Boolean(user?.id) &&
    Boolean(todayAttendance?.checkInTime) &&
    !todayAttendance?.checkOutTime;
  const workedMinutes =
    todayAttendance?.checkInTime && todayAttendance?.checkOutTime
      ? dayjs(todayAttendance.checkOutTime).diff(dayjs(todayAttendance.checkInTime), "minute")
      : null;
  const workedDurationLabel =
    workedMinutes != null && workedMinutes >= 0
      ? `${Math.floor(workedMinutes / 60)}h ${workedMinutes % 60}m`
      : null;
  const remainingSecondsToPunchOut = todayAttendance?.checkInTime && !todayAttendance?.checkOutTime
    ? Math.max(
        0,
        8 * 60 * 60 - Math.floor((countdownNow - dayjs(todayAttendance.checkInTime).valueOf()) / 1000)
      )
    : null;
  const canCompleteFullDay = remainingSecondsToPunchOut != null && remainingSecondsToPunchOut <= 0;
  const todayStatus = todayAttendance?.status || "NOT_MARKED";
  const attendanceStatusClass =
    todayStatus === "PRESENT"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : todayStatus === "HALF_DAY"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : todayStatus === "CHECKED_IN"
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : "border-slate-200 bg-slate-100 text-slate-600";

  // Prepare data for chart
  const attendanceData = attendanceStats.map(stat => ({
    period: stat.month,
    present: stat.total ? (stat.presentCount / stat.total) * 100 : 0,
    absent: stat.total ? (stat.absentCount / stat.total) * 100 : 0,
    halfDay: stat.total ? (stat.halfDayCount / stat.total) * 100 : 0,
  }));

  const profileName = user?.firstName || user?.email?.split("@")[0] || "User";
  const topActions = (
    canManageEmployees
      ? hrDashboardQuickLinks
      : employeeDashboardQuickLinks
  ).slice(0, 4);
  const latestAttendance = attendanceStats[attendanceStats.length - 1];
  const presentCount = latestAttendance?.presentCount || 0;
  const absentCount = latestAttendance?.absentCount || 0;
  const attendanceTotal = latestAttendance?.total || 0;
  const presentPercent = attendanceTotal ? (presentCount / attendanceTotal) * 100 : 0;
  const absentPercent = attendanceTotal ? (absentCount / attendanceTotal) * 100 : 0;
  const punchInPercentBase = stats.totalEmployees > 0
    ? (todayPunchIns / stats.totalEmployees) * 100
    : 0;
  const punchInPercent = Math.max(0, Math.min(100, punchInPercentBase));
  const statusCards = useMemo(() => {
    type StatusCard = {
      title: string;
      value: number;
      subtitle: string;
      percent: number;
    };
    const cards: StatusCard[] = [];
    if (menuSettings.attendanceEnabled && canManageEmployees) {
      cards.push({
        title: "Total Punch-ins Today",
        value: todayPunchIns,
        subtitle: "Checked-in Status",
        percent: punchInPercent,
      });
    }
    if (menuSettings.attendanceEnabled && shouldShowPeopleInsights) {
      cards.push(
        {
          title: "Employee Absent Today",
          value: absentCount,
          subtitle: "Absent Status",
          percent: absentPercent,
        },
        {
          title: "Employee Present Today",
          value: presentCount,
          subtitle: "Present Status",
          percent: presentPercent,
        }
      );
    }
    if (menuSettings.timesheetEnabled && isHrOrOrgAdmin) {
      cards.push({
        title: "Active Projects",
        value: stats.activeProjects,
        subtitle: "Timesheet-linked projects",
        percent: stats.activeProjects > 0 ? 100 : 0,
      });
    }
    if (menuSettings.recruitmentEnabled && shouldShowPeopleInsights) {
      cards.push({
        title: "Open Positions",
        value: stats.openPositions,
        subtitle: "Hiring Status",
        percent: stats.openPositions > 0 ? 100 : 0,
      });
    }
    if (menuSettings.leaveManagementEnabled && shouldShowPeopleInsights) {
      cards.push({
        title: "Leave Requests",
        value: stats.leaveRequests,
        subtitle: "Pending Status",
        percent: stats.leaveRequests > 0 ? 100 : 0,
      });
    }
    return cards;
  }, [
    menuSettings.attendanceEnabled,
    menuSettings.timesheetEnabled,
    menuSettings.recruitmentEnabled,
    menuSettings.leaveManagementEnabled,
    canManageEmployees,
    isHrOrOrgAdmin,
    shouldShowPeopleInsights,
    todayPunchIns,
    punchInPercent,
    absentCount,
    absentPercent,
    presentCount,
    presentPercent,
    stats.openPositions,
    stats.activeProjects,
    stats.leaveRequests,
  ]);
  const chartPalette = ["#34d399", "#60a5fa", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];
  const departmentData =
    departmentBreakdown.length > 0
      ? departmentBreakdown
      : [{ name: "No department data", value: 1 }];
  const designationData =
    designationBreakdown.length > 0
      ? designationBreakdown
      : [{ name: "No designation data", value: 1 }];
  const projectedSalaryPayout = financialSummary.totalSalariesPaid;
  const projectedTravelExpenses = financialSummary.travelExpenses;
  const projectedTotalExpenses = financialSummary.totalExpenses;
  const projectedAccountBalance = financialSummary.accountBalance;
  const visibleActivities = recentActivities
    .filter((a) => {
      if (a.type === "timesheet" && !menuSettings.timesheetEnabled) return false;
      if (a.type === "job" && !menuSettings.recruitmentEnabled) return false;
      if (a.type === "leave" && !menuSettings.leaveManagementEnabled) return false;
      return true;
    })
    .slice(0, 5);
  const attendanceHeatmapCells = useMemo(() => {
    return attendanceStats.slice(-12).map((stat) => {
      const percent = stat.total ? Math.round((stat.presentCount / stat.total) * 100) : 0;
      return {
        label: stat.month,
        percent,
      };
    });
  }, [attendanceStats]);
  const lifecycleSnapshot = useMemo(() => {
    const inLast30Days = recentActivities.filter((activity) =>
      dayjs(activity.timestamp).isAfter(dayjs().subtract(30, "day"))
    );
    const onboarded = inLast30Days.filter((item) => item.type === "employee").length;
    const leaveUpdates = menuSettings.leaveManagementEnabled
      ? inLast30Days.filter((item) => item.type === "leave").length
      : 0;
    const timesheetUpdates = menuSettings.timesheetEnabled
      ? inLast30Days.filter((item) => item.type === "timesheet").length
      : 0;
    const hiringUpdates = menuSettings.recruitmentEnabled
      ? inLast30Days.filter((item) => item.type === "job").length
      : 0;
    return {
      onboarded,
      leaveUpdates,
      timesheetUpdates,
      hiringUpdates,
    };
  }, [
    recentActivities,
    menuSettings.leaveManagementEnabled,
    menuSettings.timesheetEnabled,
    menuSettings.recruitmentEnabled,
  ]);
  const totalPendingApprovals = adminApprovalMetrics.reduce(
    (sum, metric) => sum + Number(metric.count || 0),
    0
  );
  const teamPresentRate = presentPercent;
  const totalOrganizations = organizationOverview.length;
  const activeOrganizations = organizationOverview.filter((org) => org.active !== false).length;
  const disabledOrganizations = organizationOverview.filter((org) => org.active === false).length;
  const totalRegisteredUsers = organizationOverview.reduce(
    (sum, org) => sum + Number(org.userCount || 0),
    0
  );
  const totalActiveUsers = organizationOverview.reduce(
    (sum, org) => sum + Number(org.activeUserCount || 0),
    0
  );
  const totalActiveCapacity = organizationOverview.reduce(
    (sum, org) => sum + Number(org.maxActiveUsers || 0),
    0
  );
  const totalActiveProjects = organizationOverview.reduce(
    (sum, org) =>
      sum + (org.timesheetEnabled === false ? 0 : Number(org.activeProjectCount || 0)),
    0
  );
  const unreadNotifications = notifications.filter(
    (item) => (notificationReads[item.key] || 0) < item.latestAt
  );
  const unreadNotificationCount = unreadNotifications.reduce(
    (sum, item) => sum + Number(item.count || 0),
    0
  );

  if (isMainAdmin) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-4 px-2 pb-4">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-700 px-4 py-3 text-white">
            <h1 className="text-xl font-bold tracking-tight">Organization Overview</h1>
            <p className="mt-1 text-xs text-sky-50">
              Main admin view is organization-level only.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 bg-slate-50 p-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Organizations", value: totalOrganizations, tone: "text-slate-900" },
              { title: "Active Organizations", value: activeOrganizations, tone: "text-emerald-700" },
              { title: "Disabled Organizations", value: disabledOrganizations, tone: "text-rose-700" },
              { title: "Registered Users", value: totalRegisteredUsers, tone: "text-sky-700" },
              { title: "Active Users", value: totalActiveUsers, tone: "text-indigo-700" },
                { title: "Active Projects", value: totalActiveProjects, tone: "text-cyan-700" },
              { title: "Active User Capacity", value: totalActiveCapacity, tone: "text-violet-700" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase text-slate-500">{item.title}</p>
                <p className={`mt-1 text-2xl font-bold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Organization</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Code</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Registered Users</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Active Users</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Active Projects</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Active Limit</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {organizationOverview.map((org) => (
                  <tr key={org.id}>
                    <td className="px-4 py-2 text-sm font-medium text-slate-900">{org.name}</td>
                    <td className="px-4 py-2 text-sm text-slate-700">{org.code || "-"}</td>
                    <td className="px-4 py-2 text-sm text-slate-700">{org.userCount || 0}</td>
                    <td className="px-4 py-2 text-sm text-slate-700">{org.activeUserCount || 0}</td>
                    <td className="px-4 py-2 text-sm text-slate-700">
                      {org.timesheetEnabled === false ? "-" : org.activeProjectCount || 0}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-700">{org.maxActiveUsers || 0}</td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          org.active === false ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {org.active === false ? "Disabled" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
                {organizationOverview.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                      No organization data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-4 rounded-3xl bg-gradient-to-b from-slate-50 via-white to-sky-50/40 p-3 pb-5">
      <section className="overflow-visible rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-700 px-5 py-4 text-white">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome back, {profileName}!</h1>
              <p className="mt-1 text-sm text-sky-50">{dayjs().format("dddd, DD MMM YYYY")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isMainAdmin && (
                <div ref={notificationDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen((prev) => !prev)}
                    className="relative inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    <Bell className="mr-1 h-3.5 w-3.5" />
                    Notifications
                    {unreadNotificationCount > 0 && (
                      <span className="ml-2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                        {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  {isNotificationOpen && (
                    <div className="absolute right-0 top-full z-[60] mt-2 w-80 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl ring-1 ring-black/5">
                      <div className="flex items-center justify-between px-2 py-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Notifications
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                            Unread: {unreadNotificationCount}
                          </span>
                          {unreadNotificationCount > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllNotificationsRead}
                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 space-y-1">
                        {notifications.length > 0 ? (
                          notifications.map((item) => {
                            const isUnread = (notificationReads[item.key] || 0) < item.latestAt;
                            return (
                              <div
                                key={item.key}
                                className={`rounded-xl border px-3 py-2 transition ${
                                  isUnread
                                    ? "border-sky-200 bg-sky-50 hover:bg-sky-100"
                                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationClick(item)}
                                    className="flex min-w-0 flex-1 items-center justify-between text-left"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-slate-800">{item.label}</p>
                                      <p className="text-[11px] text-slate-500">{isUnread ? "Unread" : "Read"}</p>
                                    </div>
                                    <span className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold ${
                                      isUnread ? "bg-sky-100 text-sky-700" : "bg-slate-200 text-slate-600"
                                    }`}>
                                      {item.count}
                                    </span>
                                  </button>
                                  {isUnread && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkNotificationRead(item)}
                                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                            No recent notifications.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {topActions.slice(0, 3).map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
                >
                  <action.icon className="mr-1 h-3.5 w-3.5" />
                  {action.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {menuSettings.attendanceEnabled && (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4 shadow-sm lg:col-span-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-emerald-900">Attendance Summary</h2>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${attendanceStatusClass}`}>
                {todayStatus.replace("_", " ")}
              </span>
            </div>
            {todayAttendanceLoading ? (
              <p className="text-sm text-slate-500">Loading attendance...</p>
            ) : (
              <div className="space-y-2 text-xs text-slate-700">
                <p>{todayAttendanceHeadline(todayAttendance)}</p>
                <p>
                  In: {todayAttendance?.checkInTime ? dayjs(todayAttendance.checkInTime).format("HH:mm:ss") : "—"} | Out:{" "}
                  {todayAttendance?.checkOutTime ? dayjs(todayAttendance.checkOutTime).format("HH:mm:ss") : "—"}
                </p>
                {workedDurationLabel && <p>Worked: {workedDurationLabel}</p>}
                {remainingSecondsToPunchOut != null && !canCompleteFullDay && (
                  <p>Full-day ETA: {formatRemainingTime(remainingSecondsToPunchOut)}</p>
                )}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handlePunchIn}
                    disabled={!canPunchIn || punchBusy}
                    className="mr-2 inline-flex items-center rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    <LogIn className="mr-1 h-3.5 w-3.5" />
                    Punch In
                  </button>
                  <button
                    type="button"
                    onClick={handlePunchOut}
                    disabled={!canPunchOut || punchBusy}
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                  >
                    <LogOut className="mr-1 h-3.5 w-3.5" />
                    Punch Out
                  </button>
                </div>
                {punchFeedback && (
                  <p className={`mt-2 rounded-lg border px-2 py-1 text-[11px] ${
                    punchFeedback.startsWith("Punched")
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}>
                    {punchFeedback}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!isMainAdmin && (
          <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-sky-900">Profile Snapshot</h2>
            <div className="mt-2 mb-3">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={profileName}
                  className="h-14 w-14 rounded-full border border-sky-200 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-sky-200 bg-sky-100 text-sm font-semibold text-sky-800">
                  {String(profileName || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <p>{profileName}</p>
              <p>{String(user?.role || "-").toUpperCase()}</p>
              <p className="truncate">{user?.email || "-"}</p>
            </div>
          </div>
        )}

        {!isMainAdmin && menuSettings.leaveManagementEnabled && (
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-violet-900">Leave Balance</h2>
            <p className="mt-1 text-xs text-slate-500">{leaveBalanceSummary.totalRemaining} days remaining</p>
            <div className="mt-2 space-y-1 text-xs text-slate-700">
              {leaveBalanceSummary.byType.slice(0, 3).map((item) => (
                <div key={item.typeName} className="flex justify-between">
                  <span>{item.typeName}</span>
                  <span className="font-semibold">{item.remaining}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isMainAdmin && (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-amber-900">Upcoming Holidays</h2>
            <div className="mt-2 space-y-1 text-xs text-slate-700">
              {upcomingHolidays.slice(0, 3).map((holiday) => (
                <div key={holiday.id}>
                  <p className="font-semibold">{holiday.name}</p>
                  <p className="text-slate-500">{dayjs(holiday.date).format("DD MMM")}</p>
                </div>
              ))}
              {upcomingHolidays.length === 0 && <p className="text-slate-500">No upcoming holidays</p>}
            </div>
          </div>
        )}

        {!isMainAdmin && (
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-4 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-teal-900">Payslip & Salary</h2>
            <p className="mt-1 text-xl font-bold text-slate-900">₹{projectedSalaryPayout.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Travel: ₹{projectedTravelExpenses.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Balance: ₹{projectedAccountBalance.toLocaleString()}</p>
            <Link to="/payroll/payslips" className="mt-2 inline-block text-xs font-semibold text-sky-700 hover:text-sky-900">
              Open payslips
            </Link>
          </div>
        )}

        {statusCards.length > 0 && (
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 shadow-sm lg:col-span-6">
            <h2 className="mb-2 text-sm font-semibold text-indigo-900">Live KPI Overview</h2>
            <div className="grid grid-cols-2 gap-2">
              {statusCards.map((card, index) => (
                <div
                  key={card.title}
                  className={`rounded-xl border px-3 py-2 ${
                    index % 4 === 0
                      ? "border-sky-200 bg-sky-50"
                      : index % 4 === 1
                        ? "border-rose-200 bg-rose-50"
                        : index % 4 === 2
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-violet-200 bg-violet-50"
                  }`}
                >
                  <p className="text-[11px] text-slate-500">{card.title}</p>
                  <p className="text-xl font-bold text-slate-900">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isMainAdmin && (
          <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-4 shadow-sm lg:col-span-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="inline-flex items-center text-sm font-semibold text-slate-900">
                <Megaphone className="mr-1 h-4 w-4 text-sky-600" />
                Announcements
              </h2>
              <span className="text-[11px] text-slate-500">Active: {announcements.length}</span>
            </div>
            <div className="max-h-44 space-y-2 overflow-auto pr-1">
              {announcementLoading ? (
                <p className="text-sm text-slate-500">Loading announcements...</p>
              ) : announcements.length === 0 ? (
                <p className="text-sm text-slate-500">No active announcements.</p>
              ) : (
                announcements.slice(0, 5).map((announcement) => (
                  <div key={announcement.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{announcement.title}</p>
                        <p className="text-xs text-slate-600">{announcement.message}</p>
                      </div>
                      {canPublishAnnouncements && (
                        <button
                          type="button"
                          onClick={() => handleArchiveAnnouncement(announcement.id)}
                          disabled={announcementBusy}
                          className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {!isMainAdmin && !hasPermission("manage", "employees") && (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 shadow-sm lg:col-span-3">
            <h2 className="text-sm font-semibold text-amber-900">Tasks / Goals</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {menuSettings.leaveManagementEnabled && (
                <div className="rounded-lg bg-amber-50 px-2 py-1 text-amber-700">
                  Leave: {employeeTaskSummary.pendingLeaves}
                </div>
              )}
              {menuSettings.timesheetEnabled && (
                <div className="rounded-lg bg-sky-50 px-2 py-1 text-sky-700">
                  Timesheet: {employeeTaskSummary.pendingTimesheets}
                </div>
              )}
              {menuSettings.travelEnabled && (
                <div className="rounded-lg bg-violet-50 px-2 py-1 text-violet-700">
                  Travel: {employeeTaskSummary.pendingTravel}
                </div>
              )}
              {menuSettings.timesheetEnabled && (
                <div className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">
                  Done: {employeeTaskSummary.submittedGoals}
                </div>
              )}
            </div>
          </div>
        )}

        {(isManager || hasPermission("manage", "employees")) && (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 shadow-sm lg:col-span-3">
            <h2 className="text-sm font-semibold text-emerald-900">Performance Snapshot</h2>
            <div className="mt-2 space-y-1 text-xs text-slate-700">
              <p>Present rate: <span className="font-semibold">{teamPresentRate.toFixed(1)}%</span></p>
              <p>Pending approvals: <span className="font-semibold">{totalPendingApprovals}</span></p>
              <p>Upcoming leaves: <span className="font-semibold">{teamLeaveCalendar.length}</span></p>
            </div>
          </div>
        )}

        {canSeeApprovalCenter && (
          <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 shadow-sm lg:col-span-4">
            <h2 className="mb-2 text-sm font-semibold text-orange-900">Pending Approvals</h2>
            <div className="max-h-40 space-y-2 overflow-auto pr-1">
              {adminApprovalMetrics.length > 0 ? (
                adminApprovalMetrics.map((metric) => (
                  <Link key={metric.key} to={metric.href} className="block rounded-xl border border-orange-200 bg-white/90 px-3 py-2 transition hover:border-orange-300 hover:bg-orange-50/80">
                    <p className="text-xs font-semibold text-slate-800">{metric.title}</p>
                    <p className="text-[11px] text-slate-500">{metric.count} pending • Priority {metric.priorityScore}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">No pending approvals.</p>
              )}
            </div>
          </div>
        )}

        {(isManager || hasPermission("manage", "employees")) && menuSettings.attendanceEnabled && (
          <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-4 shadow-sm lg:col-span-4">
            <h2 className="mb-2 text-sm font-semibold text-cyan-900">Attendance Heatmap</h2>
            <div className="grid grid-cols-4 gap-2">
              {attendanceHeatmapCells.slice(-8).map((cell) => (
                <div
                  key={cell.label}
                  className={`rounded-lg px-2 py-2 text-center text-[11px] ${
                    cell.percent >= 80 ? "bg-emerald-50 text-emerald-700" : cell.percent >= 60 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  <p className="truncate">{cell.label}</p>
                  <p className="font-semibold">{cell.percent}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasPermission("manage", "employees") && (
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 shadow-sm lg:col-span-4">
            <h2 className="mb-2 text-sm font-semibold text-violet-900">Hiring Pipeline</h2>
            <div className="grid grid-cols-2 gap-2">
              {hiringPipeline.map((stage) => (
                <div key={stage.status} className="rounded-xl border border-violet-200 bg-white/90 px-2 py-2 text-xs">
                  <p className="text-slate-500">{stage.status.replace("_", " ")}</p>
                  <p className="text-lg font-bold text-slate-900">{stage.count}</p>
                </div>
              ))}
              {hiringPipeline.length === 0 && <p className="text-sm text-slate-500">No hiring data.</p>}
            </div>
          </div>
        )}

        {shouldShowPeopleInsights && (
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 shadow-sm lg:col-span-4">
            <h2 className="mb-2 text-sm font-semibold text-indigo-900">Employee Lifecycle</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-indigo-50 px-2 py-2">Onboarded: <span className="font-semibold">{lifecycleSnapshot.onboarded}</span></div>
              {menuSettings.leaveManagementEnabled && (
                <div className="rounded-lg bg-sky-50 px-2 py-2">Leave: <span className="font-semibold">{lifecycleSnapshot.leaveUpdates}</span></div>
              )}
              {menuSettings.timesheetEnabled && (
                <div className="rounded-lg bg-cyan-50 px-2 py-2">Timesheet: <span className="font-semibold">{lifecycleSnapshot.timesheetUpdates}</span></div>
              )}
              {menuSettings.recruitmentEnabled && (
                <div className="rounded-lg bg-blue-50 px-2 py-2">Hiring: <span className="font-semibold">{lifecycleSnapshot.hiringUpdates}</span></div>
              )}
            </div>
          </div>
        )}

        {canSeeApprovalCenter && (
          <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-4 shadow-sm lg:col-span-4">
            <h2 className="mb-2 text-sm font-semibold text-rose-900">Compliance Alerts</h2>
            <div className="max-h-40 space-y-2 overflow-auto pr-1">
              {complianceAlerts.map((alert) => (
                <div key={alert.key} className="rounded-xl border border-rose-200 bg-white/90 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-800">{alert.title}</p>
                  <p className="text-[11px] text-slate-500">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {shouldShowPeopleInsights && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm lg:col-span-4">
          <h2 className="mb-2 text-sm font-semibold text-blue-900">Workforce Mix</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-40 rounded-xl border border-blue-200 bg-white/90 p-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={departmentData} dataKey="value" nameKey="name" innerRadius={22} outerRadius={44}>
                    {departmentData.map((item, idx) => (
                      <Cell key={`${item.name}-dept-mini`} fill={chartPalette[idx % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-40 rounded-xl border border-indigo-200 bg-white/90 p-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={designationData} dataKey="value" nameKey="name" innerRadius={22} outerRadius={44}>
                    {designationData.map((item, idx) => (
                      <Cell key={`${item.name}-desig-mini`} fill={chartPalette[idx % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        )}

        {menuSettings.attendanceEnabled && (
          <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 shadow-sm lg:col-span-8">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-sky-900">
                {canManageEmployees ? "Team Attendance Performance" : "Your Attendance Performance"}
              </h2>
              <div className="flex gap-2">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs text-slate-700"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
                {shouldShowPeopleInsights && (
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs text-slate-700"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dep) => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="h-52">
              {loadingStats ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                  Loading attendance stats...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                    <Tooltip formatter={(value) => (typeof value === "number" ? `${value.toFixed(1)}%` : value)} />
                    <Bar dataKey="present" fill="#0ea5e9" name="Present" />
                    <Bar dataKey="absent" fill="#f97316" name="Absent" />
                    <Bar dataKey="halfDay" fill="#8b5cf6" name="Half Day" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {shouldShowPeopleInsights && (
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-4 shadow-sm lg:col-span-4">
            <h2 className="mb-2 text-sm font-semibold text-teal-900">Recent Activities</h2>
          <div className="max-h-52 space-y-2 overflow-auto pr-1">
            {visibleActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-2 rounded-xl border border-teal-200 bg-white/90 p-2.5">
                  <div className="rounded-lg bg-white p-1.5 text-sky-700 shadow-sm">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">{activity.title}</p>
                    <p className="truncate text-[11px] text-slate-500">{activity.description}</p>
                  </div>
                </div>
              );
            })}
            {visibleActivities.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                No recent activity available.
              </div>
            )}
          </div>
        </div>
        )}

        {canPublishAnnouncements && (
          <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 shadow-sm lg:col-span-4">
            <h2 className="text-sm font-semibold text-sky-900">Post Announcement</h2>
            <form className="mt-2 space-y-2" onSubmit={handleAnnouncementSubmit}>
              <input
                type="text"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                placeholder="Announcement title"
                maxLength={160}
              />
              <textarea
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, message: e.target.value }))}
                className="h-20 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                placeholder="Write announcement..."
                maxLength={4000}
              />
              <LoadingButton
                type="submit"
                loading={announcementBusy}
                loadingText="Posting..."
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                leadingIcon={<Send className="mr-1 h-3.5 w-3.5" />}
              >
                Post
              </LoadingButton>
            </form>
            {announcementFeedback && (
              <p className={`mt-2 rounded-lg border px-2.5 py-2 text-[11px] ${
                announcementFeedback.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}>
                {announcementFeedback.message}
              </p>
            )}
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-slate-600">
                Previous Announcements ({announcementHistory.length})
              </p>
              <div className="mt-1 max-h-24 space-y-1 overflow-auto pr-1">
                {announcementHistory.slice(0, 5).map((announcement) => (
                  <div key={`history-compact-${announcement.id}`} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                    <p className="truncate text-[11px] font-semibold text-slate-700">{announcement.title}</p>
                  </div>
                ))}
                {announcementHistory.length === 0 && (
                  <p className="text-[11px] text-slate-500">No archived announcements yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {hasPermission("manage", "employees") && (
          <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-4 shadow-sm lg:col-span-4">
            <h2 className="text-sm font-semibold text-rose-900">Attrition Alerts</h2>
            <div className="mt-2 space-y-2 text-xs">
              <div className="rounded-lg bg-rose-50 px-2 py-2 text-rose-700">Inactive: {attritionInsight.inactiveCount}</div>
              <div className="rounded-lg bg-amber-50 px-2 py-2 text-amber-700">Ratio: {attritionInsight.inactiveRatio.toFixed(1)}%</div>
              <div className="rounded-lg bg-slate-50 px-2 py-2 text-slate-700">Total Expenses: ₹{projectedTotalExpenses.toLocaleString()}</div>
            </div>
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          Refreshing dashboard data...
        </div>
      )}
    </div>
  );
}
