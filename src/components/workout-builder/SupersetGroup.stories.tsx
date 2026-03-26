import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkoutBuilderProvider } from './WorkoutBuilderContext';
import { SupersetGroup } from './SupersetGroup';
import { mockExercise, mockExerciseDuration } from '../../stories/fixtures';

const leadEx = { ...mockExercise, supersetWithNext: true, cor: '#FBBF24' };

const meta = {
  title: 'Workout Builder/SupersetGroup',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <WorkoutBuilderProvider initialExercises={[leadEx, mockExerciseDuration]}>
        <div className="p-4 max-w-lg">
          <Story />
        </div>
      </WorkoutBuilderProvider>
    ),
  ],
  render: () => (
    <SupersetGroup leadExercise={leadEx}>
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">Supino Reto</div>
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">Prancha</div>
    </SupersetGroup>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomColor: Story = {
  render: () => (
    <SupersetGroup leadExercise={{ ...leadEx, cor: '#4488FF' }}>
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">Exercício A</div>
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">Exercício B</div>
    </SupersetGroup>
  ),
};
