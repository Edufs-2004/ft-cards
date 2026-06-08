export type AccionOfensiva = 'Regate' | 'Pase' | 'Tiro';
export type AccionDefensiva = 'Entrada' | 'Intercepcion' | 'Bloqueo';

export type PosicionCarta = 'Portero' | 'Defensa' | 'Mediocampo' | 'Delantero';
export type RarezaCarta = 'Normal' | 'Raro' | 'Epico' | 'Legendario' | 'Top Mundial';

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

// NUEVO: La carta base ahora soporta toda la info de tu Excel
export interface CartaBase {
  id: string;
  nombre: string;
  edicion: string;
  posicion: PosicionCarta;
  rareza: RarezaCarta;
  stats: Stats;
  energiaMaxima: number;
}

export interface JugadorPartido extends CartaBase {
  equipo: 'Local' | 'Visitante';
  energiaActual: number;
  posicion: Posicion;
}

export interface DetallesCalculo {
  baseAtacante: number; suerteAtacante: number; factorDistancia: number;
  baseDefensor: number; suerteDefensor: number;
}

export interface ResultadoDuelo {
  ganador: 'Atacante' | 'Defensor';
  poderAtacante: number;
  poderDefensor: number;
  resolucion: string;
  detalles: DetallesCalculo;
}