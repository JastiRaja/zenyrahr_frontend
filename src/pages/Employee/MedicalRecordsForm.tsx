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
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Medical Records</h2>
      {medicalRecords.map((record) => (
        <div key={record.id} className="mb-6 pb-6 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Condition</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Heart className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={record.condition}
                  onChange={(e) => onChange(record.id, 'condition', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Medical Condition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={record.date}
                  onChange={(e) => onChange(record.id, 'date', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Details</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  value={record.details}
                  onChange={(e) => onChange(record.id, 'details', e.target.value)}
                  rows={3}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Medical condition details and treatment"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => onRemove(record.id)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
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
        className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Medical Record
      </button>
    </div>
  );
}

