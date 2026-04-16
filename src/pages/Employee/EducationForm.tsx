import React from 'react';
import { GraduationCap, Building2, BookOpen, Calendar, Plus, Trash2 } from 'lucide-react';

interface Education {
  id: number;
  degree: string;
  institution: string;
  year: string;
  field: string;
}

interface EducationFormProps {
  education: Education[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: string, value: string) => void;
}

export default function EducationForm({ education, onAdd, onRemove, onChange }: EducationFormProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Educational Background</h2>
      {education.map((edu) => (
        <div key={edu.id} className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4 last:mb-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Degree</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GraduationCap className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => onChange(edu.id, 'degree', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Bachelor's Degree"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Institution</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => onChange(edu.id, 'institution', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="University Name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Field of Study</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BookOpen className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={edu.field}
                  onChange={(e) => onChange(edu.id, 'field', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Computer Science"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Graduation Year</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={edu.year}
                  onChange={(e) => onChange(edu.id, 'year', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="2020"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => onRemove(edu.id)}
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
        Add Education
      </button>
    </div>
  );
}


