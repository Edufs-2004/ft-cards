export type AccionOfensiva = 'Regate' | 'Pase' | 'Tiro';
export type AccionDefensiva = 'Entrada' | 'Intercepcion' | 'Bloqueo';

export interface Stats {
  tiro: number;
  regate: number;
  vision: number;
  pase: number;
  defensa: number;
  velocidad: number;
}

export interface Posicion {
  x: number;
  y: number;
}

// Lo que viene del JSON
export interface CartaBase {
  id: string;
  nombre: string;
  stats: Stats;
  energiaMaxima: number;
}

// Lo que vive solo en el partido
export interface JugadorPartido extends CartaBase {
  equipo: 'Local' | 'Visitante';
  energiaActual: number;
  posicion: Posicion;
}

export interface ResultadoDuelo {
  ganador: 'Atacante' | 'Defensor';
  poderAtacante: number;
  poderDefensor: number;
  resolucion: string;
}