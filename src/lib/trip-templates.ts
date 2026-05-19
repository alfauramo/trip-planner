export interface TripTemplate {
  title: string;
  description: string;
  duration: number;
  days: {
    title: string;
    activities: { name: string; event_type: string; start_time?: string; notes?: string }[];
  }[];
  icon: string;
  category: string;
}

export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    title: 'Finde en Barcelona',
    description: '3 días de Gaudí, tapas y playa',
    duration: 3,
    icon: '🏖️',
    category: 'Escapadas',
    days: [
      {
        title: 'Llegada y Barrio Gótico',
        activities: [
          { name: 'Check-in en el hotel', event_type: 'accommodation', start_time: '14:00' },
          {
            name: 'Paseo por el Barrio Gótico',
            event_type: 'activity',
            start_time: '16:00',
            notes: 'Empieza en Plaça Catalunya',
          },
          {
            name: 'Cena de tapas en El Born',
            event_type: 'restaurant',
            start_time: '20:30',
            notes: 'Recomendado: Cal Pep',
          },
        ],
      },
      {
        title: 'Gaudí y Modernismo',
        activities: [
          { name: 'Sagrada Familia', event_type: 'activity', start_time: '09:00', notes: 'Comprar entradas online' },
          { name: 'Park Güell', event_type: 'activity', start_time: '12:00' },
          { name: 'Comida en Gràcia', event_type: 'restaurant', start_time: '14:00' },
          { name: 'Paseo por Passeig de Gràcia', event_type: 'shopping', start_time: '17:00' },
        ],
      },
      {
        title: 'Playas y despedida',
        activities: [
          { name: 'Mañana en la Barceloneta', event_type: 'activity', start_time: '10:00' },
          { name: 'Paella frente al mar', event_type: 'restaurant', start_time: '13:00' },
        ],
      },
    ],
  },
  {
    title: 'Ruta por Tokio',
    description: '7 días entre templos, tecnología y ramen',
    duration: 7,
    icon: '🗼',
    category: 'Asia',
    days: [
      {
        title: 'Llegada y Shinjuku',
        activities: [
          { name: 'Check-in en Shinjuku', event_type: 'accommodation', start_time: '15:00' },
          {
            name: 'Callejuelas de Omoide Yokocho',
            event_type: 'restaurant',
            start_time: '19:00',
            notes: 'Prueba el ramen en cualquier puesto',
          },
          {
            name: 'Vistas desde el Tokyo Metropolitan Building',
            event_type: 'activity',
            start_time: '20:30',
            notes: 'Gratis y abierto hasta las 23:00',
          },
        ],
      },
      {
        title: 'Harajuku y Shibuya',
        activities: [
          { name: 'Templo Meiji Jingu', event_type: 'activity', start_time: '08:00' },
          { name: 'Takeshita Street (Harajuku)', event_type: 'shopping', start_time: '10:30' },
          { name: 'Cruce de Shibuya', event_type: 'activity', start_time: '15:00' },
          { name: 'Cena en izakaya', event_type: 'restaurant', start_time: '19:00' },
        ],
      },
      {
        title: 'Asakusa y Akihabara',
        activities: [
          { name: 'Templo Senso-ji', event_type: 'activity', start_time: '09:00' },
          { name: 'Calle Nakamise (souvenirs)', event_type: 'shopping', start_time: '10:30' },
          { name: 'Akihabara Electric Town', event_type: 'shopping', start_time: '14:00' },
          { name: 'Maid café o arcade', event_type: 'activity', start_time: '17:00' },
        ],
      },
      {
        title: 'Excursión a Nikko',
        activities: [
          { name: 'Tren a Nikko', event_type: 'transport', start_time: '07:30' },
          { name: 'Santuario Toshogu', event_type: 'activity', start_time: '10:00' },
          { name: 'Cascada Kegon', event_type: 'activity', start_time: '14:00' },
          { name: 'Regreso a Tokio', event_type: 'transport', start_time: '17:00' },
        ],
      },
      {
        title: 'Tsukiji y Roppongi',
        activities: [
          { name: 'Mercado exterior de Tsukiji', event_type: 'restaurant', start_time: '08:00' },
          { name: 'teamLab Borderless', event_type: 'activity', start_time: '11:00', notes: 'Reservar con antelación' },
          { name: 'Torre de Tokio', event_type: 'activity', start_time: '16:00' },
          { name: 'Cena en Roppongi', event_type: 'restaurant', start_time: '20:00' },
        ],
      },
      {
        title: 'Día libre',
        activities: [
          {
            name: 'Explora Shimokitazawa',
            event_type: 'shopping',
            start_time: '11:00',
            notes: 'Barrio bohemio con tiendas vintage',
          },
          { name: 'Onsen tradicional', event_type: 'activity', start_time: '15:00' },
        ],
      },
      {
        title: 'Despedida',
        activities: [
          { name: 'Últimas compras en Ginza', event_type: 'shopping', start_time: '10:00' },
          { name: 'Comida de despedida', event_type: 'restaurant', start_time: '13:00' },
        ],
      },
    ],
  },
  {
    title: 'Camino de Santiago',
    description: '5 días desde Sarria en la ruta francesa',
    duration: 5,
    icon: '🥾',
    category: 'Aventura',
    days: [
      {
        title: 'Sarria - Portomarín (22km)',
        activities: [
          {
            name: 'Salida desde Sarria',
            event_type: 'activity',
            start_time: '07:00',
            notes: 'Sellar la credencial en la iglesia de Santa Mariña',
          },
          { name: 'Parada en Barbadelo', event_type: 'activity', start_time: '10:00' },
          { name: 'Llegada a Portomarín', event_type: 'accommodation', start_time: '15:00' },
          { name: 'Cena del peregrino', event_type: 'restaurant', start_time: '20:00' },
        ],
      },
      {
        title: 'Portomarín - Palas de Rei (25km)',
        activities: [
          { name: 'Salida temprano', event_type: 'activity', start_time: '06:30' },
          {
            name: 'Alto de Ligonde',
            event_type: 'activity',
            start_time: '12:00',
            notes: 'Uno de los puntos más altos de esta etapa',
          },
          { name: 'Albergue en Palas de Rei', event_type: 'accommodation', start_time: '16:00' },
          { name: 'Descanso y cena', event_type: 'restaurant', start_time: '20:00' },
        ],
      },
      {
        title: 'Palas de Rei - Arzúa (29km)',
        activities: [
          { name: 'Salida al amanecer', event_type: 'activity', start_time: '06:00' },
          {
            name: 'Melide y su pulpo',
            event_type: 'restaurant',
            start_time: '12:30',
            notes: 'Parada obligatoria en Melide para probar el pulpo a feira',
          },
          { name: 'Llegada a Arzúa', event_type: 'accommodation', start_time: '17:00' },
        ],
      },
      {
        title: 'Arzúa - Pedrouzo (19km)',
        activities: [
          { name: 'Etapa más corta y boscosa', event_type: 'activity', start_time: '08:00' },
          { name: 'Bosques de eucaliptos', event_type: 'activity', start_time: '11:00' },
          { name: 'Albergue en O Pedrouzo', event_type: 'accommodation', start_time: '15:00' },
        ],
      },
      {
        title: 'Pedrouzo - Santiago (20km)',
        activities: [
          { name: 'Última etapa al amanecer', event_type: 'activity', start_time: '06:00' },
          {
            name: 'Monte do Gozo',
            event_type: 'activity',
            start_time: '09:00',
            notes: 'Primera vista de las torres de la Catedral',
          },
          { name: 'Llegada a la Catedral', event_type: 'activity', start_time: '12:00' },
          { name: 'Misa del peregrino', event_type: 'activity', start_time: '12:00' },
          { name: 'Cena de celebración', event_type: 'restaurant', start_time: '21:00' },
        ],
      },
    ],
  },
  {
    title: 'Roma en 4 días',
    description: 'Arte, historia y la mejor pasta',
    duration: 4,
    icon: '🏛️',
    category: 'Cultura',
    days: [
      {
        title: 'Roma Antigua',
        activities: [
          {
            name: 'Coliseo',
            event_type: 'activity',
            start_time: '09:00',
            notes: 'Entrada combinada con Foro y Palatino',
          },
          { name: 'Foro Romano y Palatino', event_type: 'activity', start_time: '11:30' },
          { name: 'Comida en Trastevere', event_type: 'restaurant', start_time: '14:00' },
          { name: 'Piazza Venezia y Campidoglio', event_type: 'activity', start_time: '16:00' },
        ],
      },
      {
        title: 'Vaticano y centro',
        activities: [
          {
            name: 'Museos Vaticanos y Capilla Sixtina',
            event_type: 'activity',
            start_time: '08:00',
            notes: 'Reservar con semanas de antelación',
          },
          { name: 'Basílica de San Pedro', event_type: 'activity', start_time: '12:00' },
          { name: 'Pizza en Prati', event_type: 'restaurant', start_time: '14:00' },
          { name: "Castel Sant'Angelo", event_type: 'activity', start_time: '16:00' },
        ],
      },
      {
        title: 'Barroco y plazas',
        activities: [
          {
            name: 'Fontana di Trevi',
            event_type: 'activity',
            start_time: '08:00',
            notes: 'Ir temprano para evitar multitudes',
          },
          { name: 'Piazza di Spagna', event_type: 'activity', start_time: '09:30' },
          { name: 'Panteón', event_type: 'activity', start_time: '11:00' },
          { name: 'Piazza Navona', event_type: 'activity', start_time: '13:00' },
          {
            name: 'Gelato en Giolitti',
            event_type: 'restaurant',
            start_time: '15:00',
            notes: 'La mejor heladería de Roma',
          },
        ],
      },
      {
        title: 'Catacumbas y despedida',
        activities: [
          { name: 'Catacumbas de San Calixto', event_type: 'activity', start_time: '09:00' },
          { name: 'Vía Apia en bici', event_type: 'activity', start_time: '11:00' },
          {
            name: 'Última cena romana',
            event_type: 'restaurant',
            start_time: '20:00',
            notes: 'Carbonara auténtica en Da Enzo',
          },
        ],
      },
    ],
  },
  {
    title: 'Nueva York Express',
    description: '5 días intensos en la Gran Manzana',
    duration: 5,
    icon: '🗽',
    category: 'Ciudades',
    days: [
      {
        title: 'Midtown Manhattan',
        activities: [
          { name: 'Times Square', event_type: 'activity', start_time: '09:00' },
          {
            name: 'Top of the Rock',
            event_type: 'activity',
            start_time: '10:30',
            notes: 'Mejores vistas que el Empire State',
          },
          { name: 'MoMA', event_type: 'activity', start_time: '14:00' },
          { name: "Cena en Hell's Kitchen", event_type: 'restaurant', start_time: '19:00' },
        ],
      },
      {
        title: 'Downtown y puentes',
        activities: [
          { name: 'Estatua de la Libertad (ferry)', event_type: 'transport', start_time: '08:00' },
          { name: 'Wall Street y Charging Bull', event_type: 'activity', start_time: '12:00' },
          { name: 'Puente de Brooklyn', event_type: 'activity', start_time: '14:00' },
          { name: 'DUMBO y pizza en Brooklyn', event_type: 'restaurant', start_time: '16:30' },
        ],
      },
      {
        title: 'Central Park y museos',
        activities: [
          { name: 'Central Park en bici', event_type: 'activity', start_time: '09:00' },
          { name: 'Metropolitan Museum of Art', event_type: 'activity', start_time: '12:00' },
          { name: 'Upper East Side', event_type: 'activity', start_time: '16:00' },
          {
            name: 'Shows de Broadway',
            event_type: 'activity',
            start_time: '19:00',
            notes: 'Comprar entradas en TKTS con descuento',
          },
        ],
      },
      {
        title: 'Barrios con personalidad',
        activities: [
          { name: 'High Line', event_type: 'activity', start_time: '09:00' },
          { name: 'Chelsea Market', event_type: 'restaurant', start_time: '11:00' },
          { name: 'Greenwich Village', event_type: 'activity', start_time: '13:00' },
          { name: 'SoHo (compras)', event_type: 'shopping', start_time: '15:00' },
          { name: 'Cena en Chinatown', event_type: 'restaurant', start_time: '19:00' },
        ],
      },
      {
        title: 'Despedida y vistas',
        activities: [
          { name: 'Brunch neoyorquino', event_type: 'restaurant', start_time: '11:00' },
          { name: 'One World Observatory', event_type: 'activity', start_time: '14:00' },
          { name: 'Últimas compras en 5th Avenue', event_type: 'shopping', start_time: '16:00' },
          { name: 'Cóctel en rooftop', event_type: 'restaurant', start_time: '20:00' },
        ],
      },
    ],
  },
  {
    title: 'Paraíso en Bali',
    description: '7 días de templos, arrozales y surf',
    duration: 7,
    icon: '🌴',
    category: 'Playa',
    days: [
      {
        title: 'Llegada a Ubud',
        activities: [
          { name: 'Check-in en Ubud', event_type: 'accommodation', start_time: '14:00' },
          { name: 'Paseo por los arrozales de Tegalalang', event_type: 'activity', start_time: '16:00' },
          { name: 'Cena en un warung local', event_type: 'restaurant', start_time: '19:00' },
        ],
      },
      {
        title: 'Templos y cultura',
        activities: [
          {
            name: 'Templo Tirta Empul',
            event_type: 'activity',
            start_time: '08:00',
            notes: 'Llevar sarong para el ritual de purificación',
          },
          { name: 'Templo Gunung Kawi', event_type: 'activity', start_time: '10:30' },
          { name: 'Comida orgánica en Ubud', event_type: 'restaurant', start_time: '13:00' },
          { name: 'Monkey Forest', event_type: 'activity', start_time: '15:00' },
        ],
      },
      {
        title: 'Norte de Bali',
        activities: [
          {
            name: 'Amanecer en el Monte Batur (trekking)',
            event_type: 'activity',
            start_time: '02:00',
            notes: 'Guía obligatorio, salida de madrugada',
          },
          { name: 'Aguas termales de Toya Devasya', event_type: 'activity', start_time: '08:00' },
          { name: 'Cascada Sekumpul', event_type: 'activity', start_time: '12:00' },
          { name: 'Regreso a Ubud', event_type: 'transport', start_time: '17:00' },
        ],
      },
      {
        title: 'Traslado a la costa',
        activities: [
          { name: 'Clase de cocina balinesa', event_type: 'activity', start_time: '09:00' },
          { name: 'Traslado a Canggu', event_type: 'transport', start_time: '13:00' },
          { name: 'Atardecer en la playa de Canggu', event_type: 'activity', start_time: '17:30' },
          { name: 'Cena frente al mar', event_type: 'restaurant', start_time: '19:30' },
        ],
      },
      {
        title: 'Surf y playas',
        activities: [
          { name: 'Clase de surf en Batu Bolong', event_type: 'activity', start_time: '08:00' },
          { name: 'Brunch en café healthy', event_type: 'restaurant', start_time: '11:00' },
          { name: 'Templo Tanah Lot al atardecer', event_type: 'activity', start_time: '17:00' },
          { name: 'Marisco en Jimbaran', event_type: 'restaurant', start_time: '19:30' },
        ],
      },
      {
        title: 'Islas Nusa',
        activities: [
          { name: 'Ferry a Nusa Penida', event_type: 'transport', start_time: '07:00' },
          { name: 'Kelingking Beach', event_type: 'activity', start_time: '10:00' },
          { name: "Angel's Billabong y Broken Beach", event_type: 'activity', start_time: '13:00' },
          { name: 'Snorkel con mantarrayas', event_type: 'activity', start_time: '15:00' },
        ],
      },
      {
        title: 'Relax y despedida',
        activities: [
          { name: 'Spa balinés', event_type: 'activity', start_time: '10:00' },
          { name: 'Última comida con vistas', event_type: 'restaurant', start_time: '13:00' },
          { name: 'Mercado de Seminyak', event_type: 'shopping', start_time: '16:00' },
        ],
      },
    ],
  },
  {
    title: 'Escapada a Granada',
    description: '2 días de Alhambra, tapas gratis y Albaicín',
    duration: 2,
    icon: '🕌',
    category: 'Escapadas',
    days: [
      {
        title: 'Alhambra y Sacromonte',
        activities: [
          {
            name: 'Alhambra y Generalife',
            event_type: 'activity',
            start_time: '08:30',
            notes: 'Reservar con meses de antelación',
          },
          {
            name: 'Comida con tapas gratis',
            event_type: 'restaurant',
            start_time: '13:30',
            notes: 'Calle Navas o Elvira: cada bebida incluye tapa',
          },
          { name: 'Paseo por el Albaicín', event_type: 'activity', start_time: '16:00' },
          { name: 'Atardecer en el Mirador de San Nicolás', event_type: 'activity', start_time: '20:00' },
          { name: 'Flamenco en Sacromonte', event_type: 'activity', start_time: '22:00' },
        ],
      },
      {
        title: 'Centro y despedida',
        activities: [
          { name: 'Capilla Real y Catedral', event_type: 'activity', start_time: '10:00' },
          { name: 'Baños árabes', event_type: 'activity', start_time: '12:00' },
          { name: 'Última ruta de tapas', event_type: 'restaurant', start_time: '14:00' },
          { name: 'Mercado de la Alcaicería', event_type: 'shopping', start_time: '17:00' },
        ],
      },
    ],
  },
  {
    title: 'Aventura en Costa Rica',
    description: '6 días de naturaleza, volcanes y playa caribeña',
    duration: 6,
    icon: '🌋',
    category: 'Aventura',
    days: [
      {
        title: 'Llegada a San José',
        activities: [
          { name: 'Check-in en San José', event_type: 'accommodation', start_time: '15:00' },
          { name: 'Mercado Central', event_type: 'shopping', start_time: '17:00' },
          { name: 'Cena típica tica', event_type: 'restaurant', start_time: '19:30' },
        ],
      },
      {
        title: 'Volcán Arenal',
        activities: [
          { name: 'Traslado a La Fortuna', event_type: 'transport', start_time: '07:00' },
          { name: 'Parque Nacional Volcán Arenal', event_type: 'activity', start_time: '11:00' },
          {
            name: 'Aguas termales naturales',
            event_type: 'activity',
            start_time: '15:00',
            notes: 'Gratis en el río Tabacón',
          },
          { name: 'Cena con vistas al volcán', event_type: 'restaurant', start_time: '19:00' },
        ],
      },
      {
        title: 'Aventura en La Fortuna',
        activities: [
          { name: 'Puentes colgantes de Místico', event_type: 'activity', start_time: '08:00' },
          { name: 'Catarata de La Fortuna', event_type: 'activity', start_time: '11:00' },
          { name: 'Comida en soda local', event_type: 'restaurant', start_time: '13:30' },
          { name: 'Rafting en el río Balsa', event_type: 'activity', start_time: '15:00' },
        ],
      },
      {
        title: 'Monteverde',
        activities: [
          { name: 'Traslado a Monteverde', event_type: 'transport', start_time: '08:00' },
          { name: 'Reserva del Bosque Nuboso', event_type: 'activity', start_time: '12:00' },
          { name: 'Tour nocturno de vida salvaje', event_type: 'activity', start_time: '18:00' },
        ],
      },
      {
        title: 'Costa Caribe',
        activities: [
          { name: 'Traslado a Puerto Viejo', event_type: 'transport', start_time: '06:00' },
          { name: 'Playa Cocles', event_type: 'activity', start_time: '13:00' },
          { name: 'Snorkel en arrecife', event_type: 'activity', start_time: '15:00' },
          { name: 'Cena caribeña con ritmo reggae', event_type: 'restaurant', start_time: '19:00' },
        ],
      },
      {
        title: 'Parque Nacional Cahuita',
        activities: [
          {
            name: 'Senderismo en Cahuita',
            event_type: 'activity',
            start_time: '08:00',
            notes: 'Monos aulladores, perezosos y playas vírgenes',
          },
          { name: 'Almuerzo frente al mar', event_type: 'restaurant', start_time: '13:00' },
          { name: 'Tarde libre en playa', event_type: 'activity', start_time: '15:00' },
          { name: 'Cena de despedida', event_type: 'restaurant', start_time: '20:00' },
        ],
      },
    ],
  },
];
