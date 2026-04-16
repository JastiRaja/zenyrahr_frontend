import React from 'react';
import { Award, Heart, Plus, X } from 'lucide-react';

interface SkillsInterestsFormProps {
  skills: string[];
  interests: string[];
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (index: number) => void;
  onAddInterest: (interest: string) => void;
  onRemoveInterest: (index: number) => void;
}

export default function SkillsInterestsForm({
  skills,
  interests,
  onAddSkill,
  onRemoveSkill,
  onAddInterest,
  onRemoveInterest,
}: SkillsInterestsFormProps) {
  const [newSkill, setNewSkill] = React.useState('');
  const [newInterest, setNewInterest] = React.useState('');

  const handleAddSkill = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newSkill.trim()) {
      onAddSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  const handleAddInterest = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newInterest.trim()) {
      onAddInterest(newInterest.trim());
      setNewInterest('');
    }
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Skills & Interests</h2>
      
      {/* Skills Section */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Award className="mr-2 h-5 w-5 text-sky-700" />
          <h3 className="text-base font-semibold text-slate-900">Professional Skills</h3>
        </div>
        
        <div className="mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="Add a skill (e.g., JavaScript, Project Management)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill(e as any);
                }
              }}
            />
            <button
              onClick={handleAddSkill}
              className="inline-flex items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
              
            >
              {skill}
              <button
                type="button"
                onClick={() => onRemoveSkill(index)}
                className="ml-2 inline-flex items-center rounded-full p-0.5 text-indigo-600 hover:bg-indigo-200 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Interests Section */}
      <div>
        <div className="flex items-center mb-4">
          <Heart className="mr-2 h-5 w-5 text-emerald-700" />
          <h3 className="text-base font-semibold text-slate-900">Personal Interests</h3>
        </div>

        <div className="mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              className="flex-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="Add an interest (e.g., Photography, Travel)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInterest(e as any);
                }
              }}
            />
            <button
              onClick={handleAddInterest}
              className="inline-flex items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {interests.map((interest, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
            >
              {interest}
              <button
                type="button"
                onClick={() => onRemoveInterest(index)}
                className="ml-2 inline-flex items-center p-0.5 rounded-full text-green-600 hover:bg-green-200 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}


