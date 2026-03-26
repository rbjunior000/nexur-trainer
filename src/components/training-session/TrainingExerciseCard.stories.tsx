import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrainingSessionProvider } from './TrainingSessionContext';
import { TrainingExerciseCard } from './TrainingExerciseCard';
import { mockExerciseList } from '../../stories/fixtures';

const meta = {
  title: 'Training Session/TrainingExerciseCard',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TrainingSessionProvider sourceExercises={mockExerciseList} workoutName="Treino A">
        <div className="bg-gray-950 p-4 max-w-lg">
          <Story />
        </div>
      </TrainingSessionProvider>
    ),
  ],
  render: () => <TrainingExerciseCard exercise={{
    id: 'ex-1',
    name: 'Supino Reto',
    media1: null,
    media2: null,
    type: 'weight_reps',
    repsMode: 'fixed',
    sets: [
      { id: 's1', type: 'warmup', reps: 15, weight: 40, rest: 30, pse: null, completed: false },
      { id: 's2', type: 'normal', reps: 10, weight: 80, rest: 60, pse: null, completed: true },
      { id: 's3', type: 'normal', reps: 10, weight: 80, rest: 60, pse: 7, completed: false },
    ],
    notes: 'Manter escápulas retraídas.',
  }} exerciseIndex={0} />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
