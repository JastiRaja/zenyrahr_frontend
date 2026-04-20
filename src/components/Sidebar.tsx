import { IndianRupeeOutlined } from '@ant-design/icons';

const menuItems = [
  {
    title: 'Payroll',
    icon: <IndianRupeeOutlined />,
    roles: ['HR', 'ZENYRAHR_ADMIN'],
    children: [
      {
        title: 'Payscale Management',
        path: '/payscale',
        roles: ['HR', 'ZENYRAHR_ADMIN'],
      },
      {
        title: 'Payroll Generation',
        path: '/payroll',
        roles: ['HR', 'ZENYRAHR_ADMIN'],
      },
      {
        title: 'Time and Attendance',
        path: '/attendance',
        roles: ['HR', 'ZENYRAHR_ADMIN'],
      },
    ],
  },
]; 