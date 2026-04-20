import React from 'react';
import { BarChart, LineChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserMinus, Clock, CalendarDays } from 'lucide-react';

const monthlyData = [
  { month: 'Jan', employees: 220, hires: 12, turnover: 5 },
  { month: 'Feb', employees: 228, hires: 15, turnover: 7 },
  { month: 'Mar', employees: 235, hires: 10, turnover: 3 },
  { month: 'Apr', employees: 248, hires: 18, turnover: 5 },
];

const departmentData = [
  { name: 'Engineering', count: 85, growth: 12 },
  { name: 'Product', count: 45, growth: 8 },
  { name: 'Marketing', count: 35, growth: 15 },
  { name: 'Sales', count: 55, growth: 10 },
  { name: 'HR', count: 28, growth: 5 },
];

export default function Analytics() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">HR Analytics</h1>
        <p className="mt-2 text-lg text-slate-600">
          Track key metrics and insights about your workforce
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'Total Employees', value: '248', change: '+4.75%', icon: Users },
          { name: 'Attendance rate', value: '96%', change: '+1.2%', icon: Clock },
          { name: 'Turnover Rate', value: '3.2%', change: '-1.5%', icon: UserMinus },
          { name: 'Leave days (YTD)', value: '1,240', change: '+3%', icon: CalendarDays },
        ].map((item) => (
          <div key={item.name} className="stat-card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700">
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500">{item.name}</p>
                <div className="flex items-center">
                  <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                  <span className="ml-2 text-sm font-medium text-green-600">
                    {item.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Workforce Growth</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="employees" stroke="#4f46e5" fill="#e0e7ff" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Department Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Operations snapshot</h2>
          <div className="space-y-4">
            {[
              { label: 'Payroll cycles completed', value: '12', trend: 'On track' },
              { label: 'Pending leave approvals', value: '7', trend: '-2 vs last week' },
              { label: 'Timesheets awaiting review', value: '14', trend: '+4%' },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                  <p className="text-lg font-semibold text-slate-900">{metric.value}</p>
                </div>
                <span className="text-sm text-green-600">{metric.trend}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Employee Satisfaction</h2>
          <div className="space-y-4">
            {[
              { label: 'Overall Satisfaction', value: '4.2/5', percentage: '84%' },
              { label: 'Work-Life Balance', value: '4.0/5', percentage: '80%' },
              { label: 'Career Growth', value: '3.8/5', percentage: '76%' },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  <span className="text-sm font-medium text-slate-900">{item.value}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: item.percentage }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}