import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Check, Edit2, X } from 'lucide-react';
import { cn } from '../lib/utils';

type CLEAROption = {
  id: string;
  text: string;
  selected: boolean;
};

type CLEARSection = {
  letter: string;
  title: string;
  description: string;
  options: CLEAROption[];
};

const defaultFramework: CLEARSection[] = [
  {
    letter: 'C',
    title: 'Cue',
    description: 'Does the habit have a clear trigger?',
    options: [
      { id: 'c1', text: 'After Fajr prayer', selected: false },
      { id: 'c2', text: 'Before going to bed', selected: false },
      { id: 'c3', text: 'After each meal', selected: false },
      { id: 'c4', text: 'During work breaks', selected: false },
    ],
  },
  {
    letter: 'L',
    title: 'Low Friction',
    description: 'Can I do this even on my worst day?',
    options: [
      { id: 'l1', text: 'Takes less than 5 minutes', selected: false },
      { id: 'l2', text: 'Requires minimal preparation', selected: false },
      { id: 'l3', text: 'Can be done anywhere', selected: false },
      { id: 'l4', text: 'No special equipment needed', selected: false },
    ],
  },
  {
    letter: 'E',
    title: 'Expandable',
    description: 'Can I easily scale this up when I have time?',
    options: [
      { id: 'e1', text: 'Can increase duration', selected: false },
      { id: 'e2', text: 'Can add more repetitions', selected: false },
      { id: 'e3', text: 'Can enhance quality', selected: false },
      { id: 'e4', text: 'Can combine with other practices', selected: false },
    ],
  },
  {
    letter: 'A',
    title: 'Adaptable',
    description: 'Can I move it around if needed?',
    options: [
      { id: 'a1', text: 'Flexible timing', selected: false },
      { id: 'a2', text: 'Alternative methods available', selected: false },
      { id: 'a3', text: 'Can be modified based on energy', selected: false },
      { id: 'a4', text: 'Works in different locations', selected: false },
    ],
  },
  {
    letter: 'R',
    title: 'Reward Linked',
    description: 'Does it give me an intrinsic or extrinsic reward?',
    options: [
      { id: 'r1', text: 'Immediate spiritual benefit', selected: false },
      { id: 'r2', text: 'Trackable progress', selected: false },
      { id: 'r3', text: 'Sense of accomplishment', selected: false },
      { id: 'r4', text: 'Connection to larger goal', selected: false },
    ],
  },
];

export const CLEARFramework: React.FC = () => {
  const [framework, setFramework] = useState<CLEARSection[]>(defaultFramework);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(!isEditing);
    setEditingIndex(null);
  };

  const toggleSection = (index: number) => {
    if (isEditing) {
      setEditingIndex(editingIndex === index ? null : index);
    }
  };

  const toggleOption = (sectionIndex: number, optionId: string) => {
    setFramework(prev => prev.map((section, idx) => {
      if (idx === sectionIndex) {
        return {
          ...section,
          options: section.options.map(opt => 
            opt.id === optionId ? { ...opt, selected: !opt.selected } : opt
          ),
        };
      }
      return section;
    }));
  };

  return (
    <Card className="p-6 relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-4 top-4"
        onClick={handleEdit}
      >
        {isEditing ? (
          <>
            <Check className="h-4 w-4 mr-1" />
            Done
          </>
        ) : (
          <>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </>
        )}
      </Button>

      <div className="space-y-4 mt-8">
        {framework.map((section, index) => (
          <div
            key={section.letter}
            className={cn(
              'p-4 rounded-lg transition-all',
              isEditing ? 'cursor-pointer hover:bg-muted/50' : '',
              editingIndex === index ? 'bg-muted' : ''
            )}
            onClick={() => toggleSection(index)}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">{section.letter}</span>
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-lg">{section.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">{section.description}</p>
                
                {editingIndex === index ? (
                  <div className="space-y-2 mt-4">
                    {section.options.map(option => (
                      <div
                        key={option.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOption(index, option.id);
                        }}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center',
                          option.selected ? 'bg-primary border-primary' : 'border-input'
                        )}>
                          {option.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm">{option.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {section.options
                      .filter(opt => opt.selected)
                      .map(option => (
                        <span
                          key={option.id}
                          className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                        >
                          {option.text}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}; 