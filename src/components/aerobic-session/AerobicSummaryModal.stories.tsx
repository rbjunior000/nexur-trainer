import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { AerobicSessionProvider } from './AerobicSessionContext';
import { AerobicSummaryModal } from './AerobicSummaryModal';
import { mockAerobicWorkout } from '../../stories/fixtures';

const meta = {
  title: 'Aerobic Session/AerobicSummaryModal',
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

/** Modal only shows when showSummary=true — trigger by clicking Stop. */
export const TriggeredByStop: Story = {
  render: () => {
    return (
      <div>
        {/* We need to trigger stop via the playback controls or directly */}
        <AerobicSummaryModal />
        <p className="p-4 text-sm text-gray-400">
          (O modal só aparece após o treino terminar — use AerobicSessionPage para ver completo)
        </p>
      </div>
    );
  },
};

export const AfterStop: Story = {
  render: () => (
    <>
      <button
        id="stop-trigger"
        className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-red-500 text-white text-sm rounded"
        onClick={() => {
          // dispatch stop via context — shown via AerobicSessionPage story
        }}
      >
        (use AerobicSessionPage &gt; StopAndSummary)
      </button>
      <AerobicSummaryModal />
    </>
  ),
};
