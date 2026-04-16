import React from 'react';
import { Heart, Calendar, FileText, Plus, Trash2 } from 'lucide-react';

interface MedicalRecord {
  id: number;
  condition: string;
  date: string;
  details: string;
}

interface MedicalRecordsFormProps {
  medicalRecords: MedicalRecord[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: string, value: string) => void;
}

export default function MedicalRecordsForm({ medicalRecords, onAdd, onRemove, onChange }: MedicalRecordsFormProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Medical Records</h2>
      {medicalRecords.map((record) => (
        <div key={record.id} className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4 last:mb-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Condition</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Heart className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={record.condition}
                  onChange={(e) => onChange(record.id, 'condition', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Medical Condition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Date</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  value={record.date}
                  onChange={(e) => onChange(record.id, 'date', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Details</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <textarea
                  value={record.details}
                  onChange={(e) => onChange(record.id, 'details', e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Medical condition details and treatment"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => onRemove(record.id)}
                className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Medical Record
      </button>
    </div>
  );
}

