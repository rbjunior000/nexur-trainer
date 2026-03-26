import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, expect } from 'storybook/test';
import { WorkoutBuilderProvider } from './WorkoutBuilderContext';
import { SetList } from './SetList';
import { mockExercise, mockExerciseDuration, mockExerciseWithDropset } from '../../stories/fixtures';

const meta = {
  title: 'Workout Builder/SetList',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <WorkoutBuilderProvider initialExercises={[mockExercise, mockExerciseDuration, mockExerciseWithDropset]}>
        <div className="p-4 max-w-md">
          <Story />
        </div>
      </WorkoutBuilderProvider>
    ),
  ],
  render: () => <SetList exercise={mockExercise} />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const WeightReps: Story = {};

export const Duration: Story = {
  render: () => <SetList exercise={mockExerciseDuration} />,
};

export const WithDropset: Story = {
  render: () => <SetList exercise={mockExerciseWithDropset} />,
};

export const AddSet: Story = {
  play: async ({ canvas }) => {
    const addBtn = canvas.getByText(/Add.*série|Adicionar/i);
    await userEvent.click(addBtn);
    // Should now have one more row
    const rows = canvas.getAllByRole('row');
    await expect(rows.length).toBeGreaterThanOrEqual(5);
  },
};
