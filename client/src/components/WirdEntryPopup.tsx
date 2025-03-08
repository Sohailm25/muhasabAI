import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '../lib/utils';

export type WirdType = 'general' | 'rakat' | 'dhikr';

export type WirdEntry = {
  id: string;
  title: string;
  type: WirdType;
  status: 'completed' | 'incomplete';
  count?: number;
  notes?: string;
};

interface WirdEntryPopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: WirdEntry) => void;
  wird: WirdEntry;
}

export const WirdEntryPopup: React.FC<WirdEntryPopupProps> = ({
  open,
  onClose,
  onSave,
  wird,
}) => {
  const [entry, setEntry] = useState<WirdEntry>({
    ...wird,
    status: 'completed', // Default to completed
  });

  const handleSave = () => {
    onSave(entry);
    onClose();
  };

  const handleCountChange = (value: number) => {
    setEntry(prev => ({
      ...prev,
      count: value,
    }));
  };

  const renderCountInput = () => {
    if (entry.type === 'rakat') {
      return (
        <div className="space-y-2">
          <Label>Number of Rakat</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCountChange(Math.max(2, (entry.count || 2) - 2))}
            >
              -2
            </Button>
            <span className="w-12 text-center">{entry.count || 2}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCountChange((entry.count || 2) + 2)}
            >
              +2
            </Button>
          </div>
        </div>
      );
    }

    if (entry.type === 'dhikr') {
      return (
        <div className="space-y-2">
          <Label>Count</Label>
          <Input
            type="number"
            min="1"
            value={entry.count || 0}
            onChange={(e) => handleCountChange(parseInt(e.target.value) || 0)}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{entry.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={entry.status}
              onValueChange={(value: 'completed' | 'incomplete') =>
                setEntry(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderCountInput()}

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={entry.notes || ''}
              onChange={(e) => setEntry(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this practice..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 