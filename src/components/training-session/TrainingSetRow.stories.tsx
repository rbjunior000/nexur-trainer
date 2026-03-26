import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TrainingSetRow } from './TrainingSetRow';
import { mockSet } from '../../stories/fixtures';

const trainingSet = {
  ...mockSet,
  distance: undefined as number | undefined,
  duration: '01:00',
  completed: false,
};

const baseArgs = {
  set: trainingSet,
  setIndex: 0,
  exerciseType: 'weight_reps',
  repsMode: 'fixed',
  isCurrent: false,
  showWeight: true,
  phase: 'work' as const,
  countdown: null,
  onToggle: fn(),
  onUpdateField: fn(),
};

const meta = {
  title: 'Training Session/TrainingSetRow',
  component: TrainingSetRow,
  tags: ['autodocs'],
  args: baseArgs,
  decorators: [
    (Story) => (
      <div className="bg-gray-900 p-4 max-w-md">
        <table className="w-full">
          <tbody>
            <Story />
          </tbody>
        </table>
      </div>
    ),
  ],
} satisfies Meta<typeof TrainingSetRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Current: Story = {
  args: { isCurrent: true },
};

export const Completed: Story = {
  args: { set: { ...trainingSet, completed: true } },
};

export const Warmup: Story = {
  args: { set: { ...trainingSet, type: 'warmup' as const, reps: 15, weight: 40 } },
};

export const Dropset: Story = {
  args: { set: { ...trainingSet, type: 'dropset' as const } },
};

export const DurationMode: Story = {
  args: {
    exerciseType: 'duration',
    set: { ...trainingSet, type: 'normal' as const, duration: '01:30', weight: 0, reps: 0 },
  },
};

export const DurationCountdown: Story = {
  args: {
    exerciseType: 'duration',
    isCurrent: true,
    phase: 'work',
    countdown: 45,
    set: { ...trainingSet, type: 'normal' as const, duration: '01:00', weight: 0, reps: 0 },
  },
};

export const RestCounting: Story = {
  args: {
    isCurrent: true,
    phase: 'rest',
    countdown: 30,
    set: { ...trainingSet, completed: true },
  },
};

export const RangeMode: Story = {
  args: {
    repsMode: 'range',
    set: { ...trainingSet, repsRange: [8, 12] },
  },
};
