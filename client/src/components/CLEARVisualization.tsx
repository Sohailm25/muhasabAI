import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CLEARFrameworkData, WirdEntry } from '@shared/schema';
import { format, subDays, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

interface CLEARVisualizationProps {
  open: boolean;
  onClose: () => void;
  wirds: WirdEntry[];
}

interface FrameworkStats {
  totalSelections: number;
  mostCommonChoices: {
    cue: { text: string; count: number }[];
    lowFriction: { text: string; count: number }[];
    expandable: { text: string; count: number }[];
    adaptable: { text: string; count: number }[];
    reward: { text: string; count: number }[];
  };
  completionRate: number;
}

interface PracticeStats {
  name: string;
  totalCount: number;
  completedCount: number;
  completionRate: number;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastCompleted: Date | null;
  };
  weeklyAverage: number;
  mostProductiveDay: string;
}

const calculatePracticeStats = (wirds: WirdEntry[]): PracticeStats[] => {
  const practiceMap = new Map<string, {
    totalCount: number;
    completedCount: number;
    streakData: {
      currentStreak: number;
      longestStreak: number;
      lastCompleted: Date | null;
    };
    dailyCounts: Map<string, number>;
    weeklyCompletions: number[];
  }>();

  // Sort wirds by date
  const sortedWirds = [...wirds].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedWirds.forEach(wird => {
    wird.practices.forEach(practice => {
      const stats = practiceMap.get(practice.name) || {
        totalCount: 0,
        completedCount: 0,
        streakData: {
          currentStreak: 0,
          longestStreak: 0,
          lastCompleted: null,
        },
        dailyCounts: new Map<string, number>(),
        weeklyCompletions: Array(7).fill(0),
      };

      // Update basic counts
      stats.totalCount++;
      if (practice.status === 'completed') {
        stats.completedCount++;

        // Update daily counts
        const dayOfWeek = format(new Date(wird.date), 'EEEE');
        stats.dailyCounts.set(
          dayOfWeek,
          (stats.dailyCounts.get(dayOfWeek) || 0) + 1
        );

        // Update weekly counts
        const dayIndex = new Date(wird.date).getDay();
        stats.weeklyCompletions[dayIndex]++;

        // Update streak data
        const practiceDate = new Date(wird.date);
        if (!stats.streakData.lastCompleted) {
          stats.streakData.currentStreak = 1;
          stats.streakData.longestStreak = 1;
          stats.streakData.lastCompleted = practiceDate;
        } else {
          const dayDiff = Math.floor(
            (practiceDate.getTime() - stats.streakData.lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dayDiff === 1) {
            stats.streakData.currentStreak++;
            stats.streakData.longestStreak = Math.max(
              stats.streakData.longestStreak,
              stats.streakData.currentStreak
            );
          } else if (dayDiff > 1) {
            stats.streakData.currentStreak = 1;
          }
          stats.streakData.lastCompleted = practiceDate;
        }
      }

      practiceMap.set(practice.name, stats);
    });
  });

  // Convert map to array and calculate additional stats
  return Array.from(practiceMap.entries()).map(([name, stats]) => {
    const completionRate = (stats.completedCount / stats.totalCount) * 100;
    const weeklyAverage = stats.weeklyCompletions.reduce((a, b) => a + b, 0) / 
      Math.ceil(sortedWirds.length / 7);

    // Find most productive day
    let maxCount = 0;
    let mostProductiveDay = '';
    stats.dailyCounts.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count;
        mostProductiveDay = day;
      }
    });

    return {
      name,
      totalCount: stats.totalCount,
      completedCount: stats.completedCount,
      completionRate,
      streakData: stats.streakData,
      weeklyAverage,
      mostProductiveDay,
    };
  }).sort((a, b) => b.completionRate - a.completionRate);
};

const calculateFrameworkStats = (wirds: WirdEntry[]): FrameworkStats => {
  const stats: FrameworkStats = {
    totalSelections: 0,
    mostCommonChoices: {
      cue: [],
      lowFriction: [],
      expandable: [],
      adaptable: [],
      reward: [],
    },
    completionRate: 0,
  };

  const choiceCounts = {
    cue: new Map<string, number>(),
    lowFriction: new Map<string, number>(),
    expandable: new Map<string, number>(),
    adaptable: new Map<string, number>(),
    reward: new Map<string, number>(),
  };

  let totalWirdsWithFramework = 0;
  let totalCompletedPractices = 0;
  let totalPractices = 0;

  wirds.forEach(wird => {
    if (wird.clearFramework) {
      totalWirdsWithFramework++;

      // Count choices
      wird.clearFramework.cueChoices.forEach(choice => {
        if (choice.selected) {
          stats.totalSelections++;
          const current = choiceCounts.cue.get(choice.text) || 0;
          choiceCounts.cue.set(choice.text, current + 1);
        }
      });

      wird.clearFramework.lowFrictionChoices.forEach(choice => {
        if (choice.selected) {
          stats.totalSelections++;
          const current = choiceCounts.lowFriction.get(choice.text) || 0;
          choiceCounts.lowFriction.set(choice.text, current + 1);
        }
      });

      wird.clearFramework.expandableChoices.forEach(choice => {
        if (choice.selected) {
          stats.totalSelections++;
          const current = choiceCounts.expandable.get(choice.text) || 0;
          choiceCounts.expandable.set(choice.text, current + 1);
        }
      });

      wird.clearFramework.adaptableChoices.forEach(choice => {
        if (choice.selected) {
          stats.totalSelections++;
          const current = choiceCounts.adaptable.get(choice.text) || 0;
          choiceCounts.adaptable.set(choice.text, current + 1);
        }
      });

      wird.clearFramework.rewardChoices.forEach(choice => {
        if (choice.selected) {
          stats.totalSelections++;
          const current = choiceCounts.reward.get(choice.text) || 0;
          choiceCounts.reward.set(choice.text, current + 1);
        }
      });
    }

    // Calculate completion rate
    wird.practices.forEach(practice => {
      totalPractices++;
      if (practice.status === 'completed') {
        totalCompletedPractices++;
      }
    });
  });

  // Convert maps to sorted arrays
  stats.mostCommonChoices.cue = Array.from(choiceCounts.cue.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  stats.mostCommonChoices.lowFriction = Array.from(choiceCounts.lowFriction.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  stats.mostCommonChoices.expandable = Array.from(choiceCounts.expandable.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  stats.mostCommonChoices.adaptable = Array.from(choiceCounts.adaptable.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  stats.mostCommonChoices.reward = Array.from(choiceCounts.reward.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  stats.completionRate = totalPractices > 0 
    ? (totalCompletedPractices / totalPractices) * 100 
    : 0;

  return stats;
};

const ProgressChart: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full h-4 bg-secondary rounded-full overflow-hidden">
    <div 
      className="h-full bg-primary transition-all duration-500 ease-in-out"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const PracticeCard: React.FC<{ practice: PracticeStats }> = ({ practice }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg font-medium">{practice.name}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Completion Rate</p>
          <div className="mt-1">
            <ProgressChart value={practice.completionRate} />
            <p className="text-sm mt-1">{practice.completionRate.toFixed(1)}%</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Weekly Average</p>
          <p className="text-2xl font-bold">{practice.weeklyAverage.toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Streak</p>
          <p className="text-2xl font-bold">{practice.streakData.currentStreak} days</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Longest Streak</p>
          <p className="text-2xl font-bold">{practice.streakData.longestStreak} days</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Most Productive Day</p>
        <p className="text-lg font-medium">{practice.mostProductiveDay || 'N/A'}</p>
      </div>

      <div className="pt-2 border-t">
        <p className="text-sm text-muted-foreground">Total Completions</p>
        <p className="text-lg">
          {practice.completedCount} of {practice.totalCount} times
        </p>
      </div>
    </CardContent>
  </Card>
);

export const CLEARVisualization: React.FC<CLEARVisualizationProps> = ({
  open,
  onClose,
  wirds,
}) => {
  const stats = calculateFrameworkStats(wirds);
  const practiceStats = calculatePracticeStats(wirds);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CLEAR Framework Analytics</DialogTitle>
          <DialogDescription>
            Analyze your wird practices and track progress over time
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="practices">Practices</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Overall Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Framework Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalSelections}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total selections made
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.completionRate.toFixed(1)}%
                  </div>
                  <ProgressChart value={stats.completionRate} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Wirds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {wirds.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total wird entries
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Most Common Choices */}
            <Card>
              <CardHeader>
                <CardTitle>Most Common Choices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Cue Triggers</h4>
                    <ul className="space-y-2">
                      {stats.mostCommonChoices.cue.map(choice => (
                        <li key={choice.text} className="text-sm">
                          {choice.text} ({choice.count}x)
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Low Friction</h4>
                    <ul className="space-y-2">
                      {stats.mostCommonChoices.lowFriction.map(choice => (
                        <li key={choice.text} className="text-sm">
                          {choice.text} ({choice.count}x)
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Expandable</h4>
                    <ul className="space-y-2">
                      {stats.mostCommonChoices.expandable.map(choice => (
                        <li key={choice.text} className="text-sm">
                          {choice.text} ({choice.count}x)
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Adaptable</h4>
                    <ul className="space-y-2">
                      {stats.mostCommonChoices.adaptable.map(choice => (
                        <li key={choice.text} className="text-sm">
                          {choice.text} ({choice.count}x)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practices" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {practiceStats.map(practice => (
                <PracticeCard key={practice.name} practice={practice} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wirds.slice(-7).map(wird => (
                    <div key={wird.id} className="flex items-center gap-4">
                      <div className="w-32 text-sm">
                        {format(new Date(wird.date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex-1">
                        <ProgressChart 
                          value={
                            (wird.practices.filter(p => p.status === 'completed').length / 
                            wird.practices.length) * 100
                          } 
                        />
                      </div>
                      <div className="w-16 text-sm text-right">
                        {((wird.practices.filter(p => p.status === 'completed').length / 
                          wird.practices.length) * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 