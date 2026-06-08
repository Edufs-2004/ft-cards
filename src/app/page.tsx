'use client';

import { useEffect, useState } from 'react';
import playersData from './engine/players.json';
import { CartaBase, JugadorPartido, AccionOfensiva, AccionDefensiva, Posicion, ResultadoDuelo } from './engine/types';
import { resolverDuelo } from './engine/matchEngine';
import { obtenerMultiplicadorFatiga, obtenerFactorDistancia } from './engine/mathEngine';

// --- TOOLTIP ACTUALIZADO CON BARRA DE ENERGÍA ---
const TooltipJugador = ({ jugador }: { jugador: JugadorPartido }) => {
  const fatiga = obtenerMultiplicadorFatiga(jugador.energiaActual, jugador.energiaMaxima);
  const renderStat = (n: string, v: number) => {
    const real = Math.floor(v * fatiga);
    return (
      <div className="flex justify-between text-xs my-0.5">
        <span className="text-gray-400 capitalize">{n}:</span>
        <span className={`font-bold ${real < v ? 'text-red-400' : 'text-white'}`}>{real}</span>
      </div>
    );
  };
  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-gray-950 border border-gray-700 rounded p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      <p className="text-center font-bold text-blue-400 text-sm mb-2">{jugador.nombre}</p>
      
      {/* BARRA DE ENERGÍA INTEGRADA AQUÍ */}
      <div className="mb-3">
        <p className="text-[10px] text-gray-400 mb-1 flex justify-between">
          <span>Energía</span>
          <span className={jugador.energiaActual < 100 ? 'text-red-400 font-bold' : 'text-white'}>{jugador.energiaActual}/{jugador.energiaMaxima}</span>
        </p>
        <div className="w-full bg-gray-800 h-1.5 rounded overflow-hidden">
          <div className={`h-full transition-all ${jugador.energiaActual < 100 ? 'bg-red-500' : 'bg-yellow-400'}`} style={{ width: `${(jugador.energiaActual / jugador.energiaMaxima) * 100}%` }}></div>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-2">
        {renderStat('tiro', jugador.stats.tiro)}
        {renderStat('regate', jugador.stats.regate)}
        {renderStat('vision', jugador.stats.vision)}
        {renderStat('pase', jugador.stats.pase)}
        {renderStat('defensa', jugador.stats.defensa)}
        {renderStat('velocidad', jugador.stats.velocidad)}
      </div>
    </div>
  );
};

export default function TableroDuelo() {
  const [momentos, setMomentos] = useState(40);
  const [log, setLog] = useState<string[]>([]);
  const [marcador, setMarcador] = useState({ local: 0, visitante: 0 });
  const [turno, setTurno] = useState<'Isagi' | 'Aiku'>('Isagi');
  
  const [poseedorBalon, setPoseedorBalon] = useState<'p1' | 'p2' | 'nadie'>('p1');
  const [posicionBalon, setPosicionBalon] = useState<Posicion>({ x: 3, y: 5 });
  const [isagiSeleccionado, setIsagiSeleccionado] = useState(false);
  const [modoAccion, setModoAccion] = useState<'mover' | 'pasar' | 'tirar'>('mover');
  
  const [trayectoriaHover, setTrayectoriaHover] = useState<Posicion[]>([]);

  const anchosFilas = [1, 6, 6, 6, 6, 6, 6, 6, 1];

  const [isagi, setIsagi] = useState<JugadorPartido>(() => ({ ...playersData[0] as CartaBase, equipo: 'Local', energiaActual: 200, posicion: { x: 3, y: 5 } }));
  const [aiku, setAiku] = useState<JugadorPartido>(() => ({ ...playersData[1] as CartaBase, equipo: 'Visitante', energiaActual: 200, posicion: { x: 3, y: 2 } }));

  const [dueloActivo, setDueloActivo] = useState<{
    atacante: JugadorPartido; defensor: JugadorPartido;
    iniciadoPor: 'Isagi' | 'Aiku'; fase: 'seleccion' | 'calculo' | 'resultado';
    accionAtacante?: AccionOfensiva; accionDefensor?: AccionDefensiva;
    resultado?: ResultadoDuelo; distancia: number;
  } | null>(null);

  const agregarLog = (m: string) => setLog(p => [m, ...p]);

  const obtenerAdyacentes = (pos: Posicion) => {
    return [
      {x: pos.x, y: pos.y-1}, {x: pos.x, y: pos.y+1}, {x: pos.x-1, y: pos.y}, {x: pos.x+1, y: pos.y},
      {x: pos.x-1, y: pos.y-1}, {x: pos.x+1, y: pos.y-1}, {x: pos.x-1, y: pos.y+1}, {x: pos.x+1, y: pos.y+1}
    ].filter(p => p.y >= 0 && p.y < anchosFilas.length && p.x >= 0 && p.x < anchosFilas[p.y]);
  };

  const calcularRuta = (inicio: Posicion, fin: Posicion): Posicion[] => {
    const ruta: Posicion[] = [];
    let actX = inicio.x;
    let actY = inicio.y;
    while (actX !== fin.x || actY !== fin.y) {
      actX += Math.sign(fin.x - actX);
      actY += Math.sign(fin.y - actY);
      ruta.push({ x: actX, y: actY });
    }
    return ruta;
  };

  const handleHoverCelda = (x: number, y: number) => {
    if (isagiSeleccionado && (modoAccion === 'pasar' || modoAccion === 'tirar')) {
      setTrayectoriaHover(calcularRuta(isagi.posicion, { x, y }));
    }
  };

  const handleCeldaClick = (x: number, y: number) => {
    if (turno !== 'Isagi' || dueloActivo) return;

    if (isagi.posicion.x === x && isagi.posicion.y === y) {
      setIsagiSeleccionado(!isagiSeleccionado);
      setModoAccion('mover');
      setTrayectoriaHover([]);
      return;
    }

    if (isagiSeleccionado) {
      if (modoAccion === 'mover' && obtenerAdyacentes(isagi.posicion).some(p => p.x === x && p.y === y)) {
        setIsagiSeleccionado(false);
        setIsagi(prev => {
          const nuevoEstado = { ...prev, energiaActual: Math.max(0, prev.energiaActual - 10), posicion: { x, y } };
          if (poseedorBalon === 'p1') setPosicionBalon({ x, y });

          if (y === aiku.posicion.y && x === aiku.posicion.x) {
            setDueloActivo({ atacante: poseedorBalon === 'p1' ? nuevoEstado : aiku, defensor: poseedorBalon === 'p1' ? aiku : nuevoEstado, iniciadoPor: 'Isagi', fase: 'seleccion', distancia: 1 });
          } else setTurno('Aiku');
          return nuevoEstado;
        });
      } 
      else if (modoAccion === 'pasar' || (modoAccion === 'tirar' && x === 0 && y === 0)) {
        setIsagiSeleccionado(false);
        setTrayectoriaHover([]);
        
        const ruta = calcularRuta(isagi.posicion, { x, y });
        const distancia = ruta.length;
        
        const aikuEnMedio = ruta.some(p => p.x === aiku.posicion.x && p.y === aiku.posicion.y);

        if (aikuEnMedio) {
          agregarLog(`⚠️ ¡Aiku se interpone en la trayectoria del balón!`);
          const accionOfe = modoAccion === 'pasar' ? 'Pase' : 'Tiro';
          
          const res = resolverDuelo(isagi, accionOfe, aiku, 'Bloqueo', distancia);
          setDueloActivo({
            atacante: isagi, defensor: aiku, iniciadoPor: 'Isagi', fase: 'calculo',
            accionAtacante: accionOfe, accionDefensor: 'Bloqueo', resultado: res, distancia
          });
          return;
        }

        const poderFinalPase = Math.floor((isagi.stats.pase * 0.70 + isagi.stats.vision * 0.30) * obtenerFactorDistancia(distancia));
        
        if (modoAccion === 'pasar') {
          setPosicionBalon({ x, y });
          agregarLog(`👟 Pase limpio de Isagi a [${x}, ${y}] (Poder Final: ${poderFinalPase}).`);
          setPoseedorBalon('nadie');
        } else {
          setMarcador(prev => ({...prev, local: prev.local + 1}));
          agregarLog(`⚽ ¡GOL DE ISAGI! El tiro llega limpio al arco.`);
          setPoseedorBalon('p2');
          setPosicionBalon({ x: 3, y: 4 });
          setIsagi(prev => ({ ...prev, posicion: { x: 3, y: 5 } }));
          setAiku(prev => ({ ...prev, posicion: { x: 3, y: 3 } }));
        }
        setModoAccion('mover');
        setTurno('Aiku');
      }
    }
  };

  const moverAikuHaciaIsagi = () => {
    setAiku((prev) => {
      const objetivo = poseedorBalon === 'nadie' ? posicionBalon : poseedorBalon === 'p2' ? { x: 0, y: 8 } : isagi.posicion;
      const dirY = Math.sign(objetivo.y - prev.posicion.y);
      const dirX = Math.sign(objetivo.x - prev.posicion.x);
      let nuevaY = prev.posicion.y + dirY; let nuevaX = prev.posicion.x + dirX;

      if (nuevaY < 0) nuevaY = 0; if (nuevaY > 8) nuevaY = 8;
      const maxFila = anchosFilas[nuevaY];
      if (nuevaX < 0) nuevaX = 0; if (nuevaX >= maxFila) nuevaX = maxFila - 1;

      if (nuevaX === prev.posicion.x && nuevaY === prev.posicion.y) { setTurno('Isagi'); return prev; }

      const nuevoEstado = { ...prev, energiaActual: Math.max(0, prev.energiaActual - 8), posicion: { x: nuevaX, y: nuevaY } };
      if (poseedorBalon === 'p2') setPosicionBalon({ x: nuevaX, y: nuevaY });

      if (poseedorBalon === 'nadie' && nuevaX === posicionBalon.x && nuevaY === posicionBalon.y) {
        setPoseedorBalon('p2'); agregarLog(`🛡️ Aiku recuperó el balón suelto.`);
      }

      if (nuevaY === isagi.posicion.y && nuevaX === isagi.posicion.x) {
        setDueloActivo({ atacante: poseedorBalon === 'p2' ? nuevoEstado : isagi, defensor: poseedorBalon === 'p2' ? isagi : nuevoEstado, iniciadoPor: 'Aiku', fase: 'seleccion', distancia: 1 });
      } else {
        setTurno('Isagi');
      }
      return nuevoEstado;
    });
  };

  useEffect(() => {
    if (turno !== 'Aiku' || dueloActivo) return;
    const tId = window.setTimeout(() => moverAikuHaciaIsagi(), 500);
    return () => window.clearTimeout(tId);
  }, [turno, dueloActivo]);

  const manejarEleccionUsuario = (accion: string) => {
    if (!dueloActivo) return;
    let accAtaque: AccionOfensiva; let accDefensa: AccionDefensiva;

    if (dueloActivo.atacante.id === isagi.id) {
      accAtaque = accion as AccionOfensiva;
      const opcDef: AccionDefensiva[] = ['Entrada', 'Intercepcion', 'Bloqueo'];
      accDefensa = opcDef[Math.floor(Math.random() * opcDef.length)];
    } else {
      accDefensa = accion as AccionDefensiva;
      const opcOf: AccionOfensiva[] = ['Regate', 'Pase', 'Tiro'];
      accAtaque = opcOf[Math.floor(Math.random() * opcOf.length)];
    }

    const res = resolverDuelo(dueloActivo.atacante, accAtaque, dueloActivo.defensor, accDefensa, dueloActivo.distancia);
    setDueloActivo({ ...dueloActivo, fase: 'calculo', accionAtacante: accAtaque, accionDefensor: accDefensa, resultado: res });
  };

  const aplicarConsecuencia = () => {
    if (!dueloActivo || !dueloActivo.resultado) return;
    const res = dueloActivo.resultado;
    
    if (res.resolucion.includes('Robo') || res.resolucion.includes('Intercepción')) {
      setPoseedorBalon(dueloActivo.defensor.id);
      setPosicionBalon(dueloActivo.defensor.posicion);
      agregarLog(`🔄 ${dueloActivo.defensor.nombre} se apoderó del balón.`);
    } else if (res.resolucion.includes('Rebote')) {
      const ady = obtenerAdyacentes(dueloActivo.defensor.posicion);
      const rebote = ady[Math.floor(Math.random() * ady.length)];
      setPosicionBalon(rebote); setPoseedorBalon('nadie');
      agregarLog(`🎲 El balón rebota a la casilla [${rebote.x}, ${rebote.y}].`);
    }

    setMomentos(prev => prev - 1);
    setTurno(dueloActivo.iniciadoPor === 'Isagi' ? 'Aiku' : 'Isagi');
    setDueloActivo(null);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-300 p-4 font-mono relative">
      
      {dueloActivo && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
          {dueloActivo.fase === 'seleccion' && (
            <>
              <h2 className="text-4xl text-yellow-500 font-bold mb-8 animate-pulse tracking-widest">
                {dueloActivo.atacante.id === isagi.id ? 'TU TURNO DE ATACAR' : 'DEFIENDE TU ZONA'}
              </h2>
              <div className="flex gap-4">
                {dueloActivo.atacante.id === isagi.id ? (
                  <><button onClick={() => manejarEleccionUsuario('Regate')} className="bg-blue-600 hover:bg-blue-500 px-6 py-4 rounded text-white font-bold text-xl">🏃 Regate</button>
                    <button onClick={() => manejarEleccionUsuario('Pase')} className="bg-green-600 hover:bg-green-500 px-6 py-4 rounded text-white font-bold text-xl">👟 Pase</button>
                    <button onClick={() => manejarEleccionUsuario('Tiro')} className="bg-red-600 hover:bg-red-500 px-6 py-4 rounded text-white font-bold text-xl">⚽ Tiro</button></>
                ) : (
                  <><button onClick={() => manejarEleccionUsuario('Entrada')} className="bg-blue-600 hover:bg-blue-500 px-6 py-4 rounded text-white font-bold text-xl">🛑 Entrada</button>
                    <button onClick={() => manejarEleccionUsuario('Intercepcion')} className="bg-green-600 hover:bg-green-500 px-6 py-4 rounded text-white font-bold text-xl">👁️ Intercep.</button>
                    <button onClick={() => manejarEleccionUsuario('Bloqueo')} className="bg-red-600 hover:bg-red-500 px-6 py-4 rounded text-white font-bold text-xl">🧱 Bloqueo</button></>
                )}
              </div>
            </>
          )}

          {dueloActivo.fase === 'calculo' && (
            <div className="text-center w-full max-w-4xl">
              <h2 className="text-3xl text-white font-bold mb-10 animate-pulse">⚙️ CÁLCULOS DEL MOTOR...</h2>
              <div className="flex justify-between gap-8 mb-10">
                <div className="flex-1 bg-gray-900 p-6 rounded-xl border border-gray-700">
                  <p className="text-xl text-blue-400 font-bold">{dueloActivo.atacante.nombre}</p>
                  <p className="text-gray-400 mb-4">{dueloActivo.accionAtacante}</p>
                  <div className="text-lg text-white mb-2">Poder Base: <span className="font-bold text-2xl">{dueloActivo.resultado?.detalles.baseAtacante}</span></div>
                  {dueloActivo.distancia > 1 && <div className="text-sm text-orange-400 mb-1">Factor Distancia: x{dueloActivo.resultado?.detalles.factorDistancia}</div>}
                  <div className="text-lg text-yellow-400 mb-4 animate-bounce">Factor Suerte: x{dueloActivo.resultado?.detalles.suerteAtacante}</div>
                  <div className="text-5xl font-black text-white">{dueloActivo.resultado?.poderAtacante}</div>
                </div>
                <div className="flex-1 bg-gray-900 p-6 rounded-xl border border-gray-700">
                  <p className="text-xl text-red-400 font-bold">{dueloActivo.defensor.nombre}</p>
                  <p className="text-gray-400 mb-4">{dueloActivo.accionDefensor}</p>
                  <div className="text-lg text-white mb-2">Poder Base: <span className="font-bold text-2xl">{dueloActivo.resultado?.detalles.baseDefensor}</span></div>
                  <div className="text-lg text-yellow-400 mb-4 animate-bounce">Factor Suerte: x{dueloActivo.resultado?.detalles.suerteDefensor}</div>
                  <div className="text-5xl font-black text-white">{dueloActivo.resultado?.poderDefensor}</div>
                </div>
              </div>
              <button onClick={() => setDueloActivo({ ...dueloActivo, fase: 'resultado' })} className="bg-yellow-500 text-black font-black text-xl py-4 px-12 rounded-xl transition-transform hover:scale-105">REVELAR RESULTADO</button>
            </div>
          )}

          {dueloActivo.fase === 'resultado' && (
            <div className="text-center w-full max-w-3xl">
              <h2 className="text-6xl font-black mb-12 text-white uppercase">{dueloActivo.resultado?.ganador === 'Atacante' ? '💥 ACCIÓN OFENSIVA ÉXITOSA 💥' : '🛡️ BLOQUEO DEFENSIVO 🛡️'}</h2>
              <div className="text-2xl text-yellow-400 font-bold mb-12 bg-black py-4 px-8 inline-block rounded-full border border-yellow-600">{dueloActivo.resultado?.resolucion}</div>
              <button onClick={aplicarConsecuencia} className="block mx-auto w-full max-w-md bg-white text-black font-black text-2xl py-4 rounded-xl transition-transform hover:scale-105">CONTINUAR PARTIDO</button>
            </div>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div>
          {/* MARCADOR LIMPIO: EQUIPOS Y RESULTADOS ESTRICTAMENTE */}
          <div className="flex justify-between bg-gray-900 p-4 rounded border border-gray-700 mb-4 items-center">
            <div className="text-center flex-1">
              <p className="text-blue-400 font-bold text-2xl">LOCAL</p>
              <p className="text-5xl font-black text-white">{marcador.local}</p>
            </div>
            <div className="text-center pt-2 flex-1 border-x border-gray-700 px-4">
              <p className="text-yellow-400 font-bold text-2xl">{momentos} ⏱️</p>
              <p className="text-xs text-gray-400">Momentos Restantes</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-red-400 font-bold text-2xl">VISITA</p>
              <p className="text-5xl font-black text-white">{marcador.visitante}</p>
            </div>
          </div>

          <div className="h-16 mb-2">
            {isagiSeleccionado && poseedorBalon === 'p1' && (
              <div className="flex justify-center gap-4 bg-gray-900 p-2 rounded border border-blue-900">
                <button onClick={() => setModoAccion('mover')} className={`px-4 py-2 font-bold rounded ${modoAccion === 'mover' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>Moverse</button>
                <button onClick={() => setModoAccion('pasar')} className={`px-4 py-2 font-bold rounded ${modoAccion === 'pasar' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>Pasar</button>
                <button onClick={() => setModoAccion('tirar')} className={`px-4 py-2 font-bold rounded ${modoAccion === 'tirar' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>Tirar</button>
              </div>
            )}
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            {anchosFilas.map((ancho, y) => (
              <div key={`fila-${y}`} className="flex justify-center gap-1 mb-1">
                {Array.from({ length: ancho }).map((_, x) => {
                  const tieneIsagi = isagi.posicion.x === x && isagi.posicion.y === y;
                  const tieneAiku = aiku.posicion.x === x && aiku.posicion.y === y;
                  const balonAqui = posicionBalon.x === x && posicionBalon.y === y;
                  
                  let esCeldaPermitida = false;
                  if (isagiSeleccionado) {
                    if (modoAccion === 'mover') esCeldaPermitida = obtenerAdyacentes(isagi.posicion).some(p => p.x === x && p.y === y);
                    if (modoAccion === 'pasar') esCeldaPermitida = !tieneIsagi;
                    if (modoAccion === 'tirar') esCeldaPermitida = (y === 0 && x === 0);
                  }

                  const enTrayectoria = trayectoriaHover.some(p => p.x === x && p.y === y);
                  
                  return (
                    <button
                      key={`celda-${x}-${y}`} 
                      onClick={() => handleCeldaClick(x, y)}
                      onMouseEnter={() => handleHoverCelda(x, y)}
                      onMouseLeave={() => setTrayectoriaHover([])}
                      className={`w-12 h-12 sm:w-14 sm:h-14 border border-gray-800 flex items-center justify-center relative transition-all duration-75 group
                        ${enTrayectoria ? 'bg-green-500/50 border-green-400 ring-2 ring-green-300' : 'bg-green-950/30'}
                        ${esCeldaPermitida && modoAccion === 'mover' ? 'border-yellow-400 bg-yellow-500/30 cursor-pointer' : ''}
                        ${esCeldaPermitida && modoAccion === 'pasar' ? 'cursor-crosshair' : ''}
                        ${esCeldaPermitida && modoAccion === 'tirar' ? 'bg-red-600/20 cursor-crosshair' : ''}
                        ${tieneIsagi && isagiSeleccionado ? 'ring-2 ring-blue-500 bg-blue-900/40' : ''}`}
                    >
                      {poseedorBalon === 'nadie' && balonAqui && <span className="absolute text-xl z-10 animate-bounce pointer-events-none">⚽</span>}
                      {tieneIsagi && poseedorBalon === 'p1' && <span className="absolute -top-1 -right-1 text-xs z-30 pointer-events-none">⚽</span>}
                      {tieneAiku && poseedorBalon === 'p2' && <span className="absolute -top-1 -right-1 text-xs z-30 pointer-events-none">⚽</span>}

                      {tieneAiku && <><div className="pointer-events-none w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_red] z-10">A</div><TooltipJugador jugador={aiku} /></>}
                      {tieneIsagi && <><div className="pointer-events-none w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_blue] z-20">I</div><TooltipJugador jugador={isagi} /></>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white mb-2">Eventos</h2>
          <div className="bg-black p-4 rounded border border-gray-800 flex-1 overflow-y-auto h-[650px] shadow-inner flex flex-col-reverse">
            <div>
              {log.map((linea, index) => (
                <p key={index} className={`mb-2 border-b border-gray-900 pb-1 text-sm ${linea.includes('⚽') ? 'text-green-400 font-bold text-base' : ''} ${linea.includes('⚠️') ? 'text-red-400 font-bold' : ''}`}>
                  {linea}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}