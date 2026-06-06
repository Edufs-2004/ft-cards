'use client';

import { useEffect, useState } from 'react';
import playersData from './engine/players.json';
import { CartaBase, JugadorPartido, AccionOfensiva, AccionDefensiva, Posicion } from './engine/types';
import { resolverDuelo } from './engine/matchEngine';

export default function TableroDuelo() {
  const [momentos, setMomentos] = useState(40);
  const [log, setLog] = useState<string[]>([]);
  const [turno, setTurno] = useState<'Isagi' | 'Aiku'>('Isagi');
  const [isagiSeleccionado, setIsagiSeleccionado] = useState(false);
  
  const anchosFilas = [1, 5, 6, 6, 6, 5, 1];

  const [isagi, setIsagi] = useState<JugadorPartido>(() => {
    const carta = playersData[0] as CartaBase;
    return { ...carta, equipo: 'Local', energiaActual: carta.energiaMaxima, posicion: { x: 2, y: 4 } };
  });
  
  const [aiku, setAiku] = useState<JugadorPartido>(() => {
    const carta = playersData[1] as CartaBase;
    return { ...carta, equipo: 'Visitante', energiaActual: carta.energiaMaxima, posicion: { x: 2, y: 1 } };
  });

  const agregarLog = (mensaje: string) => {
    setLog(prev => [mensaje, ...prev]);
  };

  // --- LÓGICA DE ADYACENCIA ---
  const obtenerPosicionesAdyacentes = (posicion: Posicion) => {
    const direcciones = [
      { x: posicion.x, y: posicion.y - 1 },
      { x: posicion.x, y: posicion.y + 1 },
      { x: posicion.x - 1, y: posicion.y },
      { x: posicion.x + 1, y: posicion.y },
    ];
    return direcciones.filter(({ x, y }) => y >= 0 && y < anchosFilas.length && x >= 0 && x < anchosFilas[y]);
  };

  const esPosicionAdyacente = (posicion: Posicion) => {
    return obtenerPosicionesAdyacentes(isagi.posicion).some(
      (pos) => pos.x === posicion.x && pos.y === posicion.y
    );
  };

  // --- INTERACCIÓN DEL USUARIO (CLICS TIPO AJEDREZ) ---
  const handleCeldaClick = (x: number, y: number) => {
    if (turno !== 'Isagi') {
      agregarLog('⏳ Espera a que Aiku termine su turno.');
      return;
    }

    const esClicEnIsagi = isagi.posicion.x === x && isagi.posicion.y === y;

    if (esClicEnIsagi) {
      setIsagiSeleccionado(!isagiSeleccionado);
      if (!isagiSeleccionado) {
        agregarLog('✅ Isagi seleccionado. Las casillas amarillas indican a dónde puedes ir.');
      } else {
        agregarLog('❌ Isagi deseleccionado.');
      }
      return;
    }

    if (isagiSeleccionado) {
      if (esPosicionAdyacente({ x, y })) {
        moverIsagiAHacia({ x, y });
      } else {
        agregarLog('⚠️ Solo puedes moverte a una casilla adyacente (iluminada en amarillo).');
      }
      return;
    }

    agregarLog('🔵 Primero clica sobre Isagi (I) para seleccionarlo.');
  };

  const moverIsagiAHacia = (posicion: Posicion) => {
    setIsagiSeleccionado(false);
    setIsagi((prev) => {
      const nuevaEnergia = Math.max(0, prev.energiaActual - 10);
      const nuevoEstado = { ...prev, energiaActual: nuevaEnergia, posicion };

      agregarLog(`🏃 Isagi se mueve a [${posicion.x}, ${posicion.y}]. Energía: ${nuevaEnergia}`);

      if (posicion.y === aiku.posicion.y && posicion.x === aiku.posicion.x) {
        setTimeout(() => iniciarMomento(nuevoEstado, aiku), 50);
      }

      return nuevoEstado;
    });
    setTurno('Aiku');
  };

  // --- IA DE AIKU ---
  const moverAikuHaciaIsagi = () => {
    setAiku((prev) => {
      const dirY = Math.sign(isagi.posicion.y - prev.posicion.y);
      const dirX = Math.sign(isagi.posicion.x - prev.posicion.x);
      
      let nuevaY = prev.posicion.y + dirY;
      let nuevaX = prev.posicion.x + dirX;

      if (nuevaY < 0) nuevaY = 0;
      if (nuevaY > 6) nuevaY = 6;
      const anchoMaximoFila = anchosFilas[nuevaY];
      if (nuevaX < 0) nuevaX = 0;
      if (nuevaX >= anchoMaximoFila) nuevaX = anchoMaximoFila - 1;

      const nuevaPos = { x: nuevaX, y: nuevaY };

      if (nuevaPos.x === prev.posicion.x && nuevaPos.y === prev.posicion.y) return prev;

      const nuevaEnergia = Math.max(0, prev.energiaActual - 8);
      const nuevoEstado = { ...prev, energiaActual: nuevaEnergia, posicion: nuevaPos };

      agregarLog(`🛡️ Aiku te persigue a [${nuevaPos.x}, ${nuevaPos.y}]. Energía: ${nuevaEnergia}`);

      if (nuevaPos.y === isagi.posicion.y && nuevaPos.x === isagi.posicion.x) {
        setTimeout(() => iniciarMomento(isagi, nuevoEstado), 50);
      }

      return nuevoEstado;
    });
    setTurno('Isagi');
  };

  useEffect(() => {
    if (turno !== 'Aiku') return;
    const timeoutId = window.setTimeout(() => moverAikuHaciaIsagi(), 500);
    return () => window.clearTimeout(timeoutId);
  }, [turno, isagi.posicion, aiku.posicion]);

  // --- DUELO ---
  const iniciarMomento = (atacante: JugadorPartido, defensor: JugadorPartido) => {
    if (momentos <= 0) {
      agregarLog("⏱️ FIN DEL PARTIDO.");
      return;
    }
    setMomentos(prev => prev - 1);
    const resultado = resolverDuelo(atacante, 'Regate', defensor, 'Entrada');
    agregarLog(`-------------------`);
    agregarLog(`📝 RESULTADO: ${resultado.resolucion}`);
    agregarLog(`💥 GANADOR: ${resultado.ganador}`);
    agregarLog(`⚔️ ¡MOMENTO ACTIVADO! Isagi choca con Aiku.`);
  };

  // --- RENDERIZADO VISUAL ---
  const renderCanchaRombo = () => {
    return anchosFilas.map((ancho, y) => (
      <div key={`fila-${y}`} className="flex justify-center gap-1 mb-1">
        {Array.from({ length: ancho }).map((_, x) => {
          const tieneIsagi = isagi.posicion.x === x && isagi.posicion.y === y;
          const tieneAiku = aiku.posicion.x === x && aiku.posicion.y === y;
          const esCeldaPermitida = isagiSeleccionado && esPosicionAdyacente({ x, y });
          const esCeldaSeleccionada = tieneIsagi && isagiSeleccionado;

          return (
            <div
              key={`celda-${x}-${y}`}
              onClick={() => handleCeldaClick(x, y)}
              className={`w-14 h-14 sm:w-16 sm:h-16 border border-gray-800 flex items-center justify-center relative transition-all duration-150 cursor-pointer select-none
                ${esCeldaPermitida ? 'border-yellow-400 bg-yellow-500/30' : 'bg-green-900/20'} 
                ${esCeldaSeleccionada ? 'ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] bg-blue-900/40' : ''}`}
            >
              {/* NOTA LA CLASE pointer-events-none AQUÍ: Atraviesa el texto y el círculo */}
              <span className="absolute top-1 left-1 text-[9px] text-gray-500 pointer-events-none">[{x},{y}]</span>
              
              {tieneAiku && <div className="pointer-events-none absolute w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_red] z-10">A</div>}
              {tieneIsagi && <div className="pointer-events-none absolute w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_blue] z-20">I</div>}
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-300 p-8 font-mono">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">ft-cards - Tablero Táctico</h1>
          
          <div className="flex justify-between bg-gray-900 p-4 rounded border border-gray-700 mb-6">
            <div>
              <p className="text-blue-400 font-bold">Isagi (Ataque)</p>
              <p className="text-sm">Energía: {isagi.energiaActual}</p>
            </div>
            <div className="text-center">
              <p className="text-yellow-400 font-bold text-2xl">{momentos}</p>
              <p className="text-xs">Momentos</p>
              <p className="text-xs mt-2">Turno: <span className={turno === 'Isagi' ? "text-blue-400 font-bold" : "text-red-400 font-bold"}>{turno}</span></p>
            </div>
            <div className="text-right">
              <p className="text-red-400 font-bold">Aiku (Defensa)</p>
              <p className="text-sm">Energía: {aiku.energiaActual}</p>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-2xl">
            <div className="text-center mb-2 text-gray-500 text-xs tracking-widest">PORTERÍA VISITA</div>
            {renderCanchaRombo()}
            <div className="text-center mt-2 text-gray-500 text-xs tracking-widest">PORTERÍA LOCAL</div>
          </div>
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white mb-2">Registro del Partido</h2>
          <div className="bg-black p-4 rounded border border-gray-800 flex-1 overflow-y-auto shadow-inner h-[600px]">
            {log.length === 0 ? (
              <p className="text-gray-600">Haz clic sobre la ficha azul de Isagi para empezar...</p>
            ) : (
              log.map((linea, index) => (
                <p key={index} className={`mb-2 border-b border-gray-900 pb-1 ${linea.includes('MOMENTO ACTIVADO') ? 'text-yellow-400 font-bold mt-4' : ''} ${linea.includes('Energía') ? 'text-gray-500 text-sm' : ''} ${linea.includes('✅') ? 'text-green-400' : ''} ${linea.includes('❌') || linea.includes('⚠️') ? 'text-red-400' : ''}`}>
                  {linea}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}