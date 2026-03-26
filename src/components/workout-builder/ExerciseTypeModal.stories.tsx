import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { ExerciseTypeModal } from './ExerciseTypeModal';

const meta = {
  title: 'Workout Builder/ExerciseTypeModal',
  component: ExerciseTypeModal,
  tags: ['autodocs'],
  args: {
    open: true,
    current: 'weight_reps',
    onSelect: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof ExerciseTypeModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WeightRepsSelected: Story = {};

export const DurationSelected: Story = {
  args: { current: 'duration' },
};

export const Closed: Story = {
  args: { open: false },
};

export const SelectDuration: Story = {
  play: async ({ canvas, args }) => {
    const durOption = canvas.getByText('Duração');
    await userEvent.click(durOption);
    await expect(args.onSelect).toHaveBeenCalledWith('duration');
  },
};
