import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import ModuleAccessRoute from "./components/ModuleAccessRoute";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import AddEmployee from "./pages/employees/AddEmployee";
import SelfService from "./pages/SelfService";
import Recruitment from "./pages/Recruitment";
import PostJob from "./pages/recruitment/PostJob";
import Timesheet from "./pages/Timesheet";
import SubmitTimesheet from "./pages/timesheet/SubmitTimesheet";
import MyProjects from "./pages/timesheet/MyProjects";
import TimesheetApprovals from "./pages/approvals/TimesheetApprovals";
import Leave from "./pages/Leave";
import RequestLeave from "./pages/leave/RequestLeave";
import HolidayList from "./pages/leave/HolidayList";
import LeaveApprovals from "./pages/approvals/LeaveApprovals";
import Analytics from "./pages/Analytics";
import Performance from "./pages/Performance";
import Travel from "./pages/Travel";
import NewTripRequest from "./pages/travel/NewTripRequest";
import SubmitExpense from "./pages/travel/SubmitExpense";
import ExpenseApprovals from "./pages/approvals/ExpenseApprovals";
import Wellness from "./pages/Wellness";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import ProjectManagement from "./admin management/ProjectManagement";
import UpdateEmployee from "./pages/Employee/UpdateEmployee";
import ServiceRequest from "./pages/ServiceRequest";
import AdminLeaveBalances from "./admin management/AdminLeaveBalances";
import LeavePolicies from "./admin management/LeavePolicies";
import AdminLeaveRequests from "./admin management/AdminLeaveRequests";
import LeaveTypeAdd from "./admin management/LeaveTypeAdd";
import LeaveSummary from "./pages/leave/LeaveSummary";
import AssignManager from "./admin management/AssignManager";
import ManageEntities from "./admin management/ManageEntities";
import AdminServiceRequestList from "./admin management/AdminServiceRequestList";
import AdminServiceRequestDetail from "./admin management/AdminServiceRequestDetail";
import JobDetails from './pages/JobDetails';
import RecruitmentJobDetails from './pages/recruitment/JobDetails';
import JobOpenings from './pages/JobOpenings';
import ReferralRequests from './pages/recruitment/ReferralRequests';
import VerifyOTP from "./pages/VerifyOTP";
import PayrollLayout from "./pages/payroll/PayrollLayout";
import Payslips from "./pages/payroll/Payslips";
import AttendanceManagement from "./pages/payroll/AttendanceManagement";
import PayscaleManagement from "./pages/payroll/PayscaleManagement";
import PayrollGeneration from './pages/payroll/PayrollGeneration';
import RoleBasedRoute from "./components/RoleBasedRoute";
import AdminHolidays from "./pages/admin/AdminHolidays";
import AdminPayslipManagement from "./pages/payroll/AdminPayslipManagement";
import Organizations from "./pages/admin/Organizations";
import ApprovalHierarchy from "./pages/admin/ApprovalHierarchy";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route
                path="employees"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["employeeManagementEnabled"]}
                    loadingMessage="Loading employee management access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "read", subject: "employees" },
                      ]}
                    >
                      <Employees />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="employees/add"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["employeeManagementEnabled"]}
                    loadingMessage="Loading employee management access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "manage", subject: "employees" },
                      ]}
                    >
                      <AddEmployee />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/admin-leave/requests"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["leaveManagementEnabled"]}
                    loadingMessage="Loading leave access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "approve", subject: "leave" },
                      ]}
                    >
                      <AdminLeaveRequests />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/admin-leave/balance"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["leaveManagementEnabled"]}
                    loadingMessage="Loading leave access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "manage", subject: "leave-balance" },
                      ]}
                    >
                      <AdminLeaveBalances />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/admin-leave/policies"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["leaveManagementEnabled"]}
                    loadingMessage="Loading leave access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "manage", subject: "leave-policies" },
                      ]}
                    >
                      <LeavePolicies />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/admin-leave/types" // ✅ New Leave Types Page Route
                element={
                  <ModuleAccessRoute
                    requiredFlags={["leaveManagementEnabled"]}
                    loadingMessage="Loading leave access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "manage", subject: "leave-types" },
                      ]}
                    >
                      <LeaveTypeAdd />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/admin/assign-manager"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["employeeManagementEnabled"]}
                    loadingMessage="Loading employee management access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "manage", subject: "employees" },
                      ]}
                    >
                      <AssignManager />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/admin/manage-entities"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["employeeManagementEnabled"]}
                    loadingMessage="Loading employee management access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "manage", subject: "employees" },
                      ]}
                    >
                      <ManageEntities />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/admin/approval-hierarchy"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "settings" },
                    ]}
                  >
                    <ApprovalHierarchy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/selfservice/:id"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["selfServiceEnabled"]}
                    loadingMessage="Loading self-service access..."
                  >
                    <SelfService />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="self-service"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["selfServiceEnabled"]}
                    loadingMessage="Loading self-service access..."
                  >
                    <SelfService />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/service-request"
                element={<ServiceRequest />}
              />{" "}
              {/* Add the new route */}
              <Route
                path="/admin/service-requests"
                element={<AdminServiceRequestList />}
              />
              <Route
                path="/admin/service-request/:id"
                element={<AdminServiceRequestDetail />}
              />
              <Route path="/UpdateEmployee" element={<UpdateEmployee />} />
              <Route
                path="recruitment"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["recruitmentEnabled"]}
                    loadingMessage="Loading recruitment access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "read", subject: "employees" },
                      ]}
                    >
                      <Recruitment />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="recruitment/post"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["recruitmentEnabled"]}
                    loadingMessage="Loading recruitment access..."
                  >
                    <RoleBasedRoute allowedRoles={["HR"]}>
                      <ProtectedRoute
                        requiredPermissions={[
                          { action: "manage", subject: "recruitment" },
                        ]}
                      >
                        <PostJob />
                      </ProtectedRoute>
                    </RoleBasedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="recruitment/jobs/:id"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["recruitmentEnabled"]}
                    loadingMessage="Loading recruitment access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "read", subject: "employees" },
                      ]}
                    >
                      <RecruitmentJobDetails />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="recruitment/referrals"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["recruitmentEnabled"]}
                    loadingMessage="Loading recruitment access..."
                  >
                    <ProtectedRoute requiredPermissions={[{ action: "manage", subject: "recruitment" }]}>
                      <ReferralRequests />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="timesheet"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["timesheetEnabled"]}
                    loadingMessage="Loading timesheet access..."
                  >
                    <Timesheet />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="timesheet/submit"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["timesheetEnabled"]}
                    loadingMessage="Loading timesheet access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "submit", subject: "timesheet" },
                      ]}
                    >
                      <SubmitTimesheet />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="timesheet/projects"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["timesheetEnabled"]}
                    loadingMessage="Loading timesheet access..."
                  >
                    <MyProjects />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="timesheet/approvals"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["timesheetEnabled"]}
                    loadingMessage="Loading timesheet access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "approve", subject: "timesheet" },
                      ]}
                    >
                      <TimesheetApprovals />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="leave"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["leaveManagementEnabled"]}
                    loadingMessage="Loading leave access..."
                  >
                    <Leave />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="leave/summary"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["leaveManagementEnabled"]}
                    loadingMessage="Loading leave access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "submit", subject: "leave" },
                      ]}
                    >
                      <LeaveSummary />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="leave/request"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["leaveManagementEnabled"]}
                    loadingMessage="Loading leave access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "submit", subject: "leave" },
                      ]}
                    >
                      <RequestLeave />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="leave/holidays"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["leaveManagementEnabled"]}
                    loadingMessage="Loading leave access..."
                  >
                    <HolidayList />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="leave/approvals"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["leaveManagementEnabled"]}
                    loadingMessage="Loading leave access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "approve", subject: "leave" },
                      ]}
                    >
                      <LeaveApprovals />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="analytics"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "read", subject: "analytics" },
                    ]}
                  >
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="performance"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "performance" },
                    ]}
                  >
                    <Performance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payroll"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["payrollEnabled"]}
                    loadingMessage="Loading payroll access..."
                  >
                    <PayrollLayout />
                  </ModuleAccessRoute>
                }
              >
                <Route index element={<Payslips />} />
                <Route path="payslips" element={<Payslips />} />
                <Route
                  path="attendance"
                  element={
                    <ModuleAccessRoute
                      requiredFlags={["attendanceEnabled"]}
                      loadingMessage="Loading attendance access..."
                    >
                      <RoleBasedRoute allowedRoles={["ADMIN", "HR", "ORG_ADMIN"]}>
                        <AttendanceManagement />
                      </RoleBasedRoute>
                    </ModuleAccessRoute>
                  }
                />
                <Route
                  path="payscale"
                  element={
                    <RoleBasedRoute allowedRoles={["ADMIN", "HR"]}>
                      <PayscaleManagement />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="approvals"
                  element={
                    <RoleBasedRoute allowedRoles={["ADMIN", "HR"]}>
                      <AdminPayslipManagement />
                    </RoleBasedRoute>
                  }
                />
                
                {/* <Route
                  path="paygrade"
                  element={
                    <RoleBasedRoute allowedRoles={["ADMIN", "HR"]}>
                      <PayGradeManagement />
                    </RoleBasedRoute>
                  }
                /> */}
              </Route>
              <Route
                path="/payscale"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["payrollEnabled"]}
                    loadingMessage="Loading payroll access..."
                  >
                    <PayscaleManagement />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/payroll"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["payrollEnabled"]}
                    loadingMessage="Loading payroll access..."
                  >
                    <PayrollGeneration />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="travel"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["travelEnabled", "expenseEnabled"]}
                    match="any"
                    loadingMessage="Loading travel and expense access..."
                  >
                    <Travel />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="travel/new-trip"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["travelEnabled"]}
                    loadingMessage="Loading travel access..."
                  >
                    <NewTripRequest />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="travel/submit-expense"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["expenseEnabled"]}
                    loadingMessage="Loading expense access..."
                  >
                    <SubmitExpense />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="travel/approvals"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["travelEnabled", "expenseEnabled"]}
                    match="any"
                    loadingMessage="Loading travel and expense access..."
                  >
                    <ProtectedRoute
                      requiredPermissions={[
                        { action: "approve", subject: "expenses" },
                      ]}
                    >
                      <ExpenseApprovals />
                    </ProtectedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route path="wellness" element={<Wellness />} />
              {/* Project Management Route */}
              <Route
                path="project-management"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "projects" },
                    ]}
                  >
                    <ProjectManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/job-openings"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["recruitmentEnabled"]}
                    loadingMessage="Loading recruitment access..."
                  >
                    <JobOpenings />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/job-openings/:id"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["recruitmentEnabled"]}
                    loadingMessage="Loading recruitment access..."
                  >
                    <JobDetails />
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/admin/holidays"
                element={
                  <ModuleAccessRoute
                    requiredFlags={["holidayManagementEnabled"]}
                    loadingMessage="Loading holiday management access..."
                  >
                    <RoleBasedRoute allowedRoles={["HR", "ADMIN"]}>
                      <AdminHolidays />
                    </RoleBasedRoute>
                  </ModuleAccessRoute>
                }
              />
              <Route
                path="/admin/organizations"
                element={
                  <RoleBasedRoute allowedRoles={["ADMIN"]}>
                    <Organizations />
                  </RoleBasedRoute>
                }
              />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
