import { JugadorPartido, AccionOfensiva, AccionDefensiva } from './types';

// ... (mantén las funciones de fatiga y suerte igual) ...

export function obtenerMultiplicadorFatiga(energiaActual: number, energiaMaxima: number): number {
  const porcentaje = (energiaActual / energiaMaxima) * 100;
  const tramosPerdidos = Math.floor((100 - porcentaje) / 5);
  return 1 - (tramosPerdidos > 0 ? tramosPerdidos * 0.02 : 0); 
}

export function generarFactorSuerte(limitado: boolean): number {
  const max = limitado ? 1.00 : 1.10;
  return Math.round((Math.random() * (max - 0.90) + 0.90) * 100) / 100; 
}

// NUEVA FUNCIÓN: Factor Distancia
export function obtenerFactorDistancia(distancia: number): number {
  if (distancia <= 1) return 1;
  if (distancia === 2) return 0.95;
  if (distancia === 3) return 0.90;
  if (distancia === 4) return 0.80;
  if (distancia === 5) return 0.65;
  return 0.50; // 6 o más casillas
}

// ACTUALIZACIÓN: Recibe la distancia como parámetro opcional (por defecto 1)
export function calcularPoderDetalladoOfensivo(jugador: JugadorPartido, accion: AccionOfensiva, suerteLimitada: boolean, distancia: number = 1) {
  const fatiga = obtenerMultiplicadorFatiga(jugador.energiaActual, jugador.energiaMaxima);
  const suerte = generarFactorSuerte(suerteLimitada);
  const factorDistancia = obtenerFactorDistancia(distancia);
  const stats = jugador.stats;

  let base = 0;
  if (accion === 'Regate') base = (stats.regate * 0.70 + stats.velocidad * 0.30) * fatiga;
  if (accion === 'Pase') base = (stats.pase * 0.70 + stats.vision * 0.30) * fatiga;
  if (accion === 'Tiro') base = (stats.tiro * 0.85 + stats.vision * 0.15) * fatiga;

  // Se aplica la fórmula exacta: ((Base) * Suerte) * Distancia
  const poderTotal = Math.round((base * suerte) * factorDistancia);

  return { total: poderTotal, base: Math.round(base), suerte, factorDistancia };
}

export function calcularPoderDetalladoDefensivo(jugador: JugadorPartido, accion: AccionDefensiva, suerteLimitada: boolean) {
  const fatiga = obtenerMultiplicadorFatiga(jugador.energiaActual, jugador.energiaMaxima);
  const suerte = generarFactorSuerte(suerteLimitada);
  const stats = jugador.stats;

  let base = 0;
  if (accion === 'Entrada') base = (stats.defensa * 0.65 + stats.velocidad * 0.35) * fatiga;
  if (accion === 'Intercepcion') base = (stats.defensa * 0.60 + stats.vision * 0.40) * fatiga;
  if (accion === 'Bloqueo') base = (stats.defensa * 0.90 + stats.vision * 0.10) * fatiga;

  return { total: Math.round(base * suerte), base: Math.round(base), suerte, factorDistancia: 1 };
}