import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { CalendarDays } from "lucide-react";
import { getPublicHolidays, Holiday } from "../../api/holidays";

export default function HolidayList() {
  const [holidayYear, setHolidayYear] = useState<number>(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayError, setHolidayError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHolidayCalendar = async () => {
      try {
        setHolidayError(null);
        const data = await getPublicHolidays(holidayYear);
        setHolidays(Array.isArray(data) ? data : []);
      } catch {
        setHolidayError("Failed to load holiday calendar.");
      }
    };

    fetchHolidayCalendar();
  }, [holidayYear]);

  const generalHolidays = holidays.filter((holiday) => holiday.type === "GENERAL").length;
  const optionalHolidays = holidays.filter((holiday) => holiday.type !== "GENERAL").length;
  const upcomingHoliday = holidays.find((holiday) =>
    dayjs(holiday.date).isAfter(dayjs().startOf("day"))
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Holiday List</h1>
          <p className="mt-1 text-sm text-sky-50">
            Published yearly holidays for all employees.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Year</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{holidayYear}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Holidays</p>
            <p className="mt-1 text-xl font-bold text-sky-700">{holidays.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">General</p>
            <p className="mt-1 text-xl font-bold text-indigo-700">{generalHolidays}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Optional</p>
            <p className="mt-1 text-xl font-bold text-amber-700">{optionalHolidays}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-sky-100 p-2 text-sky-700">
              <CalendarDays className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Holiday Calendar</h2>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="holiday-year" className="text-sm text-slate-600">Year</label>
            <input
              id="holiday-year"
              type="number"
              value={holidayYear}
              onChange={(e) => setHolidayYear(Number(e.target.value))}
              className="w-28 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {upcomingHoliday && (
          <div className="mb-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
            Upcoming: {upcomingHoliday.name} on{" "}
            {dayjs(upcomingHoliday.date).format("DD MMM YYYY")}
          </div>
        )}

        {holidayError && (
          <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {holidayError}
          </p>
        )}

        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Holiday</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {holidays.length > 0 ? holidays.map((holiday) => (
                <tr key={holiday.id}>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {dayjs(holiday.date).format("DD MMM YYYY")}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium text-slate-900">{holiday.name}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      holiday.type === "GENERAL"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {holiday.type === "GENERAL" ? "General" : "Optional"}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                    No holidays published for {holidayYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
