import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AerobicSessionProvider } from './AerobicSessionContext';
import { NextStepPreview } from './NextStepPreview';
import { mockAerobicWorkout } from '../../stories/fixtures';

const meta = {
  title: 'Aerobic Session/NextStepPreview',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AerobicSessionProvider workout={mockAerobicWorkout} onFinish={fn()}>
        <div className="p-4 bg-white">
          <Story />
        </div>
      </AerobicSessionProvider>
    ),
  ],
  render: () => <NextStepPreview />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Shows next step info when there is a next step. */
export const WithNextStep: Story = {};

/** Returns null on the last step. */
export const LastStep: Story = {
  decorators: [
    (Story) => {
      const oneStepWorkout = {
        ...mockAerobicWorkout,
        blocks: [{ ...mockAerobicWorkout.blocks[0], repetitions: 1, steps: [mockAerobicWorkout.blocks[0].steps[0]] }],
      };
      return (
        <AerobicSessionProvider workout={oneStepWorkout} onFinish={fn()}>
          <div className="p-4 bg-white">
            <p className="text-xs text-gray-400 italic">(nada renderizado — último step)</p>
            <Story />
          </div>
        </AerobicSessionProvider>
      );
    },
  ],
};
