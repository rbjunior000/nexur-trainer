import type { Meta, StoryObj } from '@storybook/react-vite';
import { Clock, Dumbbell, BarChart3 } from 'lucide-react';
import { StatCard } from './StatCard';

const meta = {
  title: 'Shared/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900 max-w-xs rounded-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Duration: Story = {
  args: { label: 'Duração', value: '45:12', icon: <Clock size={16} /> },
};

export const Volume: Story = {
  args: { label: 'Volume', value: '4.250 kg', icon: <Dumbbell size={16} /> },
};

export const Sets: Story = {
  args: { label: 'Séries', value: '18', icon: <BarChart3 size={16} /> },
};

export const NoIcon: Story = {
  args: { label: 'Exercícios', value: '6' },
};

export const SummaryRow: Story = {
  args: { label: 'Duração', value: '45:12' },
  render: () => (
    <div className="grid grid-cols-3 gap-3 p-4 bg-gray-900 rounded-xl">
      <StatCard label="Duração" value="45:12" icon={<Clock size={16} />} />
      <StatCard label="Séries" value="18" icon={<BarChart3 size={16} />} />
      <StatCard label="Volume" value="4.250kg" icon={<Dumbbell size={16} />} />
    </div>
  ),
};
