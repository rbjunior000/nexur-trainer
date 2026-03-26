import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AerobicSessionProvider } from './AerobicSessionContext';
import { StepTimerDisplay } from './StepTimerDisplay';
import { mockAerobicWorkout } from '../../stories/fixtures';

const meta = {
  title: 'Aerobic Session/StepTimerDisplay',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AerobicSessionProvider workout={mockAerobicWorkout} onFinish={fn()}>
        <div className="p-8 bg-white flex justify-center">
          <Story />
        </div>
      </AerobicSessionProvider>
    ),
  ],
  render: () => <StepTimerDisplay />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** TIME step — shows countdown. */
export const TimeStep: Story = {};

/** DISTANCE step — shows elapsed + distance target. */
export const DistanceStep: Story = {
  decorators: [
    (Story) => {
      const distanceWorkout = {
        ...mockAerobicWorkout,
        blocks: [
          {
            ...mockAerobicWorkout.blocks[2],
            steps: [mockAerobicWorkout.blocks[2].steps[0]],
          },
        ],
      };
      return (
        <AerobicSessionProvider workout={distanceWorkout} onFinish={fn()}>
          <div className="p-8 bg-white flex justify-center">
            <Story />
          </div>
        </AerobicSessionProvider>
      );
    },
  ],
};
