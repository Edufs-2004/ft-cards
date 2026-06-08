'use client';

import { useState } from 'react';
import Link from 'next/link';
import cartasData from './engine/players';
import { CartaBase } from './engine/types';

// Colores visuales basados en tu sistema de Rarezas
const ESTILOS_RAREZA: Record<string, string> = {
  'Normal': 'from-gray-600 to-gray-800 border-gray-500 shadow-gray-500/50 text-gray-300',
  'Raro': 'from-blue-600 to-blue-900 border-blue-400 shadow-blue-500/50 text-blue-200',
  'Epico': 'from-purple-600 to-purple-900 border-purple-400 shadow-purple-500/60 text-purple-200',
  'Legendario': 'from-yellow-500 to-yellow-800 border-yellow-300 shadow-yellow-500/80 text-yellow-100',
  'Top Mundial': 'from-red-600 via-yellow-500 to-red-600 border-red-400 shadow-red-500/80 text-white animate-pulse'
};

export default function GachaSystem() {
  const [fase, setFase] = useState<'seleccion' | 'abriendo' | 'resumen'>('seleccion');
  const [cartasSobre, setCartasSobre] = useState<CartaBase[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  
  // Estados para la animación de voltear la carta
  const [estadoGiro, setEstadoGiro] = useState<'dorso' | 'girando' | 'frente'>('dorso');

  // Filtramos la base de datos para crear "Sobres Temáticos"
  const sobreEquipoZ = (cartasData as CartaBase[]).filter(c => c.edicion === '(Equipo Z)');
  const sobreRivales = (cartasData as CartaBase[]).filter(c => c.edicion === '(Rivales)');

  const abrirSobre = (cartas: CartaBase[]) => {
    // Mezclamos las cartas al azar para que el orden sea sorpresa
    const cartasMezcladas = [...cartas].sort(() => Math.random() - 0.5);
    setCartasSobre(cartasMezcladas);
    setIndiceActual(0);
    setEstadoGiro('dorso');
    setFase('abriendo');
  };

  const voltearCarta = () => {
    if (estadoGiro !== 'dorso') return;
    setEstadoGiro('girando');
    // A la mitad de la animación, cambiamos el contenido al "frente"
    setTimeout(() => {
      setEstadoGiro('frente');
    }, 200);
  };

  const siguienteCarta = () => {
    if (indiceActual + 1 < cartasSobre.length) {
      setEstadoGiro('girando');
      setTimeout(() => {
        setIndiceActual(prev => prev + 1);
        setEstadoGiro('dorso');
      }, 200);
    } else {
      setFase('resumen');
    }
  };

  const cartaActual = cartasSobre[indiceActual];

  return (
    <main className="min-h-screen bg-gray-950 text-gray-200 font-mono flex flex-col items-center justify-center p-8 overflow-hidden">
      
      {/* NAVEGACIÓN TEMPORAL */}
      <div className="absolute top-4 left-4">
        <Link href="/" className="text-gray-500 hover:text-white border border-gray-700 px-4 py-2 rounded transition-colors">
          ← Volver al Tablero
        </Link>
      </div>

      {/* FASE 1: ELEGIR EL SOBRE INICIAL */}
      {fase === 'seleccion' && (
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl font-black text-white mb-4 tracking-widest">BIENVENIDO AL PROYECTO</h1>
          <p className="text-xl text-gray-400 mb-12">Elige tu Sobre Inicial. Esto definirá la base de tu equipo.</p>
          
          <div className="flex gap-8 justify-center">
            {/* Sobre 1 */}
            <button 
              onClick={() => abrirSobre(sobreEquipoZ)}
              className="group relative w-64 h-96 bg-gradient-to-br from-blue-900 to-black border-4 border-blue-600 rounded-xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] hover:-translate-y-4 transition-all duration-300"
            >
              <h2 className="text-3xl font-black text-blue-400 mb-2">SOBRE</h2>
              <h3 className="text-2xl font-bold text-white mb-8">EQUIPO Z</h3>
              <p className="text-gray-400 text-sm px-4">Contiene 11 jugadores del mítico Equipo Z. Alta sinergia ofensiva.</p>
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
            </button>

            {/* Sobre 2 */}
            <button 
              onClick={() => abrirSobre(sobreRivales)}
              className="group relative w-64 h-96 bg-gradient-to-br from-red-900 to-black border-4 border-red-600 rounded-xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:-translate-y-4 transition-all duration-300"
            >
              <h2 className="text-3xl font-black text-red-400 mb-2">SOBRE</h2>
              <h3 className="text-2xl font-bold text-white mb-8">RIVALES</h3>
              <p className="text-gray-400 text-sm px-4">Contiene 10 jugadores. Bestias individuales con stats brutales.</p>
              <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
            </button>
          </div>
        </div>
      )}

      {/* FASE 2: ABRIENDO CARTAS 1x1 */}
      {fase === 'abriendo' && cartaActual && (
        <div className="text-center">
          <p className="text-gray-500 mb-8 tracking-widest uppercase">
            Carta {indiceActual + 1} de {cartasSobre.length}
          </p>

          {/* CONTENEDOR DE LA CARTA (Con animación Scale-X para simular giro) */}
          <div className="relative perspective-1000 w-80 h-[450px] mx-auto cursor-pointer" onClick={voltearCarta}>
            <div className={`w-full h-full transition-all duration-200 ease-in-out ${estadoGiro === 'girando' ? 'scale-x-0' : 'scale-x-100'}`}>
              
              {/* DORSO DE LA CARTA */}
              {estadoGiro === 'dorso' && (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black border-4 border-gray-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-gray-900/50 hover:shadow-yellow-500/20 transition-shadow">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto border-4 border-gray-500 rotate-45 flex items-center justify-center mb-6">
                      <span className="text-4xl font-black -rotate-45 text-gray-500">FT</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-600 tracking-widest">HAZ CLIC</p>
                  </div>
                </div>
              )}

              {/* FRENTE DE LA CARTA (Dinámico según rareza) */}
              {estadoGiro === 'frente' && (
                <div className={`w-full h-full bg-gradient-to-br ${ESTILOS_RAREZA[cartaActual.rareza]} border-4 rounded-2xl p-4 flex flex-col shadow-2xl`}>
                  
                  <div className="flex justify-between items-start mb-4 border-b border-white/20 pb-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest opacity-80">{cartaActual.edicion}</p>
                      <h2 className="text-2xl font-black uppercase truncate w-48">{cartaActual.nombre}</h2>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase bg-black/50 px-2 py-1 rounded border border-white/20 mb-1">{cartaActual.posicion}</div>
                      <div className="text-[10px] uppercase tracking-widest opacity-80">{cartaActual.rareza}</div>
                    </div>
                  </div>

                  {/* IMAGEN PLACEHOLDER */}
                  <div className="flex-1 bg-black/40 rounded-lg mb-4 flex items-center justify-center border border-white/10">
                    <p className="text-white/20 font-black text-6xl">[ IMG ]</p>
                  </div>

                  {/* STATS */}
                  <div className="grid grid-cols-2 gap-2 text-sm bg-black/60 p-3 rounded-lg border border-white/10">
                    <div className="flex justify-between"><span>Tiro:</span><span className="font-bold">{cartaActual.stats.tiro}</span></div>
                    <div className="flex justify-between"><span>Defensa:</span><span className="font-bold">{cartaActual.stats.defensa}</span></div>
                    <div className="flex justify-between"><span>Regate:</span><span className="font-bold">{cartaActual.stats.regate}</span></div>
                    <div className="flex justify-between"><span>Visión:</span><span className="font-bold">{cartaActual.stats.vision}</span></div>
                    <div className="flex justify-between"><span>Pase:</span><span className="font-bold">{cartaActual.stats.pase}</span></div>
                    <div className="flex justify-between"><span>Veloc.:</span><span className="font-bold">{cartaActual.stats.velocidad}</span></div>
                    <div className="col-span-2 mt-1 pt-1 border-t border-white/20 flex justify-between text-yellow-400 font-bold">
                      <span>Energía Max:</span><span>{cartaActual.energiaMaxima}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTÓN SIGUIENTE (Solo aparece cuando la carta ya está volteada) */}
          <div className="mt-8 h-12">
            {estadoGiro === 'frente' && (
              <button 
                onClick={siguienteCarta}
                className="bg-white hover:bg-gray-200 text-black font-black px-8 py-3 rounded-full uppercase tracking-widest transition-transform hover:scale-105"
              >
                {indiceActual + 1 < cartasSobre.length ? 'Siguiente Carta' : 'Ver Resumen'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* FASE 3: RESUMEN DEL SOBRE */}
      {fase === 'resumen' && (
        <div className="w-full max-w-6xl text-center">
          <h2 className="text-4xl font-black text-white mb-2 uppercase">Sobres Abiertos</h2>
          <p className="text-gray-400 mb-8">Has obtenido {cartasSobre.length} jugadores. ¡Es hora de armar tu equipo!</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {cartasSobre.map((carta, index) => (
              <div key={index} className={`bg-gradient-to-br ${ESTILOS_RAREZA[carta.rareza]} border-2 rounded-lg p-2 flex flex-col text-left`}>
                <p className="text-[10px] opacity-80 uppercase">{carta.posicion}</p>
                <h3 className="text-sm font-black uppercase truncate mb-2">{carta.nombre}</h3>
                <div className="mt-auto grid grid-cols-2 gap-1 text-[9px] bg-black/50 p-1 rounded">
                  <span>TI: {carta.stats.tiro}</span><span>DE: {carta.stats.defensa}</span>
                  <span>RE: {carta.stats.regate}</span><span>VI: {carta.stats.vision}</span>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setFase('seleccion')}
            className="mt-12 bg-gray-800 hover:bg-gray-700 text-white font-bold border border-gray-600 px-8 py-3 rounded uppercase transition-colors"
          >
            Abrir otro sobre
          </button>
        </div>
      )}

    </main>
  );
}