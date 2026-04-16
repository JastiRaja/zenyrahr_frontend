import React from 'react';
import { Users, Phone, Heart, Plus, Trash2 } from 'lucide-react';

interface FamilyMember {
  id: number;
  name: string;
  relationship: string;
  contact: string;
}

interface FamilyDetailsFormProps {
  familyDetails: FamilyMember[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (id: number, field: string, value: string) => void;
}

export default function FamilyDetailsForm({ familyDetails, onAdd, onRemove, onChange }: FamilyDetailsFormProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Family Details</h2>
      {familyDetails.map((member) => (
        <div key={member.id} className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4 last:mb-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Name</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => onChange(member.id, 'name', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Family Member Name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Relationship</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Heart className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  value={member.relationship}
                  onChange={(e) => onChange(member.id, 'relationship', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  required
                >
                  <option value="">Select Relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Contact Number</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="tel"
                  value={member.contact}
                  onChange={(e) => onChange(member.id, 'contact', e.target.value)}
                  className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="+91 -----------"
                  required
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => onRemove(member.id)}
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
        Add Family Member
      </button>
    </div>
  );
}
