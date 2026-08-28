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
  focus: 'HTTP and Routing are live — studying Serialization next.',
  note: 'Two interactive labs have shipped. Onto the next concept.',
  nextTopicId: 'serialization',
  nextTopicLabel: 'Serialization & Deserialization',
};
