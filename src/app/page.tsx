'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import cartasData from './engine/players.json';
import { CartaBase, JugadorPartido, AccionOfensiva, AccionDefensiva, Posicion, ResultadoDuelo } from './engine/types';
import { resolverDuelo } from './engine/matchEngine';
import { obtenerMultiplicadorFatiga, obtenerFactorDistancia } from './engine/mathEngine';

// --- COMPONENTES VISUALES ---
const TooltipJugador = ({ jugador }: { jugador: JugadorPartido }) => {
  const fatiga = obtenerMultiplicadorFatiga(jugador.energiaActual, jugador.energiaMaxima);
  const renderStat = (n: string, v: number) => {
    const real = Math.floor(v * fatiga);
    return (
      <div className="flex justify-between text-[10px] my-0.5">
        <span className="text-gray-400 capitalize">{n}:</span>
        <span className={`font-bold ${real < v ? 'text-red-400' : 'text-white'}`}>{real}</span>
      </div>
    );
  };
  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-36 bg-gray-950 border border-gray-700 rounded p-2 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      <p className="text-center font-bold text-blue-400 text-xs mb-1 truncate">{jugador.nombre}</p>
      <div className="mb-2">
        <div className="w-full bg-gray-800 h-1.5 rounded overflow-hidden">
          <div className={`h-full ${jugador.energiaActual < 100 ? 'bg-red-500' : 'bg-yellow-400'}`} style={{ width: `${(jugador.energiaActual / jugador.energiaMaxima) * 100}%` }}></div>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-1">
        {renderStat('tiro', jugador.stats.tiro)}{renderStat('regate', jugador.stats.regate)}{renderStat('vision', jugador.stats.vision)}
        {renderStat('pase', jugador.stats.pase)}{renderStat('defensa', jugador.stats.defensa)}{renderStat('velocidad', jugador.stats.velocidad)}
      </div>
    </div>
  );
};

export default function TableroPartido() {
  // Estados Globales del Partido
  const [fase, setFase] = useState<'cargando' | 'colocacion' | 'jugando' | 'error'>('cargando');
  const [momentos, setMomentos] = useState(40);
  const [log, setLog] = useState<string[]>([]);
  const [marcador, setMarcador] = useState({ local: 0, visitante: 0 });
  const [turno, setTurno] = useState<'Local' | 'Visita'>('Local');
  
  // Equipos y Colocación
  const [saqueLocal, setSaqueLocal] = useState(true);
  const [bancaColocacion, setBancaColocacion] = useState<CartaBase[]>([]);
  const [cartaAColocar, setCartaAColocar] = useState<CartaBase | null>(null);
  
  const [equipoLocal, setEquipoLocal] = useState<JugadorPartido[]>([]);
  const [equipoVisita, setEquipoVisita] = useState<JugadorPartido[]>([]);
  
  // Físicas y Selecciones
  const [poseedorBalon, setPoseedorBalon] = useState<string | 'nadie'>('nadie');
  const [posicionBalon, setPosicionBalon] = useState<Posicion>({ x: 3, y: 4 });
  const [idSeleccionado, setIdSeleccionado] = useState<string | null>(null);
  const [modoAccion, setModoAccion] = useState<'mover' | 'pasar' | 'tirar'>('mover');
  const [trayectoriaHover, setTrayectoriaHover] = useState<Posicion[]>([]);

  const anchosFilas = [1, 6, 6, 6, 6, 6, 6, 6, 1];

  const [dueloActivo, setDueloActivo] = useState<{
    atacante: JugadorPartido; defensor: JugadorPartido;
    iniciadoPor: 'Local' | 'Visita'; fase: 'seleccion' | 'calculo' | 'resultado';
    accionAtacante?: AccionOfensiva; accionDefensor?: AccionDefensiva;
    resultado?: ResultadoDuelo; distancia: number;
  } | null>(null);

  const agregarLog = (m: string) => setLog(p => [m, ...p]);

  // --- INICIALIZACIÓN (Moneda y Generación de IA) ---
  useEffect(() => {
    const stored = localStorage.getItem('miEquipoTitular');
    if (!stored) {
      setFase('error');
      return;
    }
    
    const titulares = JSON.parse(stored) as CartaBase[];
    setBancaColocacion(titulares);

    // Generar Equipo IA Válido (1 Portero, + 7 aleatorios)
    const dbPorteros = cartasData.filter(c => c.posicion === 'Portero');
    const dbOtros = cartasData.filter(c => c.posicion !== 'Portero');
    
    const aiGK = dbPorteros[Math.floor(Math.random() * dbPorteros.length)] as CartaBase;
    const aiOtros = dbOtros.sort(() => 0.5 - Math.random()).slice(0, 7) as CartaBase[];
    const aiTeam = [aiGK, ...aiOtros];

    // Posiciones estáticas aleatorias para la IA en su lado del campo (y=1 a y=3)
    const posicionesIA: Posicion[] = [{ x: 0, y: 0 }]; // Portero
    const celdasDisponibles = [];
    for (let y = 1; y <= 3; y++) {
      for (let x = 0; x < 6; x++) celdasDisponibles.push({x, y});
    }
    celdasDisponibles.sort(() => 0.5 - Math.random());
    
    const jugadoresIA = aiTeam.map((carta, index): JugadorPartido => {
      const pos = index === 0 ? posicionesIA[0] : celdasDisponibles[index - 1];
      // Pequeño hack: Le agregamos '-ia' al id para evitar duplicados si usan la misma carta
      return { ...carta, id: carta.id + '-ia', equipo: 'Visitante', energiaActual: carta.energiaMaxima, posicion: pos };
    });

    setEquipoVisita(jugadoresIA);

    // Lanza la moneda
    const ganaLocal = Math.random() > 0.5;
    setSaqueLocal(ganaLocal);
    setTurno(ganaLocal ? 'Local' : 'Visita');
    
    if (ganaLocal) {
      agregarLog("🪙 Ganaste el sorteo. Tienes el saque inicial.");
      setPoseedorBalon('nadie'); // Se asignará a quien pongas en el centro
    } else {
      agregarLog("🪙 El rival ganó el sorteo y saca primero.");
      const aiSaque = jugadoresIA[1]; // Un jugador X de la IA
      setPoseedorBalon(aiSaque.id);
      setPosicionBalon(aiSaque.posicion);
    }
    
    setFase('colocacion');
  }, []);

  // --- HERRAMIENTAS ESPACIALES ---
  const obtenerAdyacentes = (pos: Posicion) => {
    return [
      {x: pos.x, y: pos.y-1}, {x: pos.x, y: pos.y+1}, {x: pos.x-1, y: pos.y}, {x: pos.x+1, y: pos.y},
      {x: pos.x-1, y: pos.y-1}, {x: pos.x+1, y: pos.y-1}, {x: pos.x-1, y: pos.y+1}, {x: pos.x+1, y: pos.y+1}
    ].filter(p => p.y >= 0 && p.y < anchosFilas.length && p.x >= 0 && p.x < anchosFilas[p.y]);
  };

  const calcularRuta = (inicio: Posicion, fin: Posicion): Posicion[] => {
    const ruta: Posicion[] = [];
    let actX = inicio.x; let actY = inicio.y;
    while (actX !== fin.x || actY !== fin.y) {
      actX += Math.sign(fin.x - actX);
      actY += Math.sign(fin.y - actY);
      ruta.push({ x: actX, y: actY });
    }
    return ruta;
  };

  // --- LÓGICA DE CLICS EN CANCHA ---
  const handleCeldaClick = (x: number, y: number) => {
    if (dueloActivo) return;

    // FASE 1: COLOCACIÓN DE EQUIPO
    if (fase === 'colocacion') {
      if (!cartaAColocar) return;
      
      // Regla: No encimar jugadores
      if (equipoLocal.some(j => j.posicion.x === x && j.posicion.y === y)) return;

      // Regla Portero Local
      if (cartaAColocar.posicion === 'Portero' && (x !== 0 || y !== 8)) {
        agregarLog("⚠️ El Portero debe ir en la casilla de arco (abajo)."); return;
      }
      
      // Regla Saque Central: El primer jugador DEBE ir al centro si ganaste la moneda
      const esPrimerJugador = equipoLocal.length === 0;
      if (esPrimerJugador && saqueLocal && (x !== 3 || y !== 4)) {
        agregarLog("⚠️ Ganaste el saque. Tu primer jugador debe ir al Círculo Central."); return;
      }

      // Regla Zona Local: Solo puedes colocar en tu mitad (y >= 4)
      if (y < 4 && cartaAColocar.posicion !== 'Portero') {
        agregarLog("⚠️ Solo puedes colocar jugadores en tu lado del campo."); return;
      }

      // Colocación exitosa
      const nuevoJugador: JugadorPartido = { ...cartaAColocar, equipo: 'Local', energiaActual: cartaAColocar.energiaMaxima, posicion: { x, y } };
      setEquipoLocal([...equipoLocal, nuevoJugador]);
      setBancaColocacion(bancaColocacion.filter(c => c.id !== cartaAColocar.id));
      setCartaAColocar(null);

      // Asignar balón si es el centro
      if (esPrimerJugador && saqueLocal) {
        setPoseedorBalon(nuevoJugador.id);
        setPosicionBalon({ x, y });
      }

      // Terminar fase si colocó a todos
      if (bancaColocacion.length === 1) {
        agregarLog("✅ Equipo colocado. ¡Arranca el partido!");
        setFase('jugando');
      }
      return;
    }

    // FASE 2: JUGANDO (Acciones Tácticas)
    if (fase === 'jugando' && turno === 'Local') {
      const jugadorLocalTarget = equipoLocal.find(j => j.posicion.x === x && j.posicion.y === y);
      const jugadorVisitaTarget = equipoVisita.find(j => j.posicion.x === x && j.posicion.y === y);

      // 1. Seleccionar propio jugador
      if (jugadorLocalTarget) {
        setIdSeleccionado(idSeleccionado === jugadorLocalTarget.id ? null : jugadorLocalTarget.id);
        setModoAccion('mover'); setTrayectoriaHover([]);
        return;
      }

      // 2. Acciones si hay un jugador seleccionado
      if (idSeleccionado) {
        const jugadorActivo = equipoLocal.find(j => j.id === idSeleccionado)!;

        // A) Moverse
        if (modoAccion === 'mover' && obtenerAdyacentes(jugadorActivo.posicion).some(p => p.x === x && p.y === y)) {
          const nuevaEnergia = Math.max(0, jugadorActivo.energiaActual - 10);
          
          // Actualizar posición
          setEquipoLocal(prev => prev.map(j => j.id === idSeleccionado ? { ...j, energiaActual: nuevaEnergia, posicion: {x, y} } : j));
          if (poseedorBalon === idSeleccionado) setPosicionBalon({ x, y });

          // Revisar si chocó contra un rival (Duelo Directo)
          if (jugadorVisitaTarget) {
            const atacante = poseedorBalon === idSeleccionado ? { ...jugadorActivo, posicion: {x,y} } : jugadorVisitaTarget;
            const defensor = poseedorBalon === idSeleccionado ? jugadorVisitaTarget : { ...jugadorActivo, posicion: {x,y} };
            setDueloActivo({ atacante, defensor, iniciadoPor: 'Local', fase: 'seleccion', distancia: 1 });
          } else {
            // Si pisó un balón suelto, lo recoge
            if (poseedorBalon === 'nadie' && posicionBalon.x === x && posicionBalon.y === y) {
              setPoseedorBalon(idSeleccionado); agregarLog(`⚽ ${jugadorActivo.nombre} recoge el balón suelto.`);
            }
            setIdSeleccionado(null);
            setTurno('Visita');
          }
        } 
        
        // B) Pasar o Tirar
        else if (modoAccion === 'pasar' || (modoAccion === 'tirar' && x === 0 && y === 0)) {
          const ruta = calcularRuta(jugadorActivo.posicion, { x, y });
          const distancia = ruta.length;
          
          // Verificar intercepción enemiga en la trayectoria
          const rivalEnMedio = equipoVisita.find(v => ruta.some(p => p.x === v.posicion.x && p.y === v.posicion.y));

          if (rivalEnMedio) {
            agregarLog(`⚠️ ¡${rivalEnMedio.nombre} intercepta el tiro/pase!`);
            const accionOfe = modoAccion === 'pasar' ? 'Pase' : 'Tiro';
            const res = resolverDuelo(jugadorActivo, accionOfe, rivalEnMedio, 'Bloqueo', distancia);
            setDueloActivo({ atacante: jugadorActivo, defensor: rivalEnMedio, iniciadoPor: 'Local', fase: 'calculo', accionAtacante: accionOfe, accionDefensor: 'Bloqueo', resultado: res, distancia });
          } else {
            // Acción limpia
            if (modoAccion === 'pasar') {
              setPosicionBalon({ x, y });
              // Si el pase cae en un compañero
              if (jugadorLocalTarget) {
                setPoseedorBalon(jugadorLocalTarget.id);
                agregarLog(`👟 Pase exitoso a ${jugadorLocalTarget.nombre}.`);
              } else {
                setPoseedorBalon('nadie');
                agregarLog(`👟 Pase al espacio en [${x}, ${y}].`);
              }
            } else {
              setMarcador(prev => ({...prev, local: prev.local + 1}));
              agregarLog(`⚽ ¡GOL DE ${jugadorActivo.nombre}!`);
              // Reset de saque para la visita
              setPoseedorBalon(equipoVisita[1].id);
              setPosicionBalon(equipoVisita[1].posicion);
            }
            setIdSeleccionado(null);
            setTurno('Visita');
          }
        }
      }
    }
  };

  // --- IA DEL RIVAL (Simple y Funcional) ---
  const ejecutarTurnoVisita = () => {
    // Busca quién tiene el balón
    let jugadorActivoIA = equipoVisita.find(v => v.id === poseedorBalon);
    
    // Si la IA no tiene el balón, activa al jugador más cercano al balón (simplificado al index 1 por ahora para evitar cálculos pesados en esta prueba)
    if (!jugadorActivoIA) jugadorActivoIA = equipoVisita[1];

    const objetivo = poseedorBalon === 'nadie' ? posicionBalon : (poseedorBalon === jugadorActivoIA.id ? { x: 0, y: 8 } : equipoLocal.find(l => l.id === poseedorBalon)?.posicion || posicionBalon);
    
    // Mover 1 casilla hacia el objetivo
    const dirY = Math.sign(objetivo.y - jugadorActivoIA.posicion.y);
    const dirX = Math.sign(objetivo.x - jugadorActivoIA.posicion.x);
    let nuevaY = jugadorActivoIA.posicion.y + dirY; let nuevaX = jugadorActivoIA.posicion.x + dirX;

    // Limitar bordes
    if (nuevaY < 0) nuevaY = 0; if (nuevaY > 8) nuevaY = 8;
    const maxFila = anchosFilas[nuevaY];
    if (nuevaX < 0) nuevaX = 0; if (nuevaX >= maxFila) nuevaX = maxFila - 1;

    // Chequear choque con local
    const rivalLocal = equipoLocal.find(l => l.posicion.x === nuevaX && l.posicion.y === nuevaY);
    
    const jugadorActualizado = { ...jugadorActivoIA, energiaActual: Math.max(0, jugadorActivoIA.energiaActual - 8), posicion: { x: nuevaX, y: nuevaY } };
    setEquipoVisita(prev => prev.map(v => v.id === jugadorActualizado.id ? jugadorActualizado : v));
    
    if (poseedorBalon === jugadorActivoIA.id) setPosicionBalon({ x: nuevaX, y: nuevaY });

    if (rivalLocal) {
      // DUELO!
      const atacante = poseedorBalon === jugadorActivoIA.id ? jugadorActualizado : rivalLocal;
      const defensor = poseedorBalon === jugadorActivoIA.id ? rivalLocal : jugadorActualizado;
      setDueloActivo({ atacante, defensor, iniciadoPor: 'Visita', fase: 'seleccion', distancia: 1 });
    } else {
      setTurno('Local');
    }
  };

  useEffect(() => {
    if (fase !== 'jugando' || turno !== 'Visita' || dueloActivo) return;
    const tId = window.setTimeout(() => ejecutarTurnoVisita(), 800);
    return () => window.clearTimeout(tId);
  }, [turno, dueloActivo, fase]);

  // --- RESOLUCIÓN DE DUELOS ---
  const manejarEleccionUsuario = (accion: string) => {
    if (!dueloActivo) return;
    let accAtaque: AccionOfensiva; let accDefensa: AccionDefensiva;

    // Determinar si el Local es Atacante o Defensor
    const localEsAtacante = equipoLocal.some(l => l.id === dueloActivo.atacante.id);

    if (localEsAtacante) {
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
      agregarLog(`🔄 ${dueloActivo.defensor.nombre} robó el balón.`);
    } else if (res.resolucion.includes('Rebote')) {
      const ady = obtenerAdyacentes(dueloActivo.defensor.posicion);
      const rebote = ady[Math.floor(Math.random() * ady.length)];
      setPosicionBalon(rebote); setPoseedorBalon('nadie');
      agregarLog(`🎲 Balón suelto en [${rebote.x}, ${rebote.y}].`);
    }

    setMomentos(prev => prev - 1);
    setTurno(dueloActivo.iniciadoPor === 'Local' ? 'Visita' : 'Local');
    setDueloActivo(null);
  };

  if (fase === 'error') return <div className="p-10 text-center font-bold text-white"><p>No tienes un equipo titular.</p><Link href="/team" className="text-blue-400">Ir a la Pizarra Técnica</Link></div>;

  const jugadorActivoStats = equipoLocal.find(j => j.id === idSeleccionado);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-300 p-2 font-mono relative">
      
      {/* MODAL DE DUELO */}
      {dueloActivo && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
          {dueloActivo.fase === 'seleccion' && (
            <>
              <h2 className="text-4xl text-yellow-500 font-bold mb-8 animate-pulse tracking-widest">
                {equipoLocal.some(l => l.id === dueloActivo.atacante.id) ? 'ATAQUE LOCAL' : 'DEFENSA LOCAL'}
              </h2>
              <div className="flex gap-4">
                {equipoLocal.some(l => l.id === dueloActivo.atacante.id) ? (
                  <><button onClick={() => manejarEleccionUsuario('Regate')} className="bg-blue-600 px-6 py-4 rounded text-white font-bold text-xl">🏃 Regate</button>
                    <button onClick={() => manejarEleccionUsuario('Pase')} className="bg-green-600 px-6 py-4 rounded text-white font-bold text-xl">👟 Pase</button>
                    <button onClick={() => manejarEleccionUsuario('Tiro')} className="bg-red-600 px-6 py-4 rounded text-white font-bold text-xl">⚽ Tiro</button></>
                ) : (
                  <><button onClick={() => manejarEleccionUsuario('Entrada')} className="bg-blue-600 px-6 py-4 rounded text-white font-bold text-xl">🛑 Entrada</button>
                    <button onClick={() => manejarEleccionUsuario('Intercepcion')} className="bg-green-600 px-6 py-4 rounded text-white font-bold text-xl">👁️ Intercep.</button>
                    <button onClick={() => manejarEleccionUsuario('Bloqueo')} className="bg-red-600 px-6 py-4 rounded text-white font-bold text-xl">🧱 Bloqueo</button></>
                )}
              </div>
            </>
          )}

          {dueloActivo.fase === 'calculo' && (
            <div className="text-center w-full max-w-4xl">
              <div className="flex justify-between gap-8 mb-10">
                <div className="flex-1 bg-gray-900 p-6 rounded-xl border border-blue-500">
                  <p className="text-xl text-blue-400 font-bold">{dueloActivo.atacante.nombre}</p>
                  <p className="text-gray-400 mb-4">{dueloActivo.accionAtacante}</p>
                  <div className="text-5xl font-black text-white">{dueloActivo.resultado?.poderAtacante}</div>
                </div>
                <div className="flex-1 bg-gray-900 p-6 rounded-xl border border-red-500">
                  <p className="text-xl text-red-400 font-bold">{dueloActivo.defensor.nombre}</p>
                  <p className="text-gray-400 mb-4">{dueloActivo.accionDefensor}</p>
                  <div className="text-5xl font-black text-white">{dueloActivo.resultado?.poderDefensor}</div>
                </div>
              </div>
              <button onClick={() => setDueloActivo({ ...dueloActivo, fase: 'resultado' })} className="bg-yellow-500 text-black font-black py-4 px-12 rounded">REVELAR</button>
            </div>
          )}

          {dueloActivo.fase === 'resultado' && (
            <div className="text-center">
              <h2 className="text-5xl font-black mb-4 text-white uppercase">{dueloActivo.resultado?.ganador === 'Atacante' ? '💥 ATAQUE GANA' : '🛡️ DEFENSA GANA'}</h2>
              <p className="text-2xl text-yellow-400 mb-8">{dueloActivo.resultado?.resolucion}</p>
              <button onClick={aplicarConsecuencia} className="bg-white text-black font-black py-4 px-12 rounded">CONTINUAR</button>
            </div>
          )}
        </div>
      )}

      {/* UI PRINCIPAL */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4">
        
        {/* PANEL IZQUIERDO: CANCHA Y MARCADOR */}
        <div className="flex-1">
          {fase === 'jugando' && (
            <div className="flex justify-between bg-gray-900 p-3 rounded border border-gray-700 mb-2 items-center">
              <div className="text-center flex-1"><p className="text-blue-400 font-bold text-xl">LOCAL</p><p className="text-3xl font-black text-white">{marcador.local}</p></div>
              <div className="text-center flex-1 border-x border-gray-700 px-2"><p className="text-yellow-400 font-bold text-xl">{momentos} ⏱️</p><p className="text-xs text-gray-400">Turno: {turno}</p></div>
              <div className="text-center flex-1"><p className="text-red-400 font-bold text-xl">VISITA</p><p className="text-3xl font-black text-white">{marcador.visitante}</p></div>
            </div>
          )}

          {/* Menú de Acción */}
          {fase === 'jugando' && (
            <div className="h-12 mb-2">
              {idSeleccionado && poseedorBalon === idSeleccionado && (
                <div className="flex justify-center gap-2 bg-gray-900 p-1.5 rounded border border-blue-900">
                  <button onClick={() => setModoAccion('mover')} className={`px-4 py-1 text-sm font-bold rounded ${modoAccion === 'mover' ? 'bg-blue-600 text-white' : 'bg-gray-800'}`}>Moverse</button>
                  <button onClick={() => setModoAccion('pasar')} className={`px-4 py-1 text-sm font-bold rounded ${modoAccion === 'pasar' ? 'bg-blue-600 text-white' : 'bg-gray-800'}`}>Pasar</button>
                  <button onClick={() => setModoAccion('tirar')} className={`px-4 py-1 text-sm font-bold rounded ${modoAccion === 'tirar' ? 'bg-blue-600 text-white' : 'bg-gray-800'}`}>Tirar</button>
                </div>
              )}
            </div>
          )}

          {/* TABLERO */}
          <div className="bg-[#1a2e1a] p-2 rounded-xl border-4 border-white/20 relative mx-auto w-fit shadow-2xl">
            {/* Círculo Central Decorativo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/20 rounded-full pointer-events-none"></div>
            <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-white/20 pointer-events-none"></div>

            {anchosFilas.map((ancho, y) => (
              <div key={`fila-${y}`} className="flex justify-center gap-1 mb-1">
                {Array.from({ length: ancho }).map((_, x) => {
                  const jLocal = equipoLocal.find(j => j.posicion.x === x && j.posicion.y === y);
                  const jVisita = equipoVisita.find(j => j.posicion.x === x && j.posicion.y === y);
                  const balonAqui = posicionBalon.x === x && posicionBalon.y === y;
                  
                  // Lógica Visual
                  const esCentro = x === 3 && y === 4;
                  const enTrayectoria = trayectoriaHover.some(p => p.x === x && p.y === y);
                  let esValida = false;
                  
                  if (fase === 'colocacion' && cartaAColocar) {
                     if (cartaAColocar.posicion === 'Portero') esValida = x === 0 && y === 8;
                     else if (equipoLocal.length === 0 && saqueLocal) esValida = esCentro;
                     else esValida = y >= 4 && y < 8; // Mitad local (y >= 4 excluyendo arco local)
                  } else if (fase === 'jugando' && idSeleccionado) {
                     if (modoAccion === 'mover') esValida = obtenerAdyacentes(equipoLocal.find(j=>j.id===idSeleccionado)!.posicion).some(p => p.x === x && p.y === y);
                     if (modoAccion === 'pasar') esValida = !jLocal;
                     if (modoAccion === 'tirar') esValida = (y === 0 && x === 0);
                  }

                  return (
                    <button
                      key={`celda-${x}-${y}`} 
                      onClick={() => handleCeldaClick(x, y)}
                      onMouseEnter={() => fase === 'jugando' && setTrayectoriaHover(calcularRuta(equipoLocal.find(j=>j.id===idSeleccionado)?.posicion || {x,y}, {x,y}))}
                      onMouseLeave={() => setTrayectoriaHover([])}
                      className={`w-12 h-12 sm:w-14 sm:h-14 border border-white/10 flex items-center justify-center relative transition-colors group
                        ${esCentro && fase === 'colocacion' && equipoLocal.length === 0 && saqueLocal ? 'ring-4 ring-yellow-400 bg-yellow-400/20 animate-pulse' : ''}
                        ${enTrayectoria ? 'bg-green-500/50' : 'bg-black/20 hover:bg-white/10'}
                        ${esValida && fase === 'colocacion' ? 'cursor-cell bg-blue-500/20 border-blue-400' : ''}
                        ${esValida && fase === 'jugando' && modoAccion === 'mover' ? 'cursor-pointer bg-yellow-500/30' : ''}
                        ${jLocal && idSeleccionado === jLocal.id ? 'ring-2 ring-white bg-blue-600/50' : ''}`}
                    >
                      {/* Célsped rayado (Trivial) */}
                      <div className="absolute inset-0 bg-gradient