import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrainingSessionProvider } from './TrainingSessionContext';
import { CompactView } from './CompactView';
import { mockExerciseList } from '../../stories/fixtures';

const meta = {
  title: 'Training Session/CompactView',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TrainingSessionProvider sourceExercises={mockExerciseList} workoutName="Treino A">
        <div className="bg-gray-950 min-h-screen p-4 max-w-lg">
          <Story />
        </div>
      </TrainingSessionProvider>
    ),
  ],
  render: () => <CompactView />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
