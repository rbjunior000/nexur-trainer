import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkoutBuilderProvider } from './WorkoutBuilderContext';
import { RestCard } from './RestCard';
import { mockRestExercise, mockExercise } from '../../stories/fixtures';

const meta = {
  title: 'Workout Builder/RestCard',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <WorkoutBuilderProvider initialExercises={[mockExercise, mockRestExercise]}>
        <div className="p-4 max-w-sm">
          <Story />
        </div>
      </WorkoutBuilderProvider>
    ),
  ],
  render: () => <RestCard exercise={mockRestExercise} />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
