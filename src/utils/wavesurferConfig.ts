export const createWavesurferConfig = (url: string, height: number = 120) => ({
  url,
  waveColor: '#4ade80',
  progressColor: '#059669',
  cursorColor: '#ffffff',
  barWidth: 2,
  barGap: 1,
  height,
  normalize: true,
  interact: true,
});

export const createTimelinePlugin = async () => {
  const Timeline = (await import('wavesurfer.js/dist/plugins/timeline.js')).default;
  return Timeline.create({
    height: 20,
    insertPosition: 'beforebegin',
    timeInterval: 0.2,
    primaryLabelInterval: 1,
    style: {
      fontSize: '10px',
      color: '#6b7280',
    }
  });
};

export const REGION_CONFIG = {
  color: 'rgba(16, 185, 129, 0.3)',
  drag: true,
  resize: true,
  resizeStart: true,
  resizeEnd: true,
  minLength: 0.1, // Minimum 0.1 seconds
  contentEditable: false,
} as const;