import React, { useEffect, useState } from 'react';
import { getHolidays, addHolidays, deleteHoliday } from '../../api/holidays';

export default function AdminHolidays() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState<any[]>([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', type: 'GENERAL' });

  useEffect(() => {
    fetchHolidays();
  }, [year]);

  const fetchHolidays = async () => {
    const data = await getHolidays(year);
    setHolidays(data);
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.date || !newHoliday.name) return;
    await addHolidays([{ ...newHoliday, year }]);
    setNewHoliday({ date: '', name: '', type: 'GENERAL' });
    fetchHolidays();
  };

  const handleDelete = async (id: number) => {
    await deleteHoliday(id);
    fetchHolidays();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Holiday List ({year})</h2>
      <div className="mb-4 flex gap-2">
        <label>Year:</label>
        <input
          type="number"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="border rounded px-2 py-1 w-24"
        />
      </div>
      <form onSubmit={handleAddHoliday} className="flex gap-2 mb-4">
        <input
          type="date"
          value={newHoliday.date}
          onChange={e => setNewHoliday(h => ({ ...h, date: e.target.value }))}
          className="border rounded px-2 py-1"
          required
        />
        <input
          type="text"
          placeholder="Holiday Name"
          value={newHoliday.name}
          onChange={e => setNewHoliday(h => ({ ...h, name: e.target.value }))}
          className="border rounded px-2 py-1"
          required
        />
        <select
          value={newHoliday.type}
          onChange={e => setNewHoliday(h => ({ ...h, type: e.target.value }))}
          className="border rounded px-2 py-1"
        >
          <option value="GENERAL">General</option>
          <option value="OPTIONAL">Optional</option>
        </select>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-1 rounded">Add</button>
      </form>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Type</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {holidays.map(h => (
            <tr key={h.id}>
              <td className="border px-2 py-1">{h.date}</td>
              <td className="border px-2 py-1">{h.name}</td>
              <td className="border px-2 py-1">{h.type}</td>
              <td className="border px-2 py-1">
                <button onClick={() => handleDelete(h.id)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
          {holidays.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-2">No holidays found for this year.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 