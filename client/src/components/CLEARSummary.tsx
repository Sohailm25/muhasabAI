import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { CLEARFrameworkData } from '../../shared/schema';

interface CLEARSummaryProps {
  framework: CLEARFrameworkData;
  className?: string;
}

export const CLEARSummary: React.FC<CLEARSummaryProps> = ({
  framework,
  className = '',
}) => {
  // Helper function to get selected choices for a section
  const getSelectedChoices = (sectionKey: keyof CLEARFrameworkData) => {
    const choices = framework[sectionKey] as Array<{ text: string; selected: boolean }>;
    return choices.filter(choice => choice.selected).map(choice => choice.text);
  };

  // Create tooltip content for each section
  const tooltipContent = {
    cue: getSelectedChoices('cueChoices').join(', '),
    lowFriction: getSelectedChoices('lowFrictionChoices').join(', '),
    expandable: getSelectedChoices('expandableChoices').join(', '),
    adaptable: getSelectedChoices('adaptableChoices').join(', '),
    reward: getSelectedChoices('rewardChoices').join(', '),
  };

  const renderTooltipSection = (text: string, content: string) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-medium cursor-help">{text}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{content || 'No options selected'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <p className={`text-sm italic text-muted-foreground ${className}`}>
      This wird is {renderTooltipSection('triggered by prayer times', tooltipContent.cue)}, {' '}
      {renderTooltipSection('takes minimal effort', tooltipContent.lowFriction)}, {' '}
      {renderTooltipSection('can be expanded', tooltipContent.expandable)}, {' '}
      {renderTooltipSection('adapts', tooltipContent.adaptable)}, and {' '}
      {renderTooltipSection('provides rewards', tooltipContent.reward)}.
    </p>
  );
}; 