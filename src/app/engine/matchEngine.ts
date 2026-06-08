import { JugadorPartido, AccionOfensiva, AccionDefensiva, ResultadoDuelo } from './types';
import { calcularPoderDetalladoOfensivo, calcularPoderDetalladoDefensivo } from './mathEngine';

// ... (evaluarVentajaTactica y resolverVictoriaDefensiva se mantienen iguales) ...

function evaluarVentajaTactica(accOfe: AccionOfensiva, accDef: AccionDefensiva) {
  return {
    atacanteLimitado: (accDef === 'Entrada' && accOfe === 'Regate') || (accDef === 'Intercepcion' && accOfe === 'Pase') || (accDef === 'Bloqueo' && accOfe === 'Tiro'),
    defensorLimitado: (accOfe === 'Pase' && accDef === 'Entrada') || (accOfe === 'Tiro' && accDef === 'Intercepcion') || (accOfe === 'Regate' && accDef === 'Bloqueo')
  };
}

function resolverVictoriaDefensiva(accOfe: AccionOfensiva, accDef: AccionDefensiva): string {
  const dado = Math.random() * 100;
  if (accOfe === 'Regate' && accDef === 'Entrada') return dado <= 95 ? 'Robo de balón' : 'Rebote';
  if (accOfe === 'Pase' && accDef === 'Entrada') return dado <= 40 ? 'Robo de balón' : 'Rebote';
  if (accOfe === 'Tiro' && accDef === 'Entrada') return dado <= 10 ? 'Robo de balón' : 'Rebote';
  if (accOfe === 'Regate' && accDef === 'Intercepcion') return dado <= 25 ? 'Robo de balón' : 'Rebote';
  if (accOfe === 'Pase' && accDef === 'Intercepcion') return dado <= 85 ? 'Robo de balón' : 'Rebote';
  if (accOfe === 'Tiro' && accDef === 'Intercepcion') return dado <= 70 ? 'Robo de balón' : 'Rebote';
  if (accOfe === 'Regate' && accDef === 'Bloqueo') return 'Pérdida de acción y repetición';
  if (accOfe === 'Pase' && accDef === 'Bloqueo') return dado <= 50 ? 'Robo de balón' : 'Rebote';
  if (accOfe === 'Tiro' && accDef === 'Bloqueo') return dado <= 10 ? 'Robo de balón' : (dado <= 90 ? 'Rebote' : 'Córner');
  return 'Robo de balón'; 
}

// ACTUALIZADO: Ahora recibe distancia (por defecto 1 para regates/choques directos)
export function resolverDuelo(
  atacante: JugadorPartido, accOfensiva: AccionOfensiva, 
  defensor: JugadorPartido, accDefensiva: AccionDefensiva,
  distancia: number = 1
): ResultadoDuelo {
  const ventajas = evaluarVentajaTactica(accOfensiva, accDefensiva);
  
  // Pasamos la distancia al cálculo ofensivo
  const pOfe = calcularPoderDetalladoOfensivo(atacante, accOfensiva, ventajas.atacanteLimitado, distancia);
  const pDef = calcularPoderDetalladoDefensivo(defensor, accDefensiva, ventajas.defensorLimitado);

  const detalles = {
    baseAtacante: pOfe.base, suerteAtacante: pOfe.suerte, factorDistancia: pOfe.factorDistancia,
    baseDefensor: pDef.base, suerteDefensor: pDef.suerte
  };

  if (pOfe.total >= pDef.total) {
    return { ganador: 'Atacante', poderAtacante: pOfe.total, poderDefensor: pDef.total, resolucion: '¡El atacante supera a la defensa!', detalles };
  } else {
    return { ganador: 'Defensor', poderAtacante: pOfe.total, poderDefensor: pDef.total, resolucion: resolverVictoriaDefensiva(accOfensiva, accDefensiva), detalles };
  }
}