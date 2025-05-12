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
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Family Details</h2>
      {familyDetails.map((member) => (
        <div key={member.id} className="mb-6 pb-6 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => onChange(member.id, 'name', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Family Member Name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Heart className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={member.relationship}
                  onChange={(e) => onChange(member.id, 'relationship', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              <label className="block text-sm font-medium text-gray-700">Contact Number</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={member.contact}
                  onChange={(e) => onChange(member.id, 'contact', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+91 -----------"
                  required
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => onRemove(member.id)}
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
        Add Family Member
      </button>
    </div>
  );
}
