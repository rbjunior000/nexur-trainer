import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrainingSessionProvider } from './TrainingSessionContext';
import { GuidedView } from './GuidedView';
import { mockExerciseList } from '../../stories/fixtures';

const meta = {
  title: 'Training Session/GuidedView',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <TrainingSessionProvider sourceExercises={mockExerciseList} workoutName="Treino A">
        <div className="bg-gray-950 min-h-screen max-w-lg mx-auto">
          <Story />
        </div>
      </TrainingSessionProvider>
    ),
  ],
  render: () => <GuidedView />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
