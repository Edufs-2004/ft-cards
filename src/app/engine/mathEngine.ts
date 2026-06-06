import { JugadorPartido, AccionOfensiva, AccionDefensiva } from './types';

export function obtenerMultiplicadorFatiga(energiaActual: number, energiaMaxima: number): number {
  const porcentaje = (energiaActual / energiaMaxima) * 100;
  const tramosPerdidos = Math.floor((100 - porcentaje) / 5);
  const penalizacion = tramosPerdidos > 0 ? tramosPerdidos * 0.02 : 0;
  return 1 - penalizacion; 
}

export function generarFactorSuerte(limitado: boolean): number {
  const min = 0.90;
  const max = limitado ? 1.00 : 1.10;
  const suerte = Math.random() * (max - min) + min;
  return Math.round(suerte * 100) / 100; 
}

function statConFatiga(valorBase: number, fatiga: number): number {
  return valorBase * fatiga;
}

export function calcularPoderOfensivo(jugador: JugadorPartido, accion: AccionOfensiva, suerteLimitada: boolean): number {
  const fatiga = obtenerMultiplicadorFatiga(jugador.energiaActual, jugador.energiaMaxima);
  const suerte = generarFactorSuerte(suerteLimitada);
  const stats = jugador.stats;

  let poderBase = 0;
  if (accion === 'Regate') poderBase = statConFatiga(stats.regate, fatiga) * 0.70 + statConFatiga(stats.velocidad, fatiga) * 0.30;
  if (accion === 'Pase') poderBase = statConFatiga(stats.pase, fatiga) * 0.70 + statConFatiga(stats.vision, fatiga) * 0.30;
  if (accion === 'Tiro') poderBase = statConFatiga(stats.tiro, fatiga) * 0.85 + statConFatiga(stats.vision, fatiga) * 0.15;

  return Math.round(poderBase * suerte);
}

export function calcularPoderDefensivo(jugador: JugadorPartido, accion: AccionDefensiva, suerteLimitada: boolean): number {
  const fatiga = obtenerMultiplicadorFatiga(jugador.energiaActual, jugador.energiaMaxima);
  const suerte = generarFactorSuerte(suerteLimitada);
  const stats = jugador.stats;

  let poderBase = 0;
  if (accion === 'Entrada') poderBase = statConFatiga(stats.defensa, fatiga) * 0.65 + statConFatiga(stats.velocidad, fatiga) * 0.35;
  if (accion === 'Intercepcion') poderBase = statConFatiga(stats.defensa, fatiga) * 0.60 + statConFatiga(stats.vision, fatiga) * 0.40;
  if (accion === 'Bloqueo') poderBase = statConFatiga(stats.defensa, fatiga) * 0.90 + statConFatiga(stats.vision, fatiga) * 0.10;

  return Math.round(poderBase * suerte);
}