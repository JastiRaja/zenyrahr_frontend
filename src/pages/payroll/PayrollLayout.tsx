import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PayrollLayout: React.FC = () => {
  const { user } = useAuth();
  const isHR = user?.role?.toLowerCase() === 'hr';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="mt-2 text-gray-600">Manage employee payroll, attendance, and payscales</p>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <nav className="flex space-x-4 p-4">
            <NavLink
              to="/payroll/payslips"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
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
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  Payslip Approvals
                </NavLink>
                <NavLink
                  to="/payroll/attendance"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  Attendance
                </NavLink>
                <NavLink
                  to="/payroll/payscale"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  Payscale
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <Outlet />
      </div>
    </div>
  );
};

export default PayrollLayout; 