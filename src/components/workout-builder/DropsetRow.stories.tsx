import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { DropsetRow } from './DropsetRow';
import { mockDropset } from '../../stories/fixtures';

const meta = {
  title: 'Workout Builder/DropsetRow',
  component: DropsetRow,
  tags: ['autodocs'],
  args: {
    drop: mockDropset,
    isLast: true,
    exerciseType: 'weight_reps',
    hasReps: true,
    isRange: false,
    onUpdate: fn(),
    onRemove: fn(),
    onAdd: fn(),
  },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-sm">
        <table className="w-full">
          <tbody>
            <Story />
          </tbody>
        </table>
      </div>
    ),
  ],
} satisfies Meta<typeof DropsetRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NotLast: Story = {
  args: { isLast: false },
};

export const DurationType: Story = {
  args: { exerciseType: 'duration', hasReps: false },
};

export const MultipleDropsets: Story = {
  render: (args) => (
    <div className="p-4 max-w-sm space-y-1">
      <DropsetRow {...args} drop={{ id: 'd1', reps: 10, weight: 30, duration: '00:30' }} isLast={false} />
      <DropsetRow {...args} drop={{ id: 'd2', reps: 8, weight: 25, duration: '00:30' }} isLast={false} />
      <DropsetRow {...args} drop={{ id: 'd3', reps: 6, weight: 20, duration: '00:30' }} isLast />
    </div>
  ),
};
