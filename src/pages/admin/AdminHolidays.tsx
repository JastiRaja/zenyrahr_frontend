import { FormEvent, useEffect, useState } from "react";
import dayjs from "dayjs";
import { getHolidays, addHolidays, deleteHoliday, Holiday, HolidayType } from '../../api/holidays';
import CommonDialog from "../../components/CommonDialog";
import LoadingButton from "../../components/LoadingButton";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import { isMainPlatformAdmin } from "../../types/auth";

type OrganizationOption = {
  id: number;
  name: string;
};

export default function AdminHolidays() {
  const { user } = useAuth();
  const isMainAdmin = isMainPlatformAdmin(user?.role);
  const parsedOrgId = user?.organizationId ? Number(user.organizationId) : NaN;
  const initialOrgId = Number.isFinite(parsedOrgId) ? parsedOrgId : "";
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | "">(isMainAdmin ? "" : initialOrgId);
  const [newHoliday, setNewHoliday] = useState<{ date: string; name: string; type: HolidayType }>({
    date: '',
    name: '',
    type: 'GENERAL',
  });
  const [loading, setLoading] = useState(false);
  const [addingHoliday, setAddingHoliday] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [messageDialog, setMessageDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    tone: "success" | "error";
  }>({
    isOpen: false,
    title: "",
    message: "",
    tone: "success",
  });

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!isMainAdmin) return;
      try {
        const res = await api.get<OrganizationOption[]>("/api/organizations");
        const list = Array.isArray(res.data) ? res.data : [];
        setOrganizations(list);
        if (!selectedOrgId && list.length > 0) {
          setSelectedOrgId(list[0].id);
        }
      } catch {
        setOrganizations([]);
      }
    };
    fetchOrganizations();
  }, [isMainAdmin, selectedOrgId]);

  useEffect(() => {
    if (isMainAdmin && !selectedOrgId) {
      setHolidays([]);
      return;
    }
    fetchHolidays();
  }, [year, selectedOrgId, isMainAdmin]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHolidays(year, selectedOrgId ? Number(selectedOrgId) : undefined);
      setHolidays(data);
    } catch {
      setError('Failed to fetch holidays.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e: FormEvent) => {
    e.preventDefault();
    if (addingHoliday) return;
    if (isMainAdmin && !selectedOrgId) {
      setError("Select an organization first.");
      return;
    }
    if (!newHoliday.date || !newHoliday.name) return;
    try {
      setAddingHoliday(true);
      setError(null);
      await addHolidays([{ ...newHoliday, year }], selectedOrgId ? Number(selectedOrgId) : undefined);
      setNewHoliday({ date: '', name: '', type: 'GENERAL' });
      fetchHolidays();
      setMessageDialog({
        isOpen: true,
        title: "Holiday Added",
        message: "Holiday has been added successfully.",
        tone: "success",
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to add holiday.');
    } finally {
      setAddingHoliday(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setError(null);
      await deleteHoliday(id, selectedOrgId ? Number(selectedOrgId) : undefined);
      fetchHolidays();
      setMessageDialog({
        isOpen: true,
        title: "Holiday Deleted",
        message: "Holiday has been removed successfully.",
        tone: "success",
      });
    } catch {
      setError('Unable to delete holiday.');
    }
  };

  const generalCount = holidays.filter((holiday) => holiday.type === "GENERAL").length;
  const optionalCount = holidays.filter((holiday) => holiday.type === "OPTIONAL").length;
  const upcomingHoliday = holidays.find((holiday) =>
    dayjs(holiday.date).isAfter(dayjs().startOf("day"))
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Holiday Management</h1>
          <p className="mt-1 text-sm text-sky-50">
            Configure year-wise holidays for the organization.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Year</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{year}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Holidays</p>
            <p className="mt-1 text-xl font-bold text-sky-700">{holidays.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">General</p>
            <p className="mt-1 text-xl font-bold text-indigo-700">{generalCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Optional</p>
            <p className="mt-1 text-xl font-bold text-amber-700">{optionalCount}</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        {isMainAdmin && (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Organization Context
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="">Select Organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <form onSubmit={handleAddHoliday} className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Date
            </label>
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday((h) => ({ ...h, date: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Holiday Name
            </label>
            <input
              type="text"
              placeholder="Holiday name"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday((h) => ({ ...h, name: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Type
            </label>
            <select
              value={newHoliday.type}
              onChange={(e) =>
                setNewHoliday((h) => ({ ...h, type: e.target.value as HolidayType }))
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="GENERAL">General</option>
              <option value="OPTIONAL">Optional</option>
            </select>
          </div>
          <div className="md:col-span-5">
            <LoadingButton
              type="submit"
              loading={addingHoliday}
              loadingText="Adding..."
              className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add Holiday
            </LoadingButton>
          </div>
        </form>
      </section>

      {upcomingHoliday && (
        <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          Upcoming: {upcomingHoliday.name} on{" "}
          {dayjs(upcomingHoliday.date).format("DD MMM YYYY")}
        </div>
      )}

      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Type</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading &&
                holidays.map((holiday) => (
                  <tr key={holiday.id}>
                    <td className="px-4 py-2 text-sm text-slate-700">
                      {dayjs(holiday.date).format("DD MMM YYYY")}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-slate-900">
                      {holiday.name}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          holiday.type === "GENERAL"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {holiday.type === "GENERAL" ? "General" : "Optional"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        onClick={() => setDeleteTargetId(holiday.id)}
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && holidays.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                    No holidays found for this year.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CommonDialog
        isOpen={deleteTargetId !== null}
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday?"
        tone="error"
        confirmText="Delete"
        onConfirm={() => {
          if (deleteTargetId !== null) {
            handleDelete(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onClose={() => setDeleteTargetId(null)}
      />

      <CommonDialog
        isOpen={messageDialog.isOpen}
        title={messageDialog.title}
        message={messageDialog.message}
        tone={messageDialog.tone}
        confirmText="OK"
        hideCancel
        onClose={() =>
          setMessageDialog({
            isOpen: false,
            title: "",
            message: "",
            tone: "success",
          })
        }
      />
    </div>
  );
} 