import { FaBriefcase } from 'react-icons/fa';
import { DollarOutlined } from '@ant-design/icons';

const menuItems = [
  {
    path: '/job-openings',
    name: 'Job Openings',
    icon: <FaBriefcase />,
  },
  {
    title: 'Payroll',
    icon: <DollarOutlined />,
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
        title: 'Attendance',
        path: '/attendance',
        roles: ['HR', 'ADMIN'],
      },
    ],
  },
]; 