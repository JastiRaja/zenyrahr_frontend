import { createBrowserRouter } from 'react-router-dom';
import Payslips from '../pages/payroll/Payslips';
import AttendanceManagement from '../pages/payroll/AttendanceManagement';
import PayscaleManagement from '../pages/payroll/PayscaleManagement';
import PayrollLayout from '../pages/payroll/PayrollLayout';
import AdminPayslipManagement from '../pages/payroll/AdminPayslipManagement';


const router = createBrowserRouter([
  {
    path: '/payroll',
    element: <PayrollLayout />,
    children: [
      {
        index: true,
        element: <Payslips />,
      },
      {
        path: 'payslips',
        element: <Payslips />,
      },
      {
        path: 'attendance',
        element: <AttendanceManagement />,
      },
      {
        path: 'payscale',
        element: <PayscaleManagement />,
      },
      {
        path: 'admin-payslips',
        element: <AdminPayslipManagement />,
      },
      {
        path: 'approvals',
        element: <AdminPayslipManagement />,
      },
      
    ],
  },
]);

export default router; 