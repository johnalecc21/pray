import { colors } from '../../lib/theme';
import type { IdentityOption, InterestOption, MoodOption } from './types';

export const identityOptions: IdentityOption[] = [
  { label: 'Gay',              color: colors.pride.blue   },
  { label: 'Lesbiana',         color: colors.pride.pink   },
  { label: 'Bisexual',         color: colors.pride.purple },
  { label: 'Trans',            color: colors.pride.blue   },
  { label: 'No binario',       color: colors.pride.yellow },
  { label: 'Queer',            color: colors.pride.orange },
  { label: 'Pansexual',        color: colors.pride.pink   },
  { label: 'Prefiero no decir',color: '#5a5870'           },
];

export const pronounOptions = [
  { label: 'él/him'   },
  { label: 'ella/her' },
  { label: 'elle/them'},
  { label: 'Otro'     },
];

export const interestOptions: InterestOption[] = [
  { label: 'Gym',     icon: 'barbell-outline',          color: colors.pride.orange },
  { label: 'Viajes',  icon: 'airplane-outline',         color: colors.pride.blue   },
  { label: 'Música',  icon: 'musical-notes-outline',    color: colors.pride.purple },
  { label: 'Tech',    icon: 'code-slash-outline',       color: colors.pride.green  },
  { label: 'Café',    icon: 'cafe-outline',             color: colors.pride.orange },
  { label: 'Lectura', icon: 'book-outline',             color: colors.pride.blue   },
  { label: 'Arte',    icon: 'color-palette-outline',    color: colors.pride.pink   },
  { label: 'Romance', icon: 'heart-outline',            color: colors.pride.pink   },
];

export const moodOptions: MoodOption[] = [
  { label: 'Hot',         desc: 'Estoy en modo fuego 🔥',      color: colors.pride.orange, icon: 'flame'        },
  { label: 'Dating',      desc: 'Busco algo especial',         color: colors.pride.pink                        },
  { label: 'Amistad',     desc: 'Quiero conocer gente',        color: colors.pride.blue                        },
  { label: 'Fiesta',      desc: 'A salir y disfrutar',         color: colors.pride.orange                      },
  { label: 'Networking',  desc: 'Crecer profesionalmente',     color: colors.pride.green                       },
];

export const welcomeFeatures = [
  { label: 'Perfil verificado y seguro', color: colors.pride.green },
  { label: 'Matching por IA con tu vibe',color: colors.pride.blue  },
  { label: 'Comunidad real y activa',    color: colors.pride.pink  },
];
