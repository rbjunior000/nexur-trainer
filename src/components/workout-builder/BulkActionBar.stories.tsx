import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { WorkoutBuilderProvider } from './WorkoutBuilderContext';
import { BulkActionBar } from './BulkActionBar';
import { mockExercise, mockExerciseDuration } from '../../stories/fixtures';

const meta = {
  title: 'Workout Builder/BulkActionBar',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <WorkoutBuilderProvider initialExercises={[mockExercise, mockExerciseDuration]}>
        <div className="max-w-md">
          <Story />
        </div>
      </WorkoutBuilderProvider>
    ),
  ],
  render: () => <BulkActionBar onFill={fn()} />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** BulkActionBar only renders in bulk mode — activate via enterBulkMode. */
export const Default: Story = {};
