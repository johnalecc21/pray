import { colors } from '../../lib/theme';
import type { Story, QuickAccessItem, FeedPost, FeedTab } from './types';

export const stories: Story[] = [
  { id: 'me',    name: 'Tu historia', isMe: true },
  { id: 's1',    name: 'Lucas',   color: colors.pride.pink },
  { id: 's2',    name: 'Nico',    color: colors.pride.blue },
  { id: 's3',    name: 'Ariel',   color: colors.pride.red },
  { id: 's4',    name: 'Sam',     color: colors.pride.green },
  { id: 's5',    name: 'Diego',   color: colors.pride.purple },
];

export const quickAccess: QuickAccessItem[] = [
  { id: 'events',      label: 'Eventos',     iconName: 'calendar-outline',   color: colors.pride.orange, bgColor: `${colors.pride.orange}25` },
  { id: 'communities', label: 'Comunidades', iconName: 'people-outline',     color: colors.pride.green,  bgColor: `${colors.pride.green}25`  },
  { id: 'rooms',       label: 'Salas Vivo',  iconName: 'mic-outline',        color: colors.pride.blue,   bgColor: `${colors.pride.blue}25`   },
  { id: 'discover',    label: 'Descubre',    iconName: 'trending-up-outline', color: colors.pride.pink,  bgColor: `${colors.pride.pink}25`   },
];

export const feedPosts: Record<FeedTab, FeedPost[]> = {
  'Para ti': [
    {
      id: 'pt-1',
      user: 'Lucas B.', handle: '@lucasb', time: '2m',
      content: 'Alguien para brunch en Chapinero este domingo? Soy nuevo en Bogota y quiero conocer gente',
      likes: 24, comments: 8,
      mood: 'Networking', moodColor: colors.pride.green,
      gradient: [colors.pride.purple, colors.pride.pink],
    },
    {
      id: 'pt-2',
      user: 'Ariel M.', handle: '@arielm', time: '15m',
      content: 'La sala de audio "After office LGBT+" empieza en 20 min. Temas: trabajo, burnout y autocuidado.',
      likes: 61, comments: 14,
      mood: 'Chill', moodColor: colors.pride.blue,
      gradient: [colors.pride.red, colors.pride.yellow],
      isLive: true,
    },
    {
      id: 'pt-3',
      user: 'Pride Bogota', handle: '@pridebog', time: '1h',
      content: 'Ya confirmaron asistencia? El recorrido sale del Parque de los Hippies a las 10am.',
      likes: 142, comments: 37,
      mood: 'Fiesta', moodColor: colors.pride.orange,
      gradient: [colors.pride.blue, colors.pride.green],
      eventCard: { title: 'Pride Bogota 2025', when: 'Dom 1 Jun · 10am', going: 4200 },
    },
  ],
  'Siguiendo': [
    {
      id: 'sig-1',
      user: 'Sam G.', handle: '@samg', time: '5m',
      content: 'Acabo de unirme a la comunidad de Lesbianas en Tech. Estan increibles las conversaciones ahi!',
      likes: 18, comments: 5,
      mood: 'Chill', moodColor: colors.pride.blue,
      gradient: [colors.pride.green, colors.pride.blue],
      communityCard: { name: 'Lesbianas en Tech', members: 3200, tag: 'Tecnologia' },
    },
    {
      id: 'sig-2',
      user: 'Nico R.', handle: '@nicor', time: '30m',
      content: 'Gracias a todos los que me apoyaron en la sala de ayer. Esta comunidad es lo mejor que me ha pasado.',
      likes: 89, comments: 22,
      mood: 'Gracias', moodColor: colors.pride.yellow,
      gradient: [colors.pride.red, colors.pride.pink],
    },
  ],
  'Comunidades': [
    {
      id: 'com-1',
      user: 'Bears BCN', handle: '@bearsbcn', time: '1h',
      content: 'Evento mensual de la comunidad! Registro abierto. Cupos limitados, el aforo es de 80 personas.',
      likes: 55, comments: 11,
      mood: 'Evento', moodColor: colors.pride.orange,
      gradient: [colors.pride.red, colors.pride.purple],
      eventCard: { title: 'Bears Meetup Julio', when: 'Sab 12 Jul · 8pm', going: 47 },
    },
    {
      id: 'com-2',
      user: 'Trans Latam', handle: '@translatam', time: '3h',
      content: 'Nuevo recurso de apoyo legal disponible en nuestra comunidad. Todos los miembros tienen acceso.',
      likes: 203, comments: 44,
      mood: 'Apoyo', moodColor: colors.pride.green,
      gradient: [colors.pride.green, colors.pride.blue],
    },
  ],
};
