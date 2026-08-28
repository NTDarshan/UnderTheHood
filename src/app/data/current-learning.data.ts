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
  focus: 'HTTP, Routing, Serialization, Authentication & Authorization, Validation & Transformation, and Controllers/Services/Repositories/Middleware are live — studying CRUD next.',
  note: 'Six interactive labs have shipped. Onto the next concept.',
  nextTopicId: 'crud',
  nextTopicLabel: 'CRUD',
};
