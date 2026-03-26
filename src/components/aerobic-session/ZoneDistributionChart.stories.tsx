import type { Meta, StoryObj } from '@storybook/react-vite';
import { ZoneDistributionChart } from './ZoneDistributionChart';

const meta = {
  title: 'Aerobic Session/ZoneDistributionChart',
  component: ZoneDistributionChart,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-4 max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ZoneDistributionChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    zoneTime: {
      '1': 600,
      '2': 1200,
      '3': 900,
      '4': 300,
      '5': 120,
      '5a': 0,
      '5b': 0,
      '5c': 0,
    },
  },
};

export const HighIntensityFocus: Story = {
  args: {
    zoneTime: {
      '1': 300,
      '2': 300,
      '3': 600,
      '4': 1200,
      '5': 600,
      '5a': 300,
      '5b': 180,
      '5c': 60,
    },
  },
};

export const AllZeros: Story = {
  args: {
    zoneTime: {
      '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '5a': 0, '5b': 0, '5c': 0,
    },
  },
};
