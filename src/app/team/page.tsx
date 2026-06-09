'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CartaBase } from '../engine/types';

const ESTILOS_RAREZA: Record<string, string> = {
  'Normal': 'border-gray-500 bg-gray-800 text-gray-300',
  'Raro': 'border-blue-400 bg-blue-900/50 text-blue-200',
  'Epico': 'border-purple-400 bg-purple-900/50 text-purple-200',
  'Legendario': 'border-yellow-300 bg-yellow-900/50 text-yellow-100',
  'Top Mundial': 'border-red-400 bg-red-900/50 text-white shadow-[0_0_10px_red]'
};

export default function TeamBuilder() {
  const [coleccion, setColeccion] = useState<CartaBase[]>([]);
  const [titulares, setTitulares] = useState<CartaBase[]>([]);
  const [reservas, setReservas] = useState<CartaBase[]>([]);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // 1. Cargar la colección guardada en el Gacha al iniciar la página
  useEffect(() => {
    const dataGuardada = localStorage.getItem('miColeccion');
    if (dataGuardada) {
      setColeccion(JSON.parse(dataGuardada));
    }
  }, []);

  // --- REGLAS DE VALIDACIÓN ---
  const validarIngreso = (cartaNueva: CartaBase) => {
    const equipoCompleto = [...titulares, ...reservas];
    
    // Regla 1: No nombres duplicados
    if (equipoCompleto.some(c => c.nombre === cartaNueva.nombre)) {
      return "No puedes tener dos jugadores con el mismo nombre.";
    }

    // Regla 2: Límites de Rareza
    const cuenta = { 'Top Mundial': 0, 'Legendario': 0, 'Epico': 0 };
    equipoCompleto.forEach(c => {
      if (c.rareza === 'Top Mundial' || c.rareza === 'Legendario' || c.rareza === 'Epico') {
        cuenta[c.rareza]++;
      }
    });

    if (cartaNueva.rareza === 'Top Mundial' && cuenta['Top Mundial'] >= 1) return "Límite: Máximo 1 Top Mundial.";
    if (cartaNueva.rareza === 'Legendario' && cuenta['Legendario'] >= 2) return "Límite: Máximo 2 Legendarias.";
    if (cartaNueva.rareza === 'Epico' && cuenta['Epico'] >= 3) return "Límite: Máximo 3 Épicas.";

    return null; // Todo correcto
  };

  const agregarAlEquipo = (carta: CartaBase) => {
    const error = validarIngreso(carta);
    if (error) {
      mostrarError(error);
      return;
    }

    // Regla 3: Posiciones y Límites de Campo (8 Titulares, 3 Reservas)
    if (titulares.length < 8) {
      // Si es portero, y ya hay uno de titular, lo mandamos a reserva
      if (carta.posicion === 'Portero' && titulares.some(c => c.posicion === 'Portero')) {
         if (reservas.length < 3) setReservas([...reservas, carta]);
         else mostrarError("La reserva también está llena.");
      } else {
         setTitulares([...titulares, carta]);
      }
    } else if (reservas.length < 3) {
      setReservas([...reservas, carta]);
    } else {
      mostrarError("Tu equipo ya tiene los 11 jugadores requeridos.");
    }
  };

  const removerDeTitulares = (id: string) => {
    setTitulares(titulares.filter(c => c.id !== id));
  };

  const removerDeReservas = (id: string) => {
    setReservas(reservas.filter(c => c.id !== id));
  };

  const mostrarError = (msg: string) => {
    setMensajeError(msg);
    setTimeout(() => setMensajeError(null), 3000);
  };

  // --- VALIDACIÓN FINAL PARA PODER JUGAR ---
  const porCount = titulares.filter(c => c.posicion === 'Portero').length;
  const defCount = titulares.filter(c => c.posicion === 'Defensa').length;
  const medCount = titulares.filter(c => c.posicion === 'Mediocampo').length;
  const delCount = titulares.filter(c => c.posicion === 'Delantero').length;

  const equipoListoParaJugar = 
    titulares.length === 8 && 
    reservas.length === 3 && 
    porCount === 1 && defCount >= 1 && medCount >= 1 && delCount >= 1;

  const guardarEquipoYJugar = () => {
    if (!equipoListoParaJugar) return;
    localStorage.setItem('miEquipoTitular', JSON.stringify(titulares));
    localStorage.setItem('miEquipoReserva', JSON.stringify(reservas));
    window.location.href = '/'; // Redirige al tablero de juego
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-200 font-mono p-4 flex flex-col lg:flex-row gap-6">
      
      {/* MENSAJE DE ERROR FLOTANTE */}
      {mensajeError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded font-bold shadow-2xl z-50 animate-bounce">
          ⚠️ {mensajeError}
        </div>
      )}

      {/* PANEL IZQUIERDO: COLECCIÓN */}
      <section className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col h-[95vh]">
        <h2 className="text-2xl font-black text-white mb-4 uppercase flex justify-between items-center">
          Tu Colección
          <Link href="/gacha" className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded">Abrir Sobres</Link>
        </h2>
        
        {coleccion.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
            <p className="mb-4">No tienes cartas aún.</p>
            <Link href="/gacha" className="bg-white text-black px-4 py-2 font-bold rounded">Ir a la Tienda</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-2 pb-10">
            {coleccion.map(carta => {
              const estaEnEquipo = titulares.some(c => c.id === carta.id) || reservas.some(c => c.id === carta.id);
              return (
                <div 
                  key={carta.id} 
                  onClick={() => !estaEnEquipo && agregarAlEquipo(carta)}
                  className={`border-2 rounded p-2 text-sm transition-all
                             ${ESTILOS_RAREZA[carta.rareza]} 
                             ${estaEnEquipo ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'}`}
                >
                  <p className="text-[10px] opacity-80 uppercase">{carta.posicion}</p>
                  <h3 className="font-bold truncate">{carta.nombre}</h3>
                  <div className="flex justify-between text-[10px] mt-2 opacity-80">
                    <span>{carta.rareza}</span>
                    <span className="font-bold text-yellow-400">EN: {carta.energiaMaxima}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PANEL DERECHO: LA PIZARRA TÉCNICA */}
      <section className="flex-1 lg:max-w-lg flex flex-col gap-4 h-[95vh]">
        
        {/* REQUISITOS DEL EQUIPO */}
        <div className={`p-4 rounded-xl border-2 transition-colors ${equipoListoParaJugar ? 'bg-green-900/30 border-green-500' : 'bg-gray-900 border-gray-700'}`}>
          <h2 className="text-lg font-black uppercase mb-2">Requisitos de Formación</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mb-4">
            <div className={titulares.length === 8 ? 'text-green-400' : ''}>• 8 Titulares ({titulares.length}/8)</div>
            <div className={reservas.length === 3 ? 'text-green-400' : ''}>• 3 Reservas ({reservas.length}/3)</div>
            <div className={porCount === 1 ? 'text-green-400' : (porCount > 1 ? 'text-red-400' : '')}>• Exactamente 1 Portero ({porCount}/1)</div>
            <div className={defCount >= 1 ? 'text-green-400' : ''}>• Mín. 1 Defensa ({defCount})</div>
            <div className={medCount >= 1 ? 'text-green-400' : ''}>• Mín. 1 Mediocampo ({medCount})</div>
            <div className={delCount >= 1 ? 'text-green-400' : ''}>• Mín. 1 Delantero ({delCount})</div>
          </div>
          
          <button 
            onClick={guardarEquipoYJugar}
            disabled={!equipoListoParaJugar}
            className={`w-full py-3 font-black text-xl rounded uppercase transition-all
              ${equipoListoParaJugar ? 'bg-green-500 hover:bg-green-400 text-black shadow-[0_0_15px_green] animate-pulse' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
          >
            {equipoListoParaJugar ? 'ENTRAR A LA CANCHA' : 'Faltan Requisitos'}
          </button>
        </div>

        {/* TITULARES (El 8 inicial) */}
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col overflow-hidden">
          <h2 className="text-xl font-black text-blue-400 mb-2 uppercase border-b border-gray-800 pb-2">
            El 8 Inicial ({titulares.length}/8)
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {titulares.map(carta => (
              <div key={carta.id} onClick={() => removerDeTitulares(carta.id)} className={`flex justify-between items-center p-2 rounded border cursor-pointer hover:bg-red-900/30 hover:border-red-500 transition-colors ${ESTILOS_RAREZA[carta.rareza]}`}>
                <div>
                  <span className="text-xs bg-black/50 px-2 py-0.5 rounded mr-2 uppercase">{carta.posicion}</span>
                  <span className="font-bold">{carta.nombre}</span>
                </div>
                <span className="text-xs opacity-50 uppercase">Quitar ✖</span>
              </div>
            ))}
            {titulares.length === 0 && <p className="text-sm text-gray-600 text-center mt-4">Haz clic en una carta de tu colección para añadirla.</p>}
          </div>
        </div>

        {/* RESERVAS (La Banca) */}
        <div className="h-48 bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
          <h2 className="text-xl font-black text-yellow-400 mb-2 uppercase border-b border-gray-800 pb-2">
            La Banca ({reservas.length}/3)
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {reservas.map(carta => (
              <div key={carta.id} onClick={() => removerDeReservas(carta.id)} className={`flex justify-between items-center p-2 rounded border cursor-pointer hover:bg-red-900/30 hover:border-red-500 transition-colors ${ESTILOS_RAREZA[carta.rareza]}`}>
                <div>
                  <span className="text-xs bg-black/50 px-2 py-0.5 rounded mr-2 uppercase">{carta.posicion}</span>
                  <span className="font-bold">{carta.nombre}</span>
                </div>
                <span className="text-xs opacity-50 uppercase">Quitar ✖</span>
              </div>
            ))}
          </div>
        </div>

      </section>
    </main>
  );
}