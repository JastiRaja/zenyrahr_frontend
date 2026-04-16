import { FaBriefcase } from 'react-icons/fa';
import { IndianRupeeOutlined } from '@ant-design/icons';

const menuItems = [
  {
    path: '/job-openings',
    name: 'Job Openings',
    icon: <FaBriefcase />,
  },
  {
    title: 'Payroll',
    icon: <IndianRupeeOutlined />,
    roles: ['HR', 'ADMIN'],
    children: [
      {
        title: 'Payscale Management',
        path: '/payscale',
        roles: ['HR', 'ADMIN'],
      },
      {
        title: 'Payroll Generation',
        path: '/payroll',
        roles: ['HR', 'ADMIN'],
      },
      {
        title: 'Time and Attendance',
        path: '/attendance',
        roles: ['HR', 'ADMIN'],
      },
    ],
  },
]; 