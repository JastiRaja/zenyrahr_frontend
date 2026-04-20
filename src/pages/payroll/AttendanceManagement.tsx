import React, { useEffect, useState } from 'react';
import { getAllEmployees, getAllLeaveTypes, markBatchAttendance, getAttendance, Employee, Attendance } from '../../api/payroll';
import { format } from 'date-fns';
import { getPublicHolidays, Holiday } from '../../api/holidays';
import { CalendarDays, Search, Save, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingButton from '../../components/LoadingButton';

type PunchDetails = {
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkInLocationLabel?: string | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkOutLocationLabel?: string | null;
};

const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();
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
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [punchDetails, setPunchDetails] = useState<{ [id: number]: PunchDetails }>({});
  const canManuallyUpdate = ['hr', 'zenyrahr_admin', 'org_admin'].includes((user?.role || '').toLowerCase());

  const getStatusPillClass = (value?: string) => {
    switch ((value || '').toUpperCase()) {
      case 'PRESENT':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'ABSENT':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'HALF_DAY':
      case 'LATE':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'HOLIDAY':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      case 'CHECKED_IN':
        return 'border-indigo-200 bg-indigo-50 text-indigo-700';
      default:
        return 'border-slate-200 bg-white text-slate-700';
    }
  };

  useEffect(() => {
    fetchAllData(date);
  }, [date]);

  const formatPunchTime = (value?: string | null) => {
    if (!value) return '—';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '—';
    return dt.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatPunchLocation = (
    label?: string | null,
    lat?: number | null,
    lng?: number | null
  ) => {
    if (label && label.trim()) return label;
    if (lat != null && lng != null) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    return 'Location not captured';
  };

  const getAttendanceAuditMeta = (remark: string) => {
    const normalized = (remark || "").trim().toLowerCase();
    if (normalized === "approved leave") {
      return {
        label: "Auto-synced from leave approval",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    }
    if (normalized === "leave revoked") {
      return {
        label: "Updated after revoke approval",
        className: "border-violet-200 bg-violet-50 text-violet-700",
      };
    }
    return null;
  };

  const fetchAllData = async (selectedDate: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const selectedYear = Number(selectedDate.slice(0, 4));
      const holidayData = await getPublicHolidays(selectedYear);
      const syncedHolidays = Array.isArray(holidayData) ? holidayData : [];
      setHolidays(syncedHolidays);
      const selectedHoliday = syncedHolidays.find((h) => h.date === selectedDate);

      const employeesData = await getAllEmployees();
      setEmployees(employeesData);
      setLeaveTypes(await getAllLeaveTypes());
      // Fetch attendance for all employees for the selected date
      const attendanceMap: { [id: number]: string } = {};
      const remarksMap: { [id: number]: string } = {};
      const punchDetailsMap: { [id: number]: PunchDetails } = {};
      for (const emp of employeesData) {
        const records: Attendance[] = await getAttendance(Number(emp.id), selectedDate.slice(5, 7), selectedDate.slice(0, 4));
        const record = records.find(r => (r.date && r.date.slice(0, 10)) === selectedDate);
        if (record) {
          attendanceMap[Number(emp.id)] = record.status;
          remarksMap[Number(emp.id)] = record.remarks || '';
          punchDetailsMap[Number(emp.id)] = {
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
            checkInLatitude: record.checkInLatitude,
            checkInLongitude: record.checkInLongitude,
            checkInLocationLabel: record.checkInLocationLabel,
            checkOutLatitude: record.checkOutLatitude,
            checkOutLongitude: record.checkOutLongitude,
            checkOutLocationLabel: record.checkOutLocationLabel,
          };
        } else if (selectedHoliday) {
          // Auto-sync holiday status for the selected date.
          attendanceMap[Number(emp.id)] = 'HOLIDAY';
          remarksMap[Number(emp.id)] = selectedHoliday.name;
        }
      }
      setAttendance(attendanceMap);
      setRemarks(remarksMap);
      setPunchDetails(punchDetailsMap);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (employeeId: number, status: string) => {
    if (!canManuallyUpdate) return;
    setAttendance(prev => ({ ...prev, [employeeId]: status }));
  };

  const handleRemarksChange = (employeeId: number, value: string) => {
    if (!canManuallyUpdate) return;
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
      !employeeIdFilter ||
      (emp.code && emp.code.toLowerCase().includes(employeeIdFilter.toLowerCase())) ||
      emp.id.toString().includes(employeeIdFilter);
    const matchesUsername =
      !usernameFilter || (emp.username && emp.username.toLowerCase().includes(usernameFilter.toLowerCase()));
    const matchesDepartment =
      !departmentFilter || emp.department === departmentFilter;
    const matchesRole =
      !roleFilter || emp.role === roleFilter;
    return matchesSearch && matchesStatus && matchesEmployeeId && matchesUsername && matchesDepartment && matchesRole;
  });

  const selectedHoliday = holidays.find((h) => h.date === date);
  const isHolidayDate = Boolean(selectedHoliday);
  const presentCount = filteredEmployees.filter((emp) => attendance[Number(emp.id)] === 'PRESENT').length;
  const absentCount = filteredEmployees.filter((emp) => attendance[Number(emp.id)] === 'ABSENT').length;
  const halfDayCount = filteredEmployees.filter((emp) => attendance[Number(emp.id)] === 'HALF_DAY').length;
  const markedCount = filteredEmployees.filter((emp) => Boolean(attendance[Number(emp.id)])).length;
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setEmployeeIdFilter('');
    setUsernameFilter('');
    setDepartmentFilter('');
    setRoleFilter('');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-1 py-2">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
              <p className="mt-1 text-sm text-sky-50">
                Track daily attendance, leaves, and holiday synced records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-white" htmlFor="attendance-date">
                <CalendarDays className="h-4 w-4" />
                Date
              </label>
              <input
                id="attendance-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="rounded-md border border-sky-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Filtered Employees</p>
            <p className="text-xl font-bold text-slate-900">{filteredEmployees.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Marked Records</p>
            <p className="text-xl font-bold text-sky-700">{markedCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Present / Half Day</p>
            <p className="text-xl font-bold text-emerald-700">{presentCount} / {halfDayCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Absent</p>
            <p className="text-xl font-bold text-rose-700">{absentCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        {isHolidayDate && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {date} is a published holiday: <span className="font-semibold">{selectedHoliday?.name}</span> ({selectedHoliday?.type}).
          </div>
        )}
        {!canManuallyUpdate && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You can view attendance details, but only HR/Admin can manually update status or remarks.
          </div>
        )}

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filters
        </p>
        <div className="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or username"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <input
            type="text"
            placeholder="Employee ID"
            value={employeeIdFilter}
            onChange={e => setEmployeeIdFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Username (email)"
            value={usernameFilter}
            onChange={e => setUsernameFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          />
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none lg:col-span-2"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="HOLIDAY">Holiday</option>
            {leaveTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Clear
            </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-600">Loading...</div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur">
                  <tr>
                    <th className="min-w-[120px] whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Employee ID</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Username</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Department</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Role</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Joining Date</th>
                    <th className="min-w-[150px] whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Punch In</th>
                    <th className="min-w-[150px] whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Punch Out</th>
                    <th className="min-w-[130px] whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                    <th className="min-w-[180px] whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => {
                    const joinDateObj = emp.joinDate ? new Date(emp.joinDate) : null;
                    const selectedDateObj = new Date(date);
                    const beforeJoining = joinDateObj && selectedDateObj < joinDateObj;
                    const disableAttendanceInput = Boolean(beforeJoining || isHolidayDate);
                    const empPunchDetails = punchDetails[Number(emp.id)];
                    const currentRemark = remarks[Number(emp.id)] || '';
                    const auditMeta = getAttendanceAuditMeta(currentRemark);
                    const currentStatus = attendance[Number(emp.id)] || '';
                    return (
                      <tr key={emp.id} className="border-b border-slate-100 even:bg-slate-50/60 hover:bg-sky-50/40">
                        <td className="border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-800">{emp.code || `EMP-${emp.id}`}</td>
                        <td className="border-b border-slate-200 px-3 py-1.5 text-sm text-slate-700">{emp.firstName} {emp.lastName}</td>
                        <td className="border-b border-slate-200 px-3 py-1.5 text-sm text-slate-700">{emp.username || ''}</td>
                        <td className="border-b border-slate-200 px-3 py-1.5 text-sm text-slate-700">{emp.department}</td>
                        <td className="border-b border-slate-200 px-3 py-1.5 text-sm text-slate-700">{emp.role}</td>
                        <td className="border-b border-slate-200 px-3 py-1.5 text-sm text-slate-700">{emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-GB') : ''}</td>
                        <td className="border-b border-slate-200 px-3 py-1.5">
                          <p className="text-sm text-slate-700">{formatPunchTime(empPunchDetails?.checkInTime)}</p>
                          {empPunchDetails?.checkInTime && (
                            <p className="text-xs text-slate-500">
                              {formatPunchLocation(
                                empPunchDetails.checkInLocationLabel,
                                empPunchDetails.checkInLatitude,
                                empPunchDetails.checkInLongitude
                              )}
                            </p>
                          )}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-1.5">
                          <p className="text-sm text-slate-700">{formatPunchTime(empPunchDetails?.checkOutTime)}</p>
                          {empPunchDetails?.checkOutTime && (
                            <p className="text-xs text-slate-500">
                              {formatPunchLocation(
                                empPunchDetails.checkOutLocationLabel,
                                empPunchDetails.checkOutLatitude,
                                empPunchDetails.checkOutLongitude
                              )}
                            </p>
                          )}
                        </td>
                        <td className="min-w-[130px] border-b border-slate-200 px-3 py-1.5">
                          <select
                            value={currentStatus}
                            onChange={e => handleStatusChange(Number(emp.id), e.target.value)}
                            required
                            className={`w-full min-w-[120px] rounded-full border px-2.5 py-1 text-sm font-medium focus:border-sky-500 focus:outline-none ${getStatusPillClass(currentStatus)}`}
                            disabled={disableAttendanceInput || !canManuallyUpdate}
                            title={beforeJoining ? "Cannot mark attendance before joining date" : isHolidayDate ? "Holiday is synced automatically" : ""}
                          >
                            <option value="">Select</option>
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                            <option value="HALF_DAY">Half Day</option>
                            <option value="HOLIDAY">Holiday</option>
                            {leaveTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          {auditMeta && (
                            <p className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${auditMeta.className}`}>
                              {auditMeta.label}
                            </p>
                          )}
                        </td>
                        <td className="min-w-[180px] border-b border-slate-200 px-3 py-1.5">
                          <input
                            type="text"
                            value={currentRemark}
                            onChange={e => handleRemarksChange(Number(emp.id), e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                            placeholder="Remarks"
                            disabled={disableAttendanceInput || !canManuallyUpdate}
                            title={beforeJoining ? "Cannot add remarks before joining date" : isHolidayDate ? "Holiday remarks are synced automatically" : ""}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                        No employees found for the applied filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Saving..."
              disabled={!canManuallyUpdate}
              className="mt-3 rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
              leadingIcon={<Save className="mr-2 h-4 w-4" />}
            >
              Save Attendance
            </LoadingButton>
          </form>
        )}
        {success && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
      </section>
    </div>
  );
};

export default AttendanceManagement; 