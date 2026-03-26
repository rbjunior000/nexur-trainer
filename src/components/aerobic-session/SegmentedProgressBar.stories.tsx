import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AerobicSessionProvider } from './AerobicSessionContext';
import { SegmentedProgressBar } from './SegmentedProgressBar';
import { mockAerobicWorkout } from '../../stories/fixtures';

const meta = {
  title: 'Aerobic Session/SegmentedProgressBar',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AerobicSessionProvider workout={mockAerobicWorkout} onFinish={fn()}>
        <div className="p-4 max-w-lg bg-white">
          <Story />
        </div>
      </AerobicSessionProvider>
    ),
  ],
  render: () => <SegmentedProgressBar />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
