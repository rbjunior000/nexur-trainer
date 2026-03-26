import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SetRow } from './SetRow';
import { mockSet, mockDropset } from '../../stories/fixtures';

const baseArgs = {
  set: mockSet,
  index: 0,
  exerciseType: 'weight_reps' as const,
  repsMode: 'fixed' as const,
  onUpdate: fn(),
  onUpdateType: fn(),
  onRemove: fn(),
  onAddDropset: fn(),
  onRemoveDropset: fn(),
  onUpdateDropset: fn(),
};

const meta = {
  title: 'Workout Builder/SetRow',
  component: SetRow,
  tags: ['autodocs'],
  args: baseArgs,
  decorators: [
    (Story) => (
      <div className="p-4 max-w-md bg-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SetRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Warmup: Story = {
  args: { set: { ...mockSet, type: 'warmup', reps: 15, weight: 40 }, index: 0 },
};

export const Dropset: Story = {
  args: {
    set: {
      ...mockSet,
      type: 'dropset',
      dropsets: [mockDropset],
    },
    index: 1,
  },
};

export const DurationMode: Story = {
  args: {
    exerciseType: 'duration',
    repsMode: 'fixed',
    set: { ...mockSet, type: 'normal', duration: '01:00', weight: 0, reps: 0 },
  },
};

export const RangeMode: Story = {
  args: {
    repsMode: 'range',
    set: { ...mockSet, repsRange: [8, 12] },
  },
};
