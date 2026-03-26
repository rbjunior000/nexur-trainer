import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { AerobicSessionPage } from './AerobicSessionPage';
import type { AerobicWorkout } from '../../types/aerobic';

const mockWorkout: AerobicWorkout = {
  workoutName: 'Corrida Intervalada',
  workoutStartDate: '',
  workoutEndDate: '',
  workoutDescription: '',
  sport: 'running',
  blocks: [
    {
      id: 'b1',
      name: 'Aquecimento',
      repetitions: 1,
      totalDuration: '00:10:00',
      steps: [
        { id: 's1', name: 'Trote leve', durationType: 'TIME', duration: '00:10:00', intensity: '1', level: 1 },
      ],
    },
    {
      id: 'b2',
      name: 'Intervalados',
      repetitions: 3,
      totalDuration: '00:04:00',
      steps: [
        { id: 's2', name: 'Sprint', durationType: 'TIME', duration: '00:01:00', intensity: '5', level: 1 },
        { id: 's3', name: 'Recuperação', durationType: 'TIME', duration: '00:03:00', intensity: '2', level: 1 },
      ],
    },
    {
      id: 'b3',
      name: 'Desaquecimento',
      repetitions: 1,
      totalDuration: '00:05:00',
      steps: [
        { id: 's4', name: 'Caminhada', durationType: 'DISTANCE', duration: '500', intensity: '1', level: 1 },
      ],
    },
  ],
};

const meta = {
  title: 'Aerobic Session/AerobicSessionPage',
  component: AerobicSessionPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    workout: mockWorkout,
    onBack: fn(),
    onFinish: fn(),
  },
} satisfies Meta<typeof AerobicSessionPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SkipToNextStep: Story = {
  play: async ({ canvas }) => {
    // Click skip forward
    const skipBtn = canvas.getAllByRole('button').find((b) =>
      b.querySelector('svg[data-lucide="skip-forward"]') !== null ||
      b.innerHTML.includes('SkipForward')
    );
    if (skipBtn) await userEvent.click(skipBtn);
  },
};

export const PauseResume: Story = {
  play: async ({ canvas }) => {
    // The large center button is play/pause
    const buttons = canvas.getAllByRole('button');
    // The play/pause button is the large 64px one — find it by finding the button with w-16
    const pauseBtn = buttons.find((b) => b.className.includes('w-16'));
    if (pauseBtn) {
      await userEvent.click(pauseBtn); // pause
      await userEvent.click(pauseBtn); // resume
    }
  },
};

export const StopAndSummary: Story = {
  play: async ({ canvas }) => {
    const stopBtn = canvas.getByText('Parar');
    await userEvent.click(stopBtn);
    await expect(canvas.getByText('Treino concluído!')).toBeInTheDocument();
  },
};
