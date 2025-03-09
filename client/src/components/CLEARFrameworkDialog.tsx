import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Check, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { CLEARFrameworkData, CLEARFrameworkChoice } from '../../shared/schema';

const defaultFramework: CLEARFrameworkData = {
  cueChoices: [
    { id: 'c1', text: 'After Fajr prayer', selected: false },
    { id: 'c2', text: 'Before going to bed', selected: false },
    { id: 'c3', text: 'After each meal', selected: false },
    { id: 'c4', text: 'During work breaks', selected: false },
  ],
  lowFrictionChoices: [
    { id: 'l1', text: 'Takes less than 5 minutes', selected: false },
    { id: 'l2', text: 'Requires minimal preparation', selected: false },
    { id: 'l3', text: 'Can be done anywhere', selected: false },
    { id: 'l4', text: 'No special equipment needed', selected: false },
  ],
  expandableChoices: [
    { id: 'e1', text: 'Can increase duration', selected: false },
    { id: 'e2', text: 'Can add more repetitions', selected: false },
    { id: 'e3', text: 'Can enhance quality', selected: false },
    { id: 'e4', text: 'Can combine with other practices', selected: false },
  ],
  adaptableChoices: [
    { id: 'a1', text: 'Flexible timing', selected: false },
    { id: 'a2', text: 'Alternative methods available', selected: false },
    { id: 'a3', text: 'Can be modified based on energy', selected: false },
    { id: 'a4', text: 'Works in different locations', selected: false },
  ],
  rewardChoices: [
    { id: 'r1', text: 'Immediate spiritual benefit', selected: false },
    { id: 'r2', text: 'Trackable progress', selected: false },
    { id: 'r3', text: 'Sense of accomplishment', selected: false },
    { id: 'r4', text: 'Connection to larger goal', selected: false },
  ],
  summary: '',
};

interface CLEARSection {
  letter: string;
  title: string;
  description: string;
  choices: CLEARFrameworkChoice[];
  example: string;
}

interface CLEARFrameworkDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (framework: CLEARFrameworkData) => void;
  initialFramework?: CLEARFrameworkData;
  wirdTitle: string;
}

export const CLEARFrameworkDialog: React.FC<CLEARFrameworkDialogProps> = ({
  open,
  onClose,
  onSave,
  initialFramework,
  wirdTitle,
}) => {
  const [framework, setFramework] = useState<CLEARFrameworkData>(
    initialFramework || defaultFramework
  );
  const [saving, setSaving] = useState(false);

  const sections: CLEARSection[] = [
    {
      letter: 'C',
      title: 'Cue',
      description: 'Does the habit have a clear trigger?',
      choices: framework.cueChoices,
      example: 'Example: "After Fajr prayer" provides a specific time-based trigger',
    },
    {
      letter: 'L',
      title: 'Low Friction',
      description: 'Can I do this even on my worst day?',
      choices: framework.lowFrictionChoices,
      example: 'Example: "Takes less than 5 minutes" ensures the practice is manageable',
    },
    {
      letter: 'E',
      title: 'Expandable',
      description: 'Can I easily scale this up when I have time?',
      choices: framework.expandableChoices,
      example: 'Example: "Can add more repetitions" allows for growth',
    },
    {
      letter: 'A',
      title: 'Adaptable',
      description: 'Can I move it around if needed?',
      choices: framework.adaptableChoices,
      example: 'Example: "Flexible timing" ensures practice can fit your schedule',
    },
    {
      letter: 'R',
      title: 'Reward Linked',
      description: 'Does it give me an intrinsic or extrinsic reward?',
      choices: framework.rewardChoices,
      example: 'Example: "Immediate spiritual benefit" provides direct motivation',
    },
  ];

  const toggleChoice = (sectionLetter: string, choiceId: string) => {
    setFramework(prev => {
      const newFramework = { ...prev };
      const sectionKey = `${sectionLetter.toLowerCase()}Choices` as keyof CLEARFrameworkData;
      const choices = [...(newFramework[sectionKey] as CLEARFrameworkChoice[])];
      const choiceIndex = choices.findIndex(c => c.id === choiceId);
      
      if (choiceIndex !== -1) {
        choices[choiceIndex] = {
          ...choices[choiceIndex],
          selected: !choices[choiceIndex].selected,
        };
      }

      return {
        ...newFramework,
        [sectionKey]: choices,
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Generate summary using Anthropic (placeholder for now)
      const summary = `This wird is triggered by prayer times, takes minimal effort, can be expanded through repetition, adapts to your schedule, and provides immediate spiritual rewards.`;
      
      const updatedFramework = {
        ...framework,
        summary,
      };
      
      await onSave(updatedFramework);
      onClose();
    } catch (error) {
      console.error('Error saving CLEAR framework:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            CLEAR Framework for "{wirdTitle}"
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>The CLEAR framework helps you design habits that stick. Select options in each category to make your wird more sustainable.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
          <DialogDescription>
            Analyze and improve your wird practice using the CLEAR framework
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {sections.map((section) => (
            <div key={section.letter} className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">{section.letter}</span>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{section.title}</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{section.example}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">{section.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {section.choices.map(choice => (
                      <div
                        key={choice.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded cursor-pointer transition-all",
                          choice.selected ? "bg-primary/10" : "hover:bg-muted/50"
                        )}
                        onClick={() => toggleChoice(section.letter, choice.id)}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center",
                          choice.selected ? "bg-primary border-primary" : "border-input"
                        )}>
                          {choice.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm">{choice.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 