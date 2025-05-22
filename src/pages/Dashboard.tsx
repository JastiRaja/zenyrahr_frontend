import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Clock,
  Calendar,
  ArrowUp,
  ArrowDown,
  Bell,
  Briefcase,
  DollarSign,
  Target,
  UserPlus,
  CheckCircle,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import api from "../api/axios";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { getAllEmployees } from '../api/payroll';

dayjs.extend(relativeTime);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

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
  employeeGrowth: number;
  attendanceTrend: number;
  leaveRequestTrend: number;
  positionTrend: number;
}

interface EmployeeStats {
  leaveBalance: number;
  attendanceRate: number;
  pendingRequests: number;
  upcomingLeaves: number;
}

type AttendanceStats = {
  month: string;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  total: number;
};

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    averageAttendance: 0,
    leaveRequests: 0,
    openPositions: 0,
    employeeGrowth: 0,
    attendanceTrend: 0,
    leaveRequestTrend: 0,
    positionTrend: 0,
  });
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats>({
    leaveBalance: 0,
    attendanceRate: 0,
    pendingRequests: 0,
    upcomingLeaves: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    getAllEmployees().then(emps => {
      const uniqueDeps = Array.from(new Set(emps.map(e => e.department).filter(Boolean)));
      setDepartments(uniqueDeps);
    });
  }, []);

  useEffect(() => {
    if (hasPermission("manage", "employees")) {
      fetchDashboardData();
    } else {
      fetchEmployeeDashboardData();
    }
    fetchRecentActivities();
    getAttendanceStats()
      .then(data => setAttendanceStats(data))
      .catch(() => setAttendanceStats([]))
      .finally(() => setLoadingStats(false));
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      if (hasPermission("manage", "employees")) {
        fetchDashboardData();
      } else {
        fetchEmployeeDashboardData();
      }
      fetchRecentActivities();
      getAttendanceStats()
        .then(data => setAttendanceStats(data))
        .catch(() => setAttendanceStats([]));
    }, 30000);
    return () => clearInterval(interval);
  }, [period, department]);

  const fetchEmployeeDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch employee-specific data
      const [leaveResponse, attendanceResponse, requestsResponse] =
        await Promise.all([
          api.get(`/api/leave-requests/employee/${user.id}`),
          api.get(`/api/timesheet/employee/${user.id}`),
          api.get(
            `/api/leave-requests/employee/${user.id}/pending`
          ),
        ]);

      // Calculate leave balance and upcoming leaves
      const leaves = leaveResponse.data || [];
      const upcomingLeaves = leaves.filter(
        (leave: any) =>
          dayjs(leave.startDate).isAfter(dayjs()) && leave.status === "APPROVED"
      ).length;

      // Calculate attendance rate
      const timesheets = attendanceResponse.data || [];
      const lastMonthTimesheets = timesheets.filter((ts: any) =>
        dayjs(ts.date).isAfter(dayjs().subtract(1, "month"))
      );
      const attendanceRate =
        lastMonthTimesheets.length > 0
          ? (lastMonthTimesheets.filter((ts: any) => ts.status === "APPROVED")
              .length /
              lastMonthTimesheets.length) *
            100
          : 0;

      // Get pending requests
      const pendingRequests = requestsResponse.data?.length || 0;

      setEmployeeStats({
        leaveBalance:
          20 - leaves.filter((l: any) => l.status === "APPROVED").length, // Assuming 20 days annual leave
        attendanceRate,
        pendingRequests,
        upcomingLeaves,
      });

      // Generate personal chart data
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const month = dayjs().subtract(i, "month");
        const monthTimesheets = timesheets.filter(
          (ts: any) => dayjs(ts.date).format("MMM") === month.format("MMM")
        );
        return {
          month: month.format("MMM"),
          attendance:
            monthTimesheets.length > 0
              ? (monthTimesheets.filter((ts: any) => ts.status === "APPROVED")
                  .length /
                  monthTimesheets.length) *
                100
              : 0,
          target: 98,
        };
      }).reverse();

      setChartData(last6Months);
      setError(null);
    } catch (err) {
      console.error("Error fetching employee dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all required data in parallel, including recruitment details
      const [employeesResponse, leaveRequestsResponse, recruitmentResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/employees`),
        axios.get(`${API_BASE_URL}/api/leave-requests`),
        axios.get(`${API_BASE_URL}/api/recruitment-details`),
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
        employeeGrowth: Number(employeeGrowth),
        attendanceTrend,
        leaveRequestTrend: Number(leaveRequestTrend),
        positionTrend,
      });

      // Generate chart data
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const month = dayjs().subtract(i, "month");
        return {
          month: month.format("MMM"),
          attendance: 95 + Math.random() * 5,
          target: 98,
          revenue: Math.floor(Math.random() * 20000) + 40000,
        };
      }).reverse();

      setChartData(last6Months);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const [
        employeesResponse,
        leaveRequestsResponse,
        timesheetsResponse,
        jobPostingsResponse,
      ] = await Promise.all([
        api.get(`/auth/employees`),
        api.get(`/api/leave-requests`),
        api.get(`/api/timesheet`),
        api.get(`/api/recruitment-details`),
      ]);

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

      // Process timesheets (last 7 days)
      if (timesheetsResponse.data) {
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

  // Calculate real-time average attendance from attendanceStats
  const totalPresent = attendanceStats.reduce((sum, stat) => sum + stat.presentCount, 0);
  const totalRecords = attendanceStats.reduce((sum, stat) => sum + stat.total, 0);
  const averageAttendance = totalRecords ? (totalPresent / totalRecords) * 100 : 0;

  const dashboardStats = [
    {
      name: "Total Employees",
      stat: stats.totalEmployees.toString(),
      icon: Users,
      change: `${stats.employeeGrowth}%`,
      changeType: stats.employeeGrowth >= 0 ? "increase" : "decrease",
    },
    {
      name: "Average Attendance",
      stat: `${averageAttendance.toFixed(1)}%`,
      icon: Clock,
      change: `${stats.attendanceTrend}%`,
      changeType: stats.attendanceTrend >= 0 ? "increase" : "decrease",
    },
    {
      name: "Leave Requests",
      stat: stats.leaveRequests.toString(),
      icon: Calendar,
      change: `${stats.leaveRequestTrend}%`,
      changeType: stats.leaveRequestTrend <= 0 ? "increase" : "decrease",
    },
    {
      name: "Open Positions",
      stat: stats.openPositions.toString(),
      icon: BarChart3,
      change: `${stats.positionTrend}%`,
      changeType: stats.positionTrend >= 0 ? "increase" : "decrease",
    },
  ];

  const employeeStatCards = [
    {
      name: "Leave Balance",
      stat: `${employeeStats.leaveBalance} days`,
      icon: Calendar,
      change: `${employeeStats.upcomingLeaves} upcoming`,
      changeType: "neutral",
    },
    {
      name: "Attendance Rate",
      stat: `${employeeStats.attendanceRate.toFixed(1)}%`,
      icon: Clock,
      change: "Last 30 days",
      changeType: employeeStats.attendanceRate >= 95 ? "increase" : "decrease",
    },
    {
      name: "Pending Requests",
      stat: employeeStats.pendingRequests.toString(),
      icon: Bell,
      change: "Awaiting approval",
      changeType: "neutral",
    },
    {
      name: "Performance Score",
      stat: "4.2/5",
      icon: Target,
      change: "Last review",
      changeType: "increase",
    },
  ];

  const quickActions = [
    {
      name: "Add Employee",
      icon: Users,
      color: "bg-blue-500",
      href: "/employees/add",
    },
    {
      name: "Post Job",
      icon: Briefcase,
      color: "bg-purple-500",
      href: "/recruitment/post",
    },
    // {
    //   name: "Review Performance",
    //   icon: Target,
    //   color: "bg-green-500",
    //   href: "/performance",
    // },
    // { name: 'Process Payroll', icon: DollarSign, color: 'bg-pink-500', href: '/payroll' },
  ];

  const employeeQuickActions = [
    {
      name: "Submit Timesheet",
      icon: Clock,
      color: "bg-blue-500",
      href: "/timesheet/submit",
    },
    {
      name: "Request Leave",
      icon: Calendar,
      color: "bg-purple-500",
      href: "/leave/request",
    },
    {
      name: "Submit Expense",
      icon: DollarSign,
      color: "bg-green-500",
      href: "/travel/submit-expense",
    },
    {
      name: "View Performance",
      icon: Target,
      color: "bg-pink-500",
      href: "/performance",
    },
  ];

  const getAttendanceStats = async () => {
    // console.log("Fetching attendance stats with filters...", period, department);
    const response = await api.get('/api/payroll/attendance/stats', {
      params: { period, department }
    });
    return response.data;
  };

  // Prepare data for chart
  const attendanceData = attendanceStats.map(stat => ({
    period: stat.month,
    present: stat.total ? (stat.presentCount / stat.total) * 100 : 0,
    absent: stat.total ? (stat.absentCount / stat.total) * 100 : 0,
    halfDay: stat.total ? (stat.halfDayCount / stat.total) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back,{" "}
            {user?.firstName || user?.email?.split("@")[0] || "User"}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {hasPermission("manage", "employees")
              ? "Here's what's happening with your team today."
              : "Here's your personal dashboard overview."}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* <button className="btn-secondary flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </button> */}
          {/* {hasPermission("manage", "employees") && (
            <button className="btn-primary">View Reports</button>
          )} */}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(hasPermission("manage", "employees")
          ? quickActions
          : employeeQuickActions
        ).map((action) => (
          <a
            key={action.name}
            href={action.href}
            className="p-4 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-4"
          >
            <div className={`p-3 rounded-lg ${action.color}`}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {action.name}
              </h3>
            </div>
          </a>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(hasPermission("manage", "employees")
          ? dashboardStats
          : employeeStatCards
        ).map((item) => {
          const Icon = item.icon;
          const Arrow =
            item.changeType === "increase"
              ? ArrowUp
              : item.changeType === "decrease"
              ? ArrowDown
              : null;
          return (
            <div
              key={item.name}
              className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {item.stat}
                        </div>
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            item.changeType === "increase"
                              ? "text-green-600"
                              : item.changeType === "decrease"
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {Arrow && (
                            <Arrow className="h-4 w-4 flex-shrink-0 self-center" />
                          )}
                          <span className="ml-1">{item.change}</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Attendance Performance */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {hasPermission("manage", "employees")
              ? "Team Attendance Performance"
              : "Your Attendance Performance"}
          </h2>
          <div className="flex gap-4 mb-4">
            <select value={period} onChange={e => setPeriod(e.target.value)} className="border rounded px-2 py-1">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            <select value={department} onChange={e => setDepartment(e.target.value)} className="border rounded px-2 py-1">
              <option value="">All Departments</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} tickFormatter={tick => `${tick}%`} />
                <Tooltip formatter={value => typeof value === 'number' ? value.toFixed(1) + '%' : value} />
                <Bar dataKey="present" fill="#8b5cf6" name="Present" />
                <Bar dataKey="absent" fill="#f87171" name="Absent" />
                <Bar dataKey="halfDay" fill="#fbbf24" name="Half Day" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {hasPermission("manage", "employees") ? (
          // Revenue Trends for admins
          <div>
            {/* <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div> */}
          </div>
        ) : (
          // Leave Calendar for employees
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Leave Calendar
            </h2>
            <div className="space-y-4">
              {recentActivities
                .filter((activity) => activity.type === "leave")
                .slice(0, 5)
                .map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {leave.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {leave.description}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {dayjs(leave.timestamp).format("MMM D")}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {/* <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {hasPermission('manage', 'employees') ? 'Team Activity' : 'Your Recent Activity'}
          </h2>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities
                .filter(activity => !hasPermission('manage', 'employees') 
                  ? activity.description.includes(user?.firstName || '') 
                  : true)
                .map((activity, idx) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {idx !== recentActivities.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-violet-500 flex items-center justify-center ring-8 ring-white">
                              <Icon className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {activity.title}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {activity.description}
                              </p>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              {dayjs(activity.timestamp).fromNow()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </div> */}
    </div>
  );
}
