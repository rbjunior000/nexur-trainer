import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { AerobicSessionProvider } from './AerobicSessionContext';
import { AerobicPlaybackControls } from './AerobicPlaybackControls';
import { mockAerobicWorkout } from '../../stories/fixtures';

const meta = {
  title: 'Aerobic Session/AerobicPlaybackControls',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AerobicSessionProvider workout={mockAerobicWorkout} onFinish={fn()}>
        <div className="max-w-lg bg-white">
          <Story />
        </div>
      </AerobicSessionProvider>
    ),
  ],
  render: () => <AerobicPlaybackControls />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};

export const DistanceStep: Story = {
  decorators: [
    (Story) => {
      const distanceWorkout = {
        ...mockAerobicWorkout,
        blocks: [{ ...mockAerobicWorkout.blocks[2] }],
      };
      return (
        <AerobicSessionProvider workout={distanceWorkout} onFinish={fn()}>
          <div className="max-w-lg bg-white">
            <Story />
          </div>
        </AerobicSessionProvider>
      );
    },
  ],
};

export const PauseResume: Story = {
  play: async ({ canvas }) => {
    const pauseBtn = canvas.getByRole('button', { name: 'Pausar' });
    await userEvent.click(pauseBtn);
    await expect(canvas.getByRole('button', { name: 'Retomar' })).toBeInTheDocument();
  },
};
