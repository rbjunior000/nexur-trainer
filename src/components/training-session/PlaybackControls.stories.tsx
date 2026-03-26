import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { TrainingSessionProvider } from './TrainingSessionContext';
import { PlaybackControls } from './PlaybackControls';
import { mockExerciseList } from '../../stories/fixtures';

const meta = {
  title: 'Training Session/PlaybackControls',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TrainingSessionProvider sourceExercises={mockExerciseList} workoutName="Treino A">
        <div className="max-w-lg bg-gray-900">
          <Story />
        </div>
      </TrainingSessionProvider>
    ),
  ],
  render: () => <PlaybackControls />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PauseResume: Story = {
  play: async ({ canvas }) => {
    const playPauseBtn = canvas.getAllByRole('button').find(
      (b) => b.className.includes('w-16') || b.className.includes('rounded-full')
    );
    if (playPauseBtn) {
      await userEvent.click(playPauseBtn);
    }
  },
};
