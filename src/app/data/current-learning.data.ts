export interface CurrentLearning {
  headline: string;
  focus: string;
  note: string;
  nextTopicId?: string;
  nextTopicLabel: string;
}

/**
 * Update this whenever the active focus changes — the "Currently Learning"
 * section reads straight from here.
 */
export const currentLearning: CurrentLearning = {
  headline: 'Currently under the hood...',
  focus: 'HTTP, Routing, Serialization, Authentication & Authorization, and Validation & Transformation are live — studying Middleware next.',
  note: 'Five interactive labs have shipped. Onto the next concept.',
  nextTopicId: 'middleware',
  nextTopicLabel: 'Middleware',
};
