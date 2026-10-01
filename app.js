const FONDO = 2500;
let db;
const hoy = () => new Date().toISOString().slice(0,10);
const money = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(n)||0);
const fechaLarga = f => new Date(f + 'T12:00').toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

document.getElementById('fecha').textContent = new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});

function openDB(){
  return new Promise((ok,no)=>{
    const r = indexedDB.open('CajaFacilDB',1);
    r.onupgradeneeded = e => {
      const d = e.target.result;
      d.createObjectStore('movimientos',{keyPath:'id',autoIncrement:true});
      d.createObjectStore('cierres',{keyPath:'fecha'});
    };
    r.onsuccess = e => { db = e.target.result; ok(); };
    r.onerror = no;
  });
}
function store(name,mode='readonly'){ return db.transaction(name,mode).objectStore(name); }
function all(name){ return new Promise(ok=>{ const r = store(name).getAll(); r.onsuccess = ()=>ok(r.result || []); }); }
function put(name,val){ return new Promise(ok=>{ const r = store(name,'readwrite').put(val); r.onsuccess = ()=>ok(); }); }
function add(name,val){ return new Promise(ok=>{ const r = store(name,'readwrite').add(val); r.onsuccess = ()=>ok(); }); }

function show(id){
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==='inicio') renderInicio();
  if(id==='historial') renderHist();
  if(id==='resumen') renderResumen('mes');
  if(id==='gasto' || id==='compra') renderMovs();
}

async function movimientosDia(){ return (await all('movimientos')).filter(x=>x.fecha===hoy()); }
async function sumTipo(tipo){ return (await movimientosDia()).filter(x=>x.tipo===tipo).reduce((a,b)=>a + (Number(b.monto)||0),0); }

async function guardarMovimiento(tipo){
  const con = document.getElementById(tipo==='caja'?'gConcepto':'cConcepto');
  const mon = document.getElementById(tipo==='caja'?'gMonto':'cMonto');
  const m = Number(mon.value);
  if(!con.value.trim() || m<=0) return alert('Escribe el concepto y un importe válido.');
  await add('movimientos',{fecha:hoy(),hora:new Date().toISOString(),tipo,concepto:con.value.trim(),monto:m});
  con.value=''; mon.value='';
  await renderMovs();
  await renderInicio();
  await calcularCierre();
  alert('Guardado correctamente.');
}

async function renderMovs(){
  const m = await movimientosDia();
  for(const [id,tipo,vacio] of [['listaGastos','caja','Aún no hay gastos del día.'],['listaCompras','acumulado','Aún no hay compras grandes.']]){
    const a = m.filter(x=>x.tipo===tipo);
    document.getElementById(id).innerHTML = a.length
      ? a.map(x=>`<div class='item'><div>${x.concepto}<small>${new Date(x.hora).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</small></div><b>${money(x.monto)}</b></div>`).join('') + `<div class='total-line'><span>Total</span><span>${money(a.reduce((s,y)=>s+y.monto,0))}</span></div>`
      : `<div class='empty'>${vacio}</div>`;
  }
}

function notaHTML({ventas=0,gastos=0,resultado=0,efectivo=0,tarjeta=0,compras=0,difCaja=null,subtexto=''}={}){
  return `
    <div class='linea'><span class='et'>Venta</span><span class='val'>${money(ventas)}</span></div>
    <div class='linea'><span class='et'>Gastos</span><span class='val'>${money(gastos)}</span></div>
    <div class='linea'><span class='et'>Resultado</span><span class='val ${resultado<0?'neg':'pos'}'>${money(resultado)}</span></div>
    <div class='sub'>
      Efectivo: <b>${money(efectivo)}</b> · Tarjeta: <b>${money(tarjeta)}</b><br>
      Compras grandes: <b>${money(compras)}</b>${difCaja===null?'':`<br>Diferencia de caja: <b class='${difCaja===0?'ok':'danger'}'>${difCaja===0?'✓ Cuadra':money(difCaja)}</b>`}
      ${subtexto?`<br>${subtexto}`:''}
    </div>`;
}

async function renderInicio(){
  const gastos = await sumTipo('caja');
  const compras = await sumTipo('acumulado');
  const ventas = (+vEfectivo.value||0) + (+vTarjeta.value||0);
  const efectivo = +vEfectivo.value||0;
  const tarjeta = +vTarjeta.value||0;
  const resultado = ventas - gastos - compras;
  document.getElementById('notaHoy').innerHTML = notaHTML({
    ventas, gastos, resultado, efectivo, tarjeta, compras,
    subtexto:'Gastos = solo gastos del día. Compras grandes = carne e insumos pagados con dinero acumulado.'
  });
}

async function calcularCierre(){
  const e = +vEfectivo.value||0;
  const t = +vTarjeta.value||0;
  const c = +contado.value||0;
  const g = await sumTipo('caja');
  const compras = await sumTipo('acumulado');
  const esperado = FONDO + e - g;
  const dif = c - esperado;
  const retiro = Math.max(0,c - FONDO);
  const resultado = (e+t) - g - compras;
  document.getElementById('calc').innerHTML = `
    <div class='block-title'>Ventas</div>
    <div class='metric'><span>Ventas en efectivo</span><b>${money(e)}</b></div>
    <div class='metric'><span>Ventas con tarjeta</span><b>${money(t)}</b></div>
    <div class='metric'><span>Venta total</span><b>${money(e+t)}</b></div>

    <div class='block-title'>Gastos</div>
    <div class='metric'><span>Gastos del día (sí afectan caja)</span><b>${money(g)}</b></div>
    <div class='metric'><span>Compras grandes (no afectan caja)</span><b>${money(compras)}</b></div>

    <div class='block-title'>Caja</div>
    <div class='metric'><span>Efectivo esperado</span><b>${money(esperado)}</b></div>
    <div class='metric'><span>Efectivo contado</span><b>${money(c)}</b></div>
    <div class='metric'><span>Diferencia de caja</span><b class='${dif===0?'ok':'danger'}'>${dif===0?'✓ Cuadra':money(dif)}</b></div>
    <div class='metric'><span>Dejar en caja</span><b>${money(FONDO)}</b></div>
    <div class='metric'><span>Retirar</span><b>${money(retiro)}</b></div>

    <div class='block-title'>Resultado</div>
    <div class='metric'><span>Ventas − gastos del día − compras grandes</span><b class='${resultado>=0?'ok':'danger'}'>${money(resultado)}</b></div>`;
  renderInicio();
}

async function cerrarDia(){
  const e = +vEfectivo.value||0;
  const t = +vTarjeta.value||0;
  const c = +contado.value||0;
  if(e+t<=0) return alert('Captura las ventas del día.');
  const g = await sumTipo('caja');
  const compras = await sumTipo('acumulado');
  const esperado = FONDO + e - g;
  await put('cierres',{
    fecha:hoy(),
    efectivo:e,
    tarjeta:t,
    ventaTotal:e+t,
    gastosCaja:g,
    compras,
    resultado:(e+t)-g-compras,
    esperado,
    contado:c,
    diferencia:c-esperado,
    retiro:Math.max(0,c-FONDO)
  });
  vEfectivo.value = '';
  vTarjeta.value = '';
  contado.value = '';
  document.getElementById('calc').innerHTML = '';
  await renderInicio();
  alert('Día guardado en el historial.');
  show('historial');
}

async function renderHist(){
  const c = (await all('cierres')).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  document.getElementById('hist').innerHTML = c.length
    ? c.map(x => `
      <div class='card'>
        <h3>${fechaLarga(x.fecha)}</h3>
        <div class='nota nota-hist'>
          ${notaHTML({ventas:x.ventaTotal,gastos:x.gastosCaja,resultado:x.resultado,efectivo:x.efectivo,tarjeta:x.tarjeta,compras:x.compras,difCaja:x.diferencia})}
        </div>
        <div class='detalle'>
          <div class='block-title'>Caja</div>
          <div class='metric'><span>Fondo fijo</span><b>${money(FONDO)}</b></div>
          <div class='metric'><span>Efectivo esperado</span><b>${money(x.esperado)}</b></div>
          <div class='metric'><span>Efectivo contado</span><b>${money(x.contado)}</b></div>
          <div class='metric'><span>Retirado</span><b>${money(x.retiro)}</b></div>
        </div>
      </div>`).join('')
    : `<div class='empty'>Todavía no hay días cerrados.</div>`;
}

async function renderResumen(periodo){
  const c = await all('cierres');
  const now = new Date();
  const fil = c.filter(x=>{
    const d = new Date(x.fecha+'T12:00');
    if(periodo==='todo') return true;
    if(periodo==='mes') return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    const ini = new Date(now); ini.setDate(now.getDate()-6); ini.setHours(0,0,0,0);
    return d>=ini && d<=now;
  });
  const s = k => fil.reduce((a,b)=>a + (b[k]||0),0);
  const ventas = s('ventaTotal');
  const efectivo = s('efectivo');
  const tarjeta = s('tarjeta');
  const gastos = s('gastosCaja');
  const compras = s('compras');
  const resultado = ventas - gastos - compras;
  const difCaja = s('diferencia');
  document.getElementById('res').innerHTML = `
    <div class='card'>
      <h3>${fil.length} día(s) cerrado(s)</h3>
      <div class='nota'>
        ${notaHTML({ventas,gastos,resultado,efectivo,tarjeta,compras,difCaja,subtexto:'Aquí Gastos = solo gastos del día. El resultado sí toma en cuenta también las compras grandes.'})}
      </div>
    </div>

    <div class='card'>
      <div class='block-title'>Ventas</div>
      <div class='metric'><span>Ventas en efectivo</span><b>${money(efectivo)}</b></div>
      <div class='metric'><span>Ventas con tarjeta</span><b>${money(tarjeta)}</b></div>
      <div class='metric'><span>Ventas totales</span><b>${money(ventas)}</b></div>

      <div class='block-title'>Gastos</div>
      <div class='metric'><span>Gastos del día</span><b>${money(gastos)}</b></div>
      <div class='metric'><span>Compras grandes / insumos</span><b>${money(compras)}</b></div>
      <div class='metric'><span>Gastos totales del negocio</span><b>${money(gastos + compras)}</b></div>

      <div class='block-title'>Caja</div>
      <div class='metric'><span>Diferencia acumulada de caja</span><b class='${difCaja===0?'ok':'danger'}'>${difCaja===0?'✓ Sin diferencia':money(difCaja)}</b></div>

      <div class='block-title'>Ventas vs gastos</div>
      <div class='metric'><span>Resultado del periodo</span><b class='${resultado>=0?'ok':'danger'}'>${money(resultado)}</b></div>
      <p class='hint'>Fórmula del resultado: ventas totales − gastos del día − compras grandes.</p>
    </div>`;
}

async function exportar(){
  const data = {version:2,fecha:new Date().toISOString(),movimientos:await all('movimientos'),cierres:await all('cierres')};
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `caja-facil-respaldo-${hoy()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importar(ev){
  const f = ev.target.files[0];
  if(!f) return;
  try{
    const d = JSON.parse(await f.text());
    if(!confirm('Esto agregará o restaurará los datos del respaldo. ¿Continuar?')) return;
    for(const x of d.movimientos||[]){ const y={...x}; delete y.id; await add('movimientos',y); }
    for(const x of d.cierres||[]){ await put('cierres',x); }
    alert('Respaldo restaurado.');
    renderInicio();
  }catch(e){
    alert('El archivo de respaldo no es válido.');
  }
}

openDB().then(async ()=>{
  await renderInicio();
  await calcularCierre();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
});
