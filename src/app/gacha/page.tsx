'use client';

import { useState } from 'react';
import Link from 'next/link';
import cartasData from '../engine/players.json';
import { CartaBase } from '../engine/types';

const ESTILOS_RAREZA: Record<string, string> = {
  'Normal': 'from-gray-600 to-gray-800 border-gray-500 shadow-[0_0_15px_rgba(107,114,128,0.5)] text-gray-300',
  'Raro': 'from-blue-500 to-blue-900 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.8)] text-blue-200',
  'Epico': 'from-purple-500 to-purple-900 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,1)] text-purple-200',
  'Legendario': 'from-yellow-400 to-yellow-700 border-yellow-300 shadow-[0_0_30px_rgba(234,179,8,1)] text-yellow-100',
  'Top Mundial': 'from-red-600 via-yellow-500 to-red-600 border-red-400 shadow-[0_0_40px_rgba(239,68,68,1)] text-white animate-pulse'
};

export default function GachaSystem() {
  const [fase, setFase] = useState<'seleccion' | 'abriendo' | 'resumen'>('seleccion');
  const [cartasSobre, setCartasSobre] = useState<CartaBase[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  
  const [estadoGiro, setEstadoGiro] = useState<'dorso' | 'girando' | 'frente'>('dorso');
  const [estadoAnimacion, setEstadoAnimacion] = useState<'idle' | 'descartando'>('idle');

  const sobreEquipoZ = (cartasData as CartaBase[]).filter(c => c.edicion === '(Equipo Z)');
  const sobreRivales = (cartasData as CartaBase[]).filter(c => c.edicion === '(Rivales)');

  const abrirSobre = (cartas: CartaBase[]) => {
    const cartasMezcladas = [...cartas].sort(() => Math.random() - 0.5);
    setCartasSobre(cartasMezcladas);
    
    // NUEVO: Guardamos la colección en la memoria del navegador
    localStorage.setItem('miColeccion', JSON.stringify(cartasMezcladas));

    setIndiceActual(0);
    setEstadoGiro('dorso');
    setEstadoAnimacion('idle');
    setFase('abriendo');
  };

  const handleCardClick = () => {
    if (estadoAnimacion === 'descartando') return;
    if (estadoGiro === 'dorso') {
      setEstadoGiro('girando');
      setTimeout(() => setEstadoGiro('frente'), 150);
    } else if (estadoGiro === 'frente') {
      siguienteCarta();
    }
  };

  const siguienteCarta = () => {
    if (indiceActual + 1 < cartasSobre.length) {
      setEstadoAnimacion('descartando');
      setTimeout(() => {
        setIndiceActual(prev => prev + 1);
        setEstadoGiro('dorso');
        setEstadoAnimacion('idle');
      }, 300);
    } else {
      setFase('resumen');
    }
  };

  const cartaActual = cartasSobre[indiceActual];
  const cartaSiguiente = indiceActual + 1 < cartasSobre.length ? cartasSobre[indiceActual + 1] : null;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-200 font-mono flex flex-col items-center justify-center p-8 overflow-hidden">
      
      <div className="absolute top-4 left-4 z-50">
        <Link href="/" className="text-gray-500 hover:text-white border border-gray-700 px-4 py-2 rounded transition-colors bg-gray-900">
          ← Volver al Tablero
        </Link>
      </div>

      {fase === 'seleccion' && (
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl font-black text-white mb-4 tracking-widest">TIENDA DE CARTAS</h1>
          <p className="text-xl text-gray-400 mb-12">Elige tu Sobre Inicial. Esto definirá la base de tu equipo.</p>
          
          <div className="flex gap-8 justify-center">
            <button onClick={() => abrirSobre(sobreEquipoZ)} className="group relative w-64 h-96 bg-gradient-to-br from-blue-900 to-black border-4 border-blue-600 rounded-xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] hover:-translate-y-4 transition-all duration-300">
              <h2 className="text-3xl font-black text-blue-400 mb-2">SOBRE</h2>
              <h3 className="text-2xl font-bold text-white mb-8">EQUIPO Z</h3>
              <p className="text-gray-400 text-sm px-4">Contiene 11 jugadores del mítico Equipo Z. Alta sinergia ofensiva.</p>
            </button>

            <button onClick={() => abrirSobre(sobreRivales)} className="group relative w-64 h-96 bg-gradient-to-br from-red-900 to-black border-4 border-red-600 rounded-xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:-translate-y-4 transition-all duration-300">
              <h2 className="text-3xl font-black text-red-400 mb-2">SOBRE</h2>
              <h3 className="text-2xl font-bold text-white mb-8">RIVALES</h3>
              <p className="text-gray-400 text-sm px-4">Contiene jugadores brutales. Bestias individuales con stats altos.</p>
            </button>
          </div>
        </div>
      )}

      {fase === 'abriendo' && cartaActual && (
        <div className="text-center">
          <p className="text-gray-500 mb-16 tracking-widest uppercase">
            Carta {indiceActual + 1} de {cartasSobre.length}
          </p>

          <div className="relative perspective-1000 w-80 h-[450px] mx-auto group">
            {cartaSiguiente && (
              <div className={`absolute inset-0 transform translate-x-4 translate-y-2 rotate-3 transition-all duration-300
                              bg-gradient-to-br ${ESTILOS_RAREZA[cartaSiguiente.rareza]} border-4 rounded-2xl flex items-center justify-center opacity-80 shadow-2xl z-0`}>
                <div className="w-[95%] h-[97%] bg-gray-950 rounded-xl flex items-center justify-center border border-white/5">
                   <span className="text-4xl font-black text-white/5 -rotate-45">FT</span>
                </div>
              </div>
            )}

            <div 
              onClick={handleCardClick}
              className={`absolute inset-0 z-10 cursor-pointer transition-all duration-300 ease-out origin-bottom-left
                          ${estadoGiro === 'frente' ? 'group-hover:-translate-x-20 group-hover:-rotate-6 group-hover:-translate-y-4 shadow-[20px_20px_40px_rgba(0,0,0,0.8)]' : 'hover:scale-105'}
                          ${estadoAnimacion === 'descartando' ? '-translate-x-[200%] rotate-[-30deg] opacity-0' : ''}`}
            >
              <div className={`w-full h-full transition-transform duration-150 ease-in-out ${estadoGiro === 'girando' ? 'scale-x-0' : 'scale-x-100'}`}>
                
                {estadoGiro === 'dorso' && (
                  <div className={`w-full h-full bg-gradient-to-br ${ESTILOS_RAREZA[cartaActual.rareza]} border-4 rounded-2xl flex items-center justify-center shadow-2xl`}>
                    <div className="w-[95%] h-[97%] bg-gray-950 rounded-xl flex flex-col items-center justify-center border border-white/10 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/5 opacity-50"></div>
                      <span className="text-6xl font-black text-white/10 -rotate-45 mb-6">FT</span>
                      <p className="text-lg font-bold text-white/30 tracking-widest animate-pulse border border-white/20 px-4 py-1 rounded-full">TOCA PARA GIRAR</p>
                    </div>
                  </div>
                )}

                {estadoGiro === 'frente' && (
                  <div className={`w-full h-full bg-gradient-to-br ${ESTILOS_RAREZA[cartaActual.rareza]} border-4 rounded-2xl p-4 flex flex-col shadow-2xl bg-gray-900`}>
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

                    <div className="flex-1 bg-black/40 rounded-lg mb-4 flex items-center justify-center border border-white/10 relative overflow-hidden">
                       <p className="text-white/20 font-black text-6xl z-10">[ IMG ]</p>
                    </div>

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
          </div>
        </div>
      )}

      {fase === 'resumen' && (
        <div className="w-full max-w-6xl text-center z-10 relative">
          <h2 className="text-4xl font-black text-white mb-2 uppercase">¡Colección Guardada!</h2>
          <p className="text-gray-400 mb-8">Has obtenido {cartasSobre.length} jugadores. Tus cartas están listas.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
            {cartasSobre.map((carta, index) => (
              <div key={index} className={`bg-gradient-to-br ${ESTILOS_RAREZA[carta.rareza]} border-2 rounded-lg p-2 flex flex-col text-left hover:scale-105 transition-transform`}>
                <p className="text-[10px] opacity-80 uppercase">{carta.posicion}</p>
                <h3 className="text-sm font-black uppercase truncate mb-2">{carta.nombre}</h3>
                <div className="mt-auto grid grid-cols-2 gap-1 text-[9px] bg-black/60 p-1 rounded">
                  <span>TI: {carta.stats.tiro}</span><span>DE: {carta.stats.defensa}</span>
                  <span>RE: {carta.stats.regate}</span><span>VI: {carta.stats.vision}</span>
                </div>
              </div>
            ))}
          </div>

          {/* NUEVO BOTÓN: Enviar al creador de equipos */}
          <Link href="/team" className="bg-blue-600 hover:bg-blue-500 text-white font-black text-2xl px-12 py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all hover:scale-105">
            ARMAR MI EQUIPO ➔
          </Link>
        </div>
      )}
    </main>
  );
}