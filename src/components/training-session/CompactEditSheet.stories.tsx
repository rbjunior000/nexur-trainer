import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrainingSessionProvider } from './TrainingSessionContext';
import { CompactEditSheet } from './CompactEditSheet';
import { mockExerciseList } from '../../stories/fixtures';

const mockTrainingExercise = {
  id: 'ex-1',
  name: 'Supino Reto',
  media1: null,
  media2: null,
  type: 'weight_reps',
  repsMode: 'fixed',
  sets: [
    { id: 's1', type: 'warmup' as const, reps: 15, weight: 40, rest: 30, pse: null, completed: false },
    { id: 's2', type: 'normal' as const, reps: 10, weight: 80, rest: 60, pse: null, completed: true },
  ],
  notes: '',
};

const meta = {
  title: 'Training Session/CompactEditSheet',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TrainingSessionProvider sourceExercises={mockExerciseList} workoutName="Treino A">
        <div className="bg-gray-950 min-h-screen max-w-lg relative">
          <Story />
        </div>
      </TrainingSessionProvider>
    ),
  ],
  render: () => (
    <CompactEditSheet exercise={mockTrainingExercise} exerciseIndex={0} onClose={() => {}} />
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
