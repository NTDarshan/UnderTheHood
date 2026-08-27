export type TopicStatus = 'coming-soon' | 'in-progress' | 'interactive';

export interface LearningTopic {
  id: string;
  title: string;
  description: string;
  status: TopicStatus;
  route?: string;
  /** Small preview identifier used to pick a mini diagram for teaser cards. */
  visualizationType?: string;
}

export interface RoadmapCategory {
  id: string;
  index: string;
  title: string;
  description: string;
  topics: LearningTopic[];
}
