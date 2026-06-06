'use client';

import { useEffect, useState } from 'react';
import playersData from './engine/players.json';
import { CartaBase, JugadorPartido, AccionOfensiva, AccionDefensiva, Posicion } from './engine/types';
import { resolverDuelo } from './engine/matchEngine';

export default function TableroDuelo() {
  const [momentos, setMomentos] = useState(40);
  const [log, setLog] = useState<string[]>([]);
  const [turno, setTurno] = useState<'Isagi' | 'Aiku'>('Isagi');
  
  const anchosFilas = [1, 5, 6, 6, 6, 5, 1];

  // 1. INICIALIZACIÓN DINÁMICA: Tomamos el JSON y construimos el estado del partido
  const [isagi, setIsagi] = useState<JugadorPartido>(() => {
    const carta = playersData[0] as CartaBase;
    return {
      ...carta,
      equipo: 'Local',
      energiaActual: carta.energiaMaxima,
      posicion: { x: 2, y: 4 } // 3/4 de cancha local
    };
  });
  
  const [aiku, setAiku] = useState<JugadorPartido>(() => {
    const carta = playersData[1] as CartaBase;
    return {
      ...carta,
      equipo: 'Visitante',
      energiaActual: carta.energiaMaxima,
      posicion: { x: 2, y: 1 } // Área de visita
    };
  });

  const [isagiSeleccionado, setIsagiSeleccionado] = useState(false);

  const agregarLog = (mensaje: string) => {
    setLog(prev => [mensaje, ...prev]);
  };

  const obtenerPosicionesAdyacentes = (posicion: Posicion) => {
    const direcciones = [
      { x: posicion.x, y: posicion.y - 1 },
      { x: posicion.x, y: posicion.y + 1 },
      { x: posicion.x - 1, y: posicion.y },
      { x: posicion.x + 1, y: posicion.y },
    ];

    return direcciones.filter(({ x, y }) => {
      return y >= 0 && y < anchosFilas.length && x >= 0 && x < anchosFilas[y];
    });
  };

  const esPosicionAdyacente = (posicion: Posicion) => {
    return obtenerPosicionesAdyacentes(isagi.posicion).some(
      (pos) => pos.x === posicion.x && pos.y === posicion.y
    );
  };

  const seleccionarIsagi = () => {
    if (turno !== 'Isagi') {
      agregarLog('⏳ No es tu turno para seleccionar a Isagi.');
      return;
    }

    setIsagiSeleccionado(true);
    agregarLog('✅ Isagi seleccionado. Elige una casilla adyacente para moverlo.');
  };

  const moverIsagiAHacia = (posicion: Posicion) => {
    if (turno !== 'Isagi') return;
    if (!esPosicionAdyacente(posicion)) return;

    setIsagiSeleccionado(false);
    setIsagi((prev) => {
      const nuevaEnergia = Math.max(0, prev.energiaActual - 10);
      const nuevoEstado = {
        ...prev,
        energiaActual: nuevaEnergia,
        posicion,
      };

      agregarLog(`Isagi se mueve a [${posicion.x}, ${posicion.y}]. Energía: ${nuevaEnergia}`);

      if (posicion.y === aiku.posicion.y && posicion.x === aiku.posicion.x) {
        setTimeout(() => iniciarMomento(nuevoEstado, aiku), 50);
      }

      return nuevoEstado;
    });

    setTurno('Aiku');
  };


  const calcularPosicionValida = (posicion: Posicion, dirY: number, dirX: number) => {
    let nuevaY = posicion.y + dirY;
    let nuevaX = posicion.x + dirX;

    if (nuevaY < 0) nuevaY = 0;
    if (nuevaY > 6) nuevaY = 6;

    const anchoMaximoFila = anchosFilas[nuevaY];
    if (nuevaX < 0) nuevaX = 0;
    if (nuevaX >= anchoMaximoFila) nuevaX = anchoMaximoFila - 1;

    return { x: nuevaX, y: nuevaY };
  };

  const moverIsagi = (dirY: number, dirX: number) => {
    if (turno !== 'Isagi') {
      agregarLog('⏳ Espera tu turno para mover a Isagi.');
      return;
    }

    const nuevaPos = calcularPosicionValida(isagi.posicion, dirY, dirX);
    if (nuevaPos.x === isagi.posicion.x && nuevaPos.y === isagi.posicion.y) {
      agregarLog('❌ Movimiento inválido: Isagi no puede avanzar en esa dirección.');
      return;
    }

    setIsagiSeleccionado(false);
    setIsagi((prev) => {
      const nuevaEnergia = Math.max(0, prev.energiaActual - 10);
      const nuevoEstado = {
        ...prev,
        energiaActual: nuevaEnergia,
        posicion: nuevaPos,
      };

      agregarLog(`Isagi se mueve a [${nuevaPos.x}, ${nuevaPos.y}]. Energía: ${nuevaEnergia}`);

      if (nuevaPos.y === aiku.posicion.y && nuevaPos.x === aiku.posicion.x) {
        setTimeout(() => iniciarMomento(nuevoEstado, aiku), 50);
      }

      return nuevoEstado;
    });

    setTurno('Aiku');
  };

  const handleCeldaClick = (x: number, y: number) => {
    if (isagi.posicion.x === x && isagi.posicion.y === y) {
      seleccionarIsagi();
      return;
    }

    if (isagiSeleccionado) {
      moverIsagiAHacia({ x, y });
      return;
    }

    if (turno === 'Isagi') {
      agregarLog('🔵 Haz clic en la ficha azul para seleccionar a Isagi antes de moverlo.');
    }
  };

  const moverAikuHaciaIsagi = () => {
    setAiku((prev) => {
      const dirY = Math.sign(isagi.posicion.y - prev.posicion.y);
      const dirX = Math.sign(isagi.posicion.x - prev.posicion.x);
      const nuevaPos = calcularPosicionValida(prev.posicion, dirY, dirX);

      if (nuevaPos.x === prev.posicion.x && nuevaPos.y === prev.posicion.y) {
        agregarLog('Aiku se mantiene en posición.');
        return prev;
      }

      const nuevaEnergia = Math.max(0, prev.energiaActual - 8);
      const nuevoEstado = {
        ...prev,
        energiaActual: nuevaEnergia,
        posicion: nuevaPos,
      };

      agregarLog(`Aiku se mueve a [${nuevaPos.x}, ${nuevaPos.y}]. Energía: ${nuevaEnergia}`);

      if (nuevaPos.y === isagi.posicion.y && nuevaPos.x === isagi.posicion.x) {
        setTimeout(() => iniciarMomento(isagi, nuevoEstado), 50);
      }

      return nuevoEstado;
    });

    setTurno('Isagi');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (turno !== 'Isagi') return;

      switch (event.key) {
        case 'ArrowUp':
          moverIsagi(-1, 0);
          break;
        case 'ArrowDown':
          moverIsagi(1, 0);
          break;
        case 'ArrowLeft':
          moverIsagi(0, -1);
          break;
        case 'ArrowRight':
          moverIsagi(0, 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [turno, isagi.posicion, aiku.posicion]);

  useEffect(() => {
    if (turno !== 'Aiku') return;

    const timeoutId = window.setTimeout(() => moverAikuHaciaIsagi(), 400);
    return () => window.clearTimeout(timeoutId);
  }, [turno, isagi.posicion, aiku.posicion]);

  useEffect(() => {
    if (turno !== 'Isagi' && isagiSeleccionado) {
      setIsagiSeleccionado(false);
    }
  }, [turno, isagiSeleccionado]);

  const iniciarMomento = (atacante: JugadorPartido, defensor: JugadorPartido) => {
    if (momentos <= 0) {
      agregarLog("⏱️ FIN DEL PARTIDO.");
      return;
    }

    setMomentos(prev => prev - 1);
    
    const accionAtacante: AccionOfensiva = 'Regate';
    const accionDefensor: AccionDefensiva = 'Entrada';

    const resultado = resolverDuelo(atacante, accionAtacante, defensor, accionDefensor);

    agregarLog(`-------------------`);
    agregarLog(`📝 RESULTADO: ${resultado.resolucion}`);
    agregarLog(`💥 GANADOR: ${resultado.ganador}`);
    agregarLog(`⚔️ ¡MOMENTO ACTIVADO! Isagi choca con Aiku.`);
  };

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
              className={`w-14 h-14 sm:w-16 sm:h-16 border border-gray-800 bg-green-900/20 flex items-center justify-center relative transition-all duration-150 ${esCeldaPermitida ? 'border-yellow-300 bg-yellow-500/20 cursor-pointer' : 'cursor-pointer'} ${esCeldaSeleccionada ? 'ring-2 ring-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : ''}`}
            >
              <span className="absolute top-1 left-1 text-[9px] text-gray-500">[{x},{y}]</span>
              {tieneAiku && <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_red]">A</div>}
              {tieneIsagi && <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_blue] absolute z-10">I</div>}
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
          <h1 className="text-2xl font-bold text-white mb-2">ft-cards - Motor Core</h1>
          
          <div className="flex justify-between bg-gray-900 p-4 rounded border border-gray-700 mb-6">
            <div>
              <p className="text-blue-400 font-bold">Isagi (Ataque)</p>
              <p className="text-sm">Energía: {isagi.energiaActual}</p>
            </div>
            <div className="text-center">
              <p className="text-yellow-400 font-bold text-2xl">{momentos}</p>
              <p className="text-xs">Momentos</p>
              <p className="text-xs text-gray-400 mt-2">Turno: <span className="text-white">{turno}</span></p>
            </div>
            <div className="text-right">
              <p className="text-red-400 font-bold">Aiku (Defensa)</p>
              <p className="text-sm">Energía: {aiku.energiaActual}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-48 mx-auto mb-8">
            <div />
            <button onClick={() => moverIsagi(-1, 0)} className="bg-blue-900 hover:bg-blue-700 p-3 rounded text-white shadow-lg transition-colors">⬆️</button>
            <div />
            <button onClick={() => moverIsagi(0, -1)} className="bg-blue-900 hover:bg-blue-700 p-3 rounded text-white shadow-lg transition-colors">⬅️</button>
            <button onClick={() => moverIsagi(1, 0)} className="bg-blue-900 hover:bg-blue-700 p-3 rounded text-white shadow-lg transition-colors">⬇️</button>
            <button onClick={() => moverIsagi(0, 1)} className="bg-blue-900 hover:bg-blue-700 p-3 rounded text-white shadow-lg transition-colors">➡️</button>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-2xl">
            <div className="text-center mb-2 text-gray-500 text-xs">PORTERÍA VISITA</div>
            {renderCanchaRombo()}
            <div className="text-center mt-2 text-gray-500 text-xs">PORTERÍA LOCAL</div>
          </div>
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white mb-2">Registro</h2>
          <div className="bg-black p-4 rounded border border-gray-800 flex-1 overflow-y-auto shadow-inner h-[700px]">
            {log.length === 0 ? (
              <p className="text-gray-600">El balón rueda...</p>
            ) : (
              log.map((linea, index) => (
                <p key={index} className={`mb-1 ${linea.includes('MOMENTO ACTIVADO') ? 'text-yellow-400 font-bold mt-4' : ''} ${linea.includes('Energía') ? 'text-gray-500 text-sm' : ''}`}>
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