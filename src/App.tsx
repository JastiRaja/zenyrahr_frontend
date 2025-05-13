import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import AddEmployee from "./pages/employees/AddEmployee";
import SelfService from "./pages/SelfService";
import Recruitment from "./pages/Recruitment";
import PostJob from "./pages/recruitment/PostJob";
import Timesheet from "./pages/Timesheet";
import SubmitTimesheet from "./pages/timesheet/SubmitTimesheet";
import TimesheetApprovals from "./pages/approvals/TimesheetApprovals";
import Leave from "./pages/Leave";
import RequestLeave from "./pages/leave/RequestLeave";
import LeaveApprovals from "./pages/approvals/LeaveApprovals";
import Analytics from "./pages/Analytics";
import Performance from "./pages/Performance";
import Travel from "./pages/Travel";
import NewTripRequest from "./pages/travel/NewTripRequest";
import SubmitExpense from "./pages/travel/SubmitExpense";
import ExpenseApprovals from "./pages/approvals/ExpenseApprovals";
import Wellness from "./pages/Wellness";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
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
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "read", subject: "employees" },
                    ]}
                  >
                    <Employees />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees/add"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "employees" },
                    ]}
                  >
                    <AddEmployee />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-leave/requests"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "approve", subject: "leave" },
                    ]}
                  >
                    <AdminLeaveRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-leave/balance"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "leave-balance" },
                    ]}
                  >
                    <AdminLeaveBalances />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-leave/policies"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "leave-policies" },
                    ]}
                  >
                    <LeavePolicies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-leave/types" // ✅ New Leave Types Page Route
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "leave-types" },
                    ]}
                  >
                    <LeaveTypeAdd />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/assign-manager"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "employees" },
                    ]}
                  >
                    <AssignManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/manage-entities"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "employees" },
                    ]}
                  >
                    <ManageEntities />
                  </ProtectedRoute>
                }
              />
              <Route path="/selfservice/:id" element={<SelfService />} />
              <Route path="self-service" element={<SelfService />} />
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
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "recruitment" },
                    ]}
                  >
                    <Recruitment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="recruitment/post"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "recruitment" },
                    ]}
                  >
                    <PostJob />
                  </ProtectedRoute>
                }
              />
              <Route
                path="recruitment/jobs/:id"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "manage", subject: "recruitment" },
                    ]}
                  >
                    <RecruitmentJobDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="recruitment/referrals"
                element={
                  <ProtectedRoute requiredPermissions={[{ action: "manage", subject: "recruitment" }]}> 
                    <ReferralRequests />
                  </ProtectedRoute>
                }
              />
              <Route path="timesheet" element={<Timesheet />} />
              <Route
                path="timesheet/submit"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "submit", subject: "timesheet" },
                    ]}
                  >
                    <SubmitTimesheet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="timesheet/approvals"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "approve", subject: "timesheet" },
                    ]}
                  >
                    <TimesheetApprovals />
                  </ProtectedRoute>
                }
              />
              <Route path="leave" element={<Leave />} />
              <Route
                path="leave/summary"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "submit", subject: "leave" },
                    ]}
                  >
                    <LeaveSummary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="leave/request"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "submit", subject: "leave" },
                    ]}
                  >
                    <RequestLeave />
                  </ProtectedRoute>
                }
              />
              <Route
                path="leave/approvals"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "approve", subject: "leave" },
                    ]}
                  >
                    <LeaveApprovals />
                  </ProtectedRoute>
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
              <Route path="travel" element={<Travel />} />
              <Route path="travel/new-trip" element={<NewTripRequest />} />
              <Route path="travel/submit-expense" element={<SubmitExpense />} />
              <Route
                path="travel/approvals"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      { action: "approve", subject: "expenses" },
                    ]}
                  >
                    <ExpenseApprovals />
                  </ProtectedRoute>
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
              <Route path="/job-openings" element={<JobOpenings />} />
              <Route path="/job-openings/:id" element={<JobDetails />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
