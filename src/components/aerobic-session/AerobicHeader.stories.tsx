import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { AerobicSessionProvider } from './AerobicSessionContext';
import { AerobicHeader } from './AerobicHeader';
import { mockAerobicWorkout } from '../../stories/fixtures';

const meta = {
  title: 'Aerobic Session/AerobicHeader',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AerobicSessionProvider workout={mockAerobicWorkout} onFinish={fn()}>
        <Story />
      </AerobicSessionProvider>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <AerobicHeader onBack={fn()} />,
};

export const BackButton: Story = {
  render: () => {
    const onBack = fn();
    return <AerobicHeader onBack={onBack} />;
  },
  play: async ({ canvas }) => {
    const back = canvas.getByRole('button', { name: 'Voltar' });
    await userEvent.click(back);
  },
};

export const StopButton: Story = {
  render: () => <AerobicHeader onBack={fn()} />,
  play: async ({ canvas }) => {
    const stop = canvas.getByText('Parar');
    await userEvent.click(stop);
  },
};
