// Ordered station names per line (same order as stations.ts)
// Server-side only — used by train tracker to calculate positions

export const LINE_STATIONS: Record<string, string[]> = {
  LineaA: [
    'Plaza de Mayo', 'Peru', 'Piedras', 'Lima', 'Saenz Pena', 'Congreso',
    'Pasco', 'Alberti', 'Plaza Miserere', 'Loria', 'Castro Barros',
    'Rio de Janeiro', 'Acoyte', 'Primera Junta', 'Puan', 'Carabobo',
    'San Jose de Flores', 'San Pedrito',
  ],
  LineaB: [
    'Leandro N. Alem', 'Florida', 'Carlos Pellegrini', 'Uruguay', 'Callao',
    'Pasteur', 'Pueyrredon', 'Carlos Gardel', 'Medrano', 'Angel Gallardo',
    'Malabia', 'Dorrego', 'Federico Lacroze', 'Tronador', 'De Los Incas',
    'Echeverria', 'Juan Manuel de Rosas',
  ],
  LineaC: [
    'Retiro', 'San Martin', 'Lavalle', 'Diagonal Norte', 'Av. de Mayo',
    'Moreno', 'Independencia', 'San Juan', 'Constitucion',
  ],
  LineaD: [
    'Catedral', '9 de Julio', 'Tribunales', 'Callao', 'Facultad de Medicina',
    'Pueyrredon', 'Aguero', 'Bulnes', 'Scalabrini Ortiz', 'Plaza Italia',
    'Palermo', 'Ministro Carranza', 'Olleros', 'Jose Hernandez', 'Juramento',
    'Congreso de Tucuman',
  ],
  LineaE: [
    'Retiro', 'Catalinas', 'Correo Central', 'Bolivar', 'Belgrano',
    'Independencia', 'San Jose', 'Entre Rios', 'Pichincha', 'Jujuy',
    'Urquiza', 'Boedo', 'Av. La Plata', 'Jose Maria Moreno', 'Emilio Mitre',
    'Medalla Milagrosa', 'Varela', 'Plaza de los Virreyes',
  ],
  LineaH: [
    'Facultad de Derecho', 'Las Heras', 'Santa Fe', 'Cordoba', 'Corrientes',
    'Once', 'Venezuela', 'Humberto 1', 'Inclan', 'Caseros',
    'Parque Patricios', 'Hospitales',
  ],
};
