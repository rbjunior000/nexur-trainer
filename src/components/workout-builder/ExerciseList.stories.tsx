import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkoutBuilderProvider } from './WorkoutBuilderContext';
import { ExerciseList } from './ExerciseList';
import { mockExercise, mockExerciseDuration, mockRestExercise, mockExerciseWithDropset } from '../../stories/fixtures';

const meta = {
  title: 'Workout Builder/ExerciseList',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <WorkoutBuilderProvider
        initialExercises={[mockExercise, mockRestExercise, mockExerciseDuration, mockExerciseWithDropset]}
      >
        <div className="p-4 max-w-lg">
          <Story />
        </div>
      </WorkoutBuilderProvider>
    ),
  ],
  render: () => <ExerciseList />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <WorkoutBuilderProvider initialExercises={[]}>
        <div className="p-4 max-w-lg">
          <Story />
        </div>
      </WorkoutBuilderProvider>
    ),
  ],
};

export const LockedType: Story = {
  render: () => <ExerciseList lockType={true} />,
};
