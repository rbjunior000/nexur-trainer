import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { TrainingSessionProvider } from './TrainingSessionContext';
import { SessionHeader } from './SessionHeader';
import { mockExerciseList } from '../../stories/fixtures';

const meta = {
  title: 'Training Session/SessionHeader',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TrainingSessionProvider sourceExercises={mockExerciseList} workoutName="Treino A — Peito e Tríceps">
        <Story />
      </TrainingSessionProvider>
    ),
  ],
  render: () => <SessionHeader onClose={fn()} />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SwitchToCompact: Story = {
  play: async ({ canvas }) => {
    // Open view mode dropdown
    const dropdown = canvas.getByRole('button', { name: /selecionar modo/i });
    await userEvent.click(dropdown);
    const compactOption = canvas.getByText('Compacto');
    await userEvent.click(compactOption);
  },
};

export const CloseSession: Story = {
  render: () => {
    const onClose = fn();
    return <SessionHeader onClose={onClose} />;
  },
  play: async ({ canvas }) => {
    const closeBtn = canvas.getByRole('button', { name: /fechar|close/i });
    await userEvent.click(closeBtn);
  },
};
