import React, { useEffect, useState } from 'react';
import { getAllEmployees, getAllLeaveTypes, markBatchAttendance, getAttendance, Employee, Attendance } from '../../api/payroll';
import { format } from 'date-fns';

const AttendanceManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<{ [id: number]: string }>({});
  const [remarks, setRemarks] = useState<{ [id: number]: string }>({});
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeIdFilter, setEmployeeIdFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchAllData(date);
  }, [date]);

  const fetchAllData = async (selectedDate: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const employeesData = await getAllEmployees();
      setEmployees(employeesData);
      setLeaveTypes(await getAllLeaveTypes());
      // Fetch attendance for all employees for the selected date
      const attendanceMap: { [id: number]: string } = {};
      const remarksMap: { [id: number]: string } = {};
      for (const emp of employeesData) {
        const records: Attendance[] = await getAttendance(Number(emp.id), selectedDate.slice(5, 7), selectedDate.slice(0, 4));
        console.log('Attendance records for employee', emp.id, records);
        const record = records.find(r => (r.date && r.date.slice(0, 10)) === selectedDate);
        if (record) {
          attendanceMap[Number(emp.id)] = record.status;
          remarksMap[Number(emp.id)] = record.remarks || '';
        }
      }
      console.log('Selected date:', selectedDate);
      setAttendance(attendanceMap);
      setRemarks(remarksMap);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (employeeId: number, status: string) => {
    setAttendance(prev => ({ ...prev, [employeeId]: status }));
  };

  const handleRemarksChange = (employeeId: number, value: string) => {
    setRemarks(prev => ({ ...prev, [employeeId]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const attendanceList = employees.map(emp => ({
        employeeId: emp.id,
        date,
        status: attendance[emp.id] || '',
        remarks: remarks[emp.id] || ''
      }));
      await markBatchAttendance(attendanceList);
      setSuccess('Attendance saved!');
      // Refetch to show updated values
      fetchAllData(date);
    } catch {
      setError('Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments and roles for dropdowns
  const uniqueDepartments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean)));
  const uniqueRoles = Array.from(new Set(employees.map(emp => emp.role).filter(Boolean)));

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
      emp.username.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      !statusFilter || attendance[Number(emp.id)] === statusFilter;
    const matchesEmployeeId =
      !employeeIdFilter || emp.id.toString().includes(employeeIdFilter);
    const matchesUsername =
      !usernameFilter || (emp.username && emp.username.toLowerCase().includes(usernameFilter.toLowerCase()));
    const matchesDepartment =
      !departmentFilter || emp.department === departmentFilter;
    const matchesRole =
      !roleFilter || emp.role === roleFilter;
    return matchesSearch && matchesStatus && matchesEmployeeId && matchesUsername && matchesDepartment && matchesRole;
  });

  return (
    <div className="container mx-auto px-1 py-8">
      <div className="bg-white rounded-lg shadow p-3 max-w-10xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Attendance Sheet</h2>
        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2">
          <label className="font-medium" htmlFor="attendance-date">Date:</label>
          <input
            id="attendance-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div className="mb-4 flex flex-col md:flex-row gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="text"
            placeholder="Employee ID"
            value={employeeIdFilter}
            onChange={e => setEmployeeIdFilter(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="text"
            placeholder="Username (email)"
            value={usernameFilter}
            onChange={e => setUsernameFilter(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
            {leaveTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 rounded">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 border-b">ID</th>
                    <th className="px-4 py-2 border-b">Name</th>
                    <th className="px-4 py-2 border-b">Username</th>
                    {/* <th className="px-4 py-2 border-b">Email</th> */}
                    <th className="px-4 py-2 border-b">Department</th>
                    <th className="px-4 py-2 border-b">Role</th>
                    <th className="px-4 py-2 border-b">Joining Date</th>
                    <th className="px-4 py-2 border-b">Status</th>
                    <th className="px-16 py-2 border-b">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => {
                    const joinDateObj = emp.joinDate ? new Date(emp.joinDate) : null;
                    const selectedDateObj = new Date(date);
                    const beforeJoining = joinDateObj && selectedDateObj < joinDateObj;
                    return (
                      <tr key={emp.id} className="even:bg-gray-50">
                        <td className="px-4 py-2 border-b">{emp.id}</td>
                        <td className="px-4 py-2 border-b">{emp.firstName} {emp.lastName}</td>
                        <td className="px-4 py-2 border-b">{emp.username || ''}</td>
                        {/* <td className="px-4 py-2 border-b">{emp.username || ''}</td> */}
                        <td className="px-4 py-2 border-b">{emp.department}</td>
                        <td className="px-4 py-2 border-b">{emp.role}</td>
                        <td className="px-4 py-2 border-b">{emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-GB') : ''}</td>
                        <td className="px-4 py-2 border-b">
                          <select
                            value={attendance[Number(emp.id)] || ''}
                            onChange={e => handleStatusChange(Number(emp.id), e.target.value)}
                            required
                            className="border rounded px-2 py-1"
                            disabled={beforeJoining}
                            title={beforeJoining ? "Cannot mark attendance before joining date" : ""}
                          >
                            <option value="">Select</option>
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                            <option value="HALF_DAY">Half Day</option>
                            {leaveTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 border-b">
                          <input
                            type="text"
                            value={remarks[Number(emp.id)] || ''}
                            onChange={e => handleRemarksChange(Number(emp.id), e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                            placeholder="Remarks"
                            disabled={beforeJoining}
                            title={beforeJoining ? "Cannot add remarks before joining date" : ""}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full md:w-auto bg-indigo-600 text-white font-semibold py-2 px-6 rounded hover:bg-indigo-700 transition"
            >
              {loading ? 'Saving...' : 'Save Attendance'}
            </button>
          </form>
        )}
        {success && <div className="text-green-600 mt-4">{success}</div>}
        {error && <div className="text-red-600 mt-4">{error}</div>}
      </div>
    </div>
  );
};

export default AttendanceManagement; 