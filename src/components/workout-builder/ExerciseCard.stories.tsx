import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, expect } from 'storybook/test';
import { WorkoutBuilderProvider } from './WorkoutBuilderContext';
import { ExerciseCard } from './ExerciseCard';
import { mockExercise, mockExerciseDuration, mockExerciseWithDropset } from '../../stories/fixtures';

const meta = {
  title: 'Workout Builder/ExerciseCard',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <WorkoutBuilderProvider initialExercises={[mockExercise, mockExerciseDuration, mockExerciseWithDropset]}>
        <div className="p-4 max-w-lg">
          <Story />
        </div>
      </WorkoutBuilderProvider>
    ),
  ],
  render: () => <ExerciseCard exercise={mockExercise} />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const WeightReps: Story = {};

export const Duration: Story = {
  render: () => <ExerciseCard exercise={mockExerciseDuration} />,
};

export const WithDropset: Story = {
  render: () => <ExerciseCard exercise={mockExerciseWithDropset} />,
};

export const OpenContextMenu: Story = {
  play: async ({ canvas }) => {
    // Find the options/more button (three dots)
    const btns = canvas.getAllByRole('button');
    // The context menu button is typically the last in the header area
    const menuBtn = btns.find((b) => b.title?.includes('Opções') || b.querySelector('circle'));
    if (menuBtn) await userEvent.click(menuBtn);
  },
};
