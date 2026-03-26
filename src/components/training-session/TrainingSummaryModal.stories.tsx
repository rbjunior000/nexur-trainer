import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { TrainingSessionProvider } from './TrainingSessionContext';
import { TrainingSummaryModal } from './TrainingSummaryModal';
import { mockExerciseList } from '../../stories/fixtures';

const meta = {
  title: 'Training Session/TrainingSummaryModal',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TrainingSessionProvider sourceExercises={mockExerciseList} workoutName="Treino A">
        <Story />
      </TrainingSessionProvider>
    ),
  ],
  render: () => <TrainingSummaryModal />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The modal renders based on `showSummary` state in TrainingSessionContext.
 * Trigger via stopSession() or use the full training page story.
 */
export const Default: Story = {};
