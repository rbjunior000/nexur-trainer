import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { ExerciseSummaryRow } from './ExerciseSummaryRow';
import { mockExercise, mockExerciseDuration, mockExerciseWithDropset } from '../../stories/fixtures';

const meta = {
  title: 'Workout Builder/ExerciseSummaryRow',
  component: ExerciseSummaryRow,
  tags: ['autodocs'],
  args: { onTap: fn() },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-sm bg-white border border-gray-100 rounded-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ExerciseSummaryRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WeightReps: Story = {
  args: { exercise: mockExercise },
};

export const Duration: Story = {
  args: { exercise: mockExerciseDuration },
};

export const WithDropset: Story = {
  args: { exercise: mockExerciseWithDropset },
};

export const TapToOpen: Story = {
  args: { exercise: mockExercise },
  play: async ({ canvas, args }) => {
    const row = canvas.getByRole('button');
    await userEvent.click(row);
    await expect(args.onTap).toHaveBeenCalled();
  },
};
