import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MAIN_PLATFORM_ADMIN_ROLE } from '../../types/auth';

const PayrollLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role?.toLowerCase() || '';
  const isHR = role === 'hr';
  const canOpenAttendanceManagement =
    role === 'hr' || role === 'org_admin' || role === MAIN_PLATFORM_ADMIN_ROLE;
  const hidePayrollHeader = location.pathname === "/payroll/attendance";

  return (
    <div className="min-h-screen">
      <div className="mx-auto space-y-4 px-1 py-2">
        {!hidePayrollHeader && (
          <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-5 py-4 text-white">
              <h1 className="text-2xl font-bold tracking-tight">Payroll Management</h1>
              <p className="mt-1 text-xs text-sky-50">
                Manage employee payroll, attendance, and payscales.
              </p>
            </div>
            <nav className="flex flex-wrap gap-1.5 border-t border-slate-200 bg-white p-3">
              <NavLink
                to="/payroll/payslips"
                className={({ isActive }) =>
                  `rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                    isActive
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                My Payslips
              </NavLink>
              
              {isHR && (
                <>
                  <NavLink
                    to="/payroll/approvals"
                    className={({ isActive }) =>
                      `rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                        isActive
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    Payslip Approvals
                  </NavLink>
                  <NavLink
                    to="/payroll/payscale"
                    className={({ isActive }) =>
                      `rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                        isActive
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    Payscale
                  </NavLink>
                </>
              )}
              {canOpenAttendanceManagement && (
                <NavLink
                  to="/payroll/attendance"
                  className={({ isActive }) =>
                    `rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                      isActive
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  Time and Attendance
                </NavLink>
              )}
            </nav>
          </section>
        )}

        <Outlet />
      </div>
    </div>
  );
};

export default PayrollLayout; 