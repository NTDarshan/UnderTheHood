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
  focus: 'Backend Engineering from first principles',
  note: 'Building the first interactive experiences soon.',
  nextTopicLabel: 'First concepts',
};
