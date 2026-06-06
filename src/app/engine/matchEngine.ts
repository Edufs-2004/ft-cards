import { JugadorPartido, AccionOfensiva, AccionDefensiva, ResultadoDuelo } from './types';
import { calcularPoderOfensivo, calcularPoderDefensivo } from './mathEngine';

function evaluarVentajaTactica(accOfensiva: AccionOfensiva, accDefensiva: AccionDefensiva) {
  let atacanteLimitado = false;
  let defensorLimitado = false;

  if (accDefensiva === 'Entrada' && accOfensiva === 'Regate') atacanteLimitado = true;
  if (accDefensiva === 'Intercepcion' && accOfensiva === 'Pase') atacanteLimitado = true;
  if (accDefensiva === 'Bloqueo' && accOfensiva === 'Tiro') atacanteLimitado = true;

  if (accOfensiva === 'Pase' && accDefensiva === 'Entrada') defensorLimitado = true;
  if (accOfensiva === 'Tiro' && accDefensiva === 'Intercepcion') defensorLimitado = true;
  if (accOfensiva === 'Regate' && accDefensiva === 'Bloqueo') defensorLimitado = true;

  return { atacanteLimitado, defensorLimitado };
}

function resolverVictoriaDefensiva(accOfensiva: AccionOfensiva, accDefensiva: AccionDefensiva): string {
  const dado = Math.random() * 100;

  if (accOfensiva === 'Regate' && accDefensiva === 'Entrada') return dado <= 95 ? 'Robo de balón' : 'Rebote';
  if (accOfensiva === 'Pase' && accDefensiva === 'Entrada') return dado <= 40 ? 'Robo de balón' : 'Rebote';
  if (accOfensiva === 'Tiro' && accDefensiva === 'Entrada') return dado <= 10 ? 'Robo de balón' : 'Rebote';
  
  if (accOfensiva === 'Regate' && accDefensiva === 'Intercepcion') return dado <= 25 ? 'Robo de balón' : 'Rebote';
  if (accOfensiva === 'Pase' && accDefensiva === 'Intercepcion') return dado <= 85 ? 'Robo de balón' : 'Rebote';
  if (accOfensiva === 'Tiro' && accDefensiva === 'Intercepcion') return dado <= 70 ? 'Robo de balón' : 'Rebote';
  
  if (accOfensiva === 'Regate' && accDefensiva === 'Bloqueo') return 'Pérdida de acción y repetición';
  if (accOfensiva === 'Pase' && accDefensiva === 'Bloqueo') return dado <= 50 ? 'Robo de balón' : 'Rebote';
  
  if (accOfensiva === 'Tiro' && accDefensiva === 'Bloqueo') {
    if (dado <= 10) return 'Robo de balón';
    if (dado <= 90) return 'Rebote';
    return 'Córner';
  }

  return 'Robo de balón'; 
}

export function resolverDuelo(
  atacante: JugadorPartido, 
  accOfensiva: AccionOfensiva, 
  defensor: JugadorPartido, 
  accDefensiva: AccionDefensiva
): ResultadoDuelo {
  
  const ventajas = evaluarVentajaTactica(accOfensiva, accDefensiva);
  
  const poderOfensivo = calcularPoderOfensivo(atacante, accOfensiva, ventajas.atacanteLimitado);
  const poderDefensivo = calcularPoderDefensivo(defensor, accDefensiva, ventajas.defensorLimitado);

  if (poderOfensivo >= poderDefensivo) {
    return {
      ganador: 'Atacante',
      poderAtacante: poderOfensivo,
      poderDefensor: poderDefensivo,
      resolucion: '¡El atacante supera a la defensa y la jugada continúa!'
    };
  } else {
    return {
      ganador: 'Defensor',
      poderAtacante: poderOfensivo,
      poderDefensor: poderDefensivo,
      resolucion: resolverVictoriaDefensiva(accOfensiva, accDefensiva)
    };
  }
}