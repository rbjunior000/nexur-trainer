import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrainingRestCard } from './TrainingRestCard';

const restExercise = {
  id: 'rest-1',
  name: 'Descanso',
  media1: null,
  media2: null,
  type: 'rest',
  sets: [],
  notes: '',
  isRest: true,
  restDuration: 90,
};

const meta = {
  title: 'Training Session/TrainingRestCard',
  component: TrainingRestCard,
  tags: ['autodocs'],
  args: {
    exercise: restExercise,
    isActive: false,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-950 max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TrainingRestCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {};

export const Active: Story = {
  args: { isActive: true },
};

export const ActiveWithCountdown: Story = {
  args: { isActive: true, countdown: 45 },
};

export const CountdownExpiring: Story = {
  args: { isActive: true, countdown: 5 },
};
