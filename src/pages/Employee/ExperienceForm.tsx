import React from 'react';
import { Briefcase, Building2, Calendar, FileText, Plus, Trash2 } from 'lucide-react';

interface Experience {
  id: number;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  // Experience: number;

  
}

interface ExperienceFormProps {
  experience: Experience[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: string, value: string) => void;
}

export default function ExperienceForm({ experience, onAdd, onRemove, onChange }: ExperienceFormProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Work Experience</h2>
      
      {experience.map((exp) => (
        
        
        <div key={exp.id} className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4 last:mb-0">
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Company</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => onChange(exp.id, 'company', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Company Name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Position</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => onChange(exp.id, 'position', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Job Title"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Start Date</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  value={exp.startDate}
                  onChange={(e) => onChange(exp.id, 'startDate', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">End Date</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  value={exp.endDate}
                  onChange={(e) => onChange(exp.id, 'endDate', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Description</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <textarea
                  value={exp.description}
                  onChange={(e) => onChange(exp.id, 'description', e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Job responsibilities and achievements"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => onRemove(exp.id)}
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
        Add Experience
      </button>
    </div>
  );
}


