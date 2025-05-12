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
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills & Interests</h2>
      
      {/* Skills Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Award className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Professional Skills</h3>
        </div>
        
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
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
                className="ml-2 inline-flex items-center p-0.5 rounded-full text-indigo-600 hover:bg-indigo-200 focus:outline-none"
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
          <Heart className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Personal Interests</h3>
        </div>

        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
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


