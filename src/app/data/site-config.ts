export interface SiteConfig {
  name: string;
  role: string;
  tagline: string;
  profileImage: string;
  github: string;
  linkedin: string;
}

/**
 * Central place for personal/site identity. Leave social URLs empty
 * until the real destinations exist — never invent placeholders.
 */
export const siteConfig: SiteConfig = {
  name: 'Darshu',
  role: 'Full-Stack Developer → Backend & AI Engineering',
  tagline: 'See how software really works.',
  profileImage: '/profile-photo.jpg',
  github: '',
  linkedin: '',
};
