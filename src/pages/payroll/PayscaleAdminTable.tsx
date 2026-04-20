import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import axiosInstance from '../../api/axios';
import { getAllEmployees } from '../../api/payroll';
import LoadingButton from '../../components/LoadingButton';
import { useOrganizationScope } from '../../hooks/useOrganizationScope';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
}

interface Payscale {
  id: number;
  employee: Employee;
  basicSalary: number;
  hra: number;
  da: number;
  allowance: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

const PayscaleAdminTable: React.FC = () => {
  const {
    organizationId,
    setSelectedOrganizationId,
    organizations,
    needsOrganizationSelection,
  } = useOrganizationScope();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payscales, setPayscales] = useState<Payscale[]>([]);
  const [loading, setLoading] = useState(false);
  const [editPayscale, setEditPayscale] = useState<Payscale | null>(null);
  const [addEmployee, setAddEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    basicSalary: '',
    hra: '',
    da: '',
    allowance: '',
    effectiveFrom: '',
    effectiveTo: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId == null) {
      setEmployees([]);
      setPayscales([]);
      return;
    }
    fetchAll();
  }, [organizationId]);

  const fetchAll = async () => {
    if (organizationId == null) {
      return;
    }
    setLoading(true);
    try {
      const [empData, payscaleRes] = await Promise.all([
        getAllEmployees(),
        axiosInstance.get('/api/payscale', { params: { organizationId } }),
      ]);
      setEmployees(empData);
      setPayscales(payscaleRes.data);
    } catch {
      setError('Failed to fetch employees or payscales');
    } finally {
      setLoading(false);
    }
  };

  const getPayscaleForEmployee = (empId: number) =>
    payscales.find(ps => ps.employee.id === empId);

  const handleEdit = (payscale: Payscale) => {
    setEditPayscale(payscale);
    setAddEmployee(null);
    setEditForm({
      basicSalary: payscale.basicSalary?.toString() || '',
      hra: payscale.hra?.toString() || '',
      da: payscale.da?.toString() || '',
      allowance: payscale.allowance?.toString() || '',
      effectiveFrom: payscale.effectiveFrom || '',
      effectiveTo: payscale.effectiveTo || ''
    });
  };

  const handleAdd = (employee: Employee) => {
    setAddEmployee(employee);
    setEditPayscale(null);
    setEditForm({
      basicSalary: '',
      hra: '',
      da: '',
      allowance: '',
      effectiveFrom: '',
      effectiveTo: ''
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editPayscale) {
        await axiosInstance.put(`/api/payscale/${editPayscale.id}`, {
          ...editPayscale,
          basicSalary: Number(editForm.basicSalary),
          hra: Number(editForm.hra),
          da: Number(editForm.da),
          allowance: Number(editForm.allowance),
          effectiveFrom: editForm.effectiveFrom,
          effectiveTo: editForm.effectiveTo || undefined
        });
      } else if (addEmployee) {
        await axiosInstance.post('/api/payscale', {
          employee: { id: addEmployee.id },
          basicSalary: Number(editForm.basicSalary),
          hra: Number(editForm.hra),
          da: Number(editForm.da),
          allowance: Number(editForm.allowance),
          effectiveFrom: editForm.effectiveFrom,
          effectiveTo: editForm.effectiveTo || undefined
        });
      }
      setEditPayscale(null);
      setAddEmployee(null);
      fetchAll();
    } catch {
      setError('Failed to save payscale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Employee Payscales</h1>
      {needsOrganizationSelection && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">Organization</span>
          <select
            className="rounded border border-slate-300 px-2 py-1 text-sm min-w-[220px]"
            value={organizationId ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedOrganizationId(v === '' ? null : Number(v));
            }}
          >
            <option value="">Select organization</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Basic Salary (Monthly)</th>
              <th className="px-4 py-2">HRA (Monthly)</th>
              <th className="px-4 py-2">DA (Monthly)</th>
              <th className="px-4 py-2">Allowance (Monthly)</th>
              <th className="px-4 py-2">Effective From</th>
              <th className="px-4 py-2">Effective To</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const ps = getPayscaleForEmployee(emp.id);
              return (
                <tr key={emp.id}>
                  <td className="px-4 py-2">{emp.firstName} {emp.lastName}</td>
                  <td className="px-4 py-2">{emp.userName}</td>
                  <td className="px-4 py-2">{ps ? `₹${ps.basicSalary?.toLocaleString()}/month` : '-'}</td>
                  <td className="px-4 py-2">{ps ? `₹${ps.hra?.toLocaleString()}/month` : '-'}</td>
                  <td className="px-4 py-2">{ps ? `₹${ps.da?.toLocaleString()}/month` : '-'}</td>
                  <td className="px-4 py-2">{ps ? `₹${ps.allowance?.toLocaleString()}/month` : '-'}</td>
                  <td className="px-4 py-2">{ps && ps.effectiveFrom ? format(new Date(ps.effectiveFrom), 'dd MMM yyyy') : '-'}</td>
                  <td className="px-4 py-2">{ps && ps.effectiveTo ? format(new Date(ps.effectiveTo), 'dd MMM yyyy') : '-'}</td>
                  <td className="px-4 py-2">
                    {ps ? (
                      <button
                        className="text-indigo-600 hover:underline"
                        onClick={() => handleEdit(ps)}
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        className="text-green-600 hover:underline"
                        onClick={() => handleAdd(emp)}
                      >
                        Add Payscale
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {employees.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-500">No employees found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {(editPayscale || addEmployee) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">
              {editPayscale
                ? `Edit Payscale for ${editPayscale.employee.firstName} ${editPayscale.employee.lastName}`
                : addEmployee
                ? `Add Payscale for ${addEmployee.firstName} ${addEmployee.lastName}`
                : ''}
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Basic Salary (Monthly)</label>
                  <input type="number" name="basicSalary" value={editForm.basicSalary} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">HRA (Monthly)</label>
                  <input type="number" name="hra" value={editForm.hra} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">DA (Monthly)</label>
                  <input type="number" name="da" value={editForm.da} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Allowance (Monthly)</label>
                  <input type="number" name="allowance" value={editForm.allowance} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Effective From</label>
                  <input type="date" name="effectiveFrom" value={editForm.effectiveFrom} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Effective To</label>
                  <input type="date" name="effectiveTo" value={editForm.effectiveTo} onChange={handleEditChange} className="w-full border rounded px-2 py-1" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setEditPayscale(null); setAddEmployee(null); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <LoadingButton
                  type="submit"
                  loading={loading}
                  loadingText="Saving..."
                  className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
                >
                  Save
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayscaleAdminTable; 