import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountdownDisplay } from './CountdownDisplay';

const meta = {
  title: 'Training Session/CountdownDisplay',
  component: CountdownDisplay,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-gray-900 min-h-64 rounded-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CountdownDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rest90s: Story = {
  args: { value: 90, label: 'Descanso' },
};

export const WithNextStep: Story = {
  args: {
    value: 45,
    label: 'Descanso',
    nextStepLabel: 'Supino — 4×8',
  },
};

export const DurationPhase: Story = {
  args: { value: 30, label: 'Duração', nextStepLabel: 'Rosca direta' },
};

export const Expiring: Story = {
  args: { value: 5, label: 'Descanso' },
};
