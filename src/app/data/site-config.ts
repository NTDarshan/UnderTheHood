export interface SiteConfig {
  name: string;
  role: string;
  tagline: string;
  profileImage: string;
  github: string;
  linkedin: string;
  instagram: string;
  email: string;
  phone: string;
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
  github: 'https://github.com/NTDarshan/UnderTheHood',
  linkedin: 'https://www.linkedin.com/in/ntdarshan/',
  instagram: 'https://www.instagram.com/darshan_n_t_d?stkn=MWt3c2kwb2VmNnN2YQ==',
  email: 'darshannt2034@gmail.com',
  phone: '+91 8088356678',
};
