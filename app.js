const FONDO=2500; let db; let operacionDatos=false;
const hoy=()=>new Date().toISOString().slice(0,10); const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(n)||0); const fechaLarga=f=>new Date(f+'T12:00').toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
document.getElementById('fecha').textContent=new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});
function openDB(){return new Promise((ok,no)=>{const r=indexedDB.open('CajaFacilDB',1);r.onupgradeneeded=e=>{const d=e.target.result;if(!d.objectStoreNames.contains('movimientos'))d.createObjectStore('movimientos',{keyPath:'id',autoIncrement:true});if(!d.objectStoreNames.contains('cierres'))d.createObjectStore('cierres',{keyPath:'fecha'});};r.onsuccess=e=>{db=e.target.result;ok()};r.onerror=no})} function st(n,m='readonly'){return db.transaction(n,m).objectStore(n)} function all(n){return new Promise(ok=>{const r=st(n).getAll();r.onsuccess=()=>ok(r.result||[])})} function put(n,v){return new Promise(ok=>{const r=st(n,'readwrite').put(v);r.onsuccess=()=>ok()})} function add(n,v){return new Promise(ok=>{const r=st(n,'readwrite').add(v);r.onsuccess=()=>ok()})} function del(n,k){return new Promise(ok=>{const r=st(n,'readwrite').delete(k);r.onsuccess=()=>ok()})}
function show(id){document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');if(id==='inicio')renderInicio();if(id==='historial')renderHist();if(id==='resumen')renderResumen('semana');if(['gasto','compra','casa'].includes(id))renderMovs()}
async function movs(fecha=hoy()){return(await all('movimientos')).filter(x=>x.fecha===fecha)} async function sumTipo(tipo,fecha=hoy()){return(await movs(fecha)).filter(x=>x.tipo===tipo).reduce((a,b)=>a+(+b.monto||0),0)}
async function guardarMovimiento(tipo){const map={caja:['gConcepto','gMonto'],acumulado:['cConcepto','cMonto'],casa:['hConcepto','hMonto']};const [ci,mi]=map[tipo],con=document.getElementById(ci),mon=document.getElementById(mi),m=+mon.value;if(!con.value.trim()||m<=0)return alert('Escribe concepto e importe.');await add('movimientos',{fecha:hoy(),hora:new Date().toISOString(),tipo,concepto:con.value.trim(),monto:m});con.value='';mon.value='';await renderMovs();await renderInicio();alert('Guardado.')}
async function renderMovs(){const m=await movs();const cfg=[['listaGastos','caja','Gastos del día'],['listaCompras','acumulado','Compras grandes'],['listaCasa','casa','Gastos de casa']];for(const[id,tipo,tit]of cfg){const el=document.getElementById(id);if(!el)continue;const a=m.filter(x=>x.tipo===tipo);el.innerHTML=a.length?`<div class='mini-titulo'>${tit}</div>`+a.map(x=>`<div class='item'><div>${x.concepto}<small>${money(x.monto)}</small></div><div><button class='editbtn' onclick='editarMovimiento(${x.id})'>✏️ Editar</button><button class='delbtn' onclick='borrarMovimiento(${x.id})'>🗑️</button></div></div>`).join('')+`<div class='total-line'><span>Total</span><span>${money(a.reduce((s,y)=>s+y.monto,0))}</span></div>`:`<div class='empty'>Sin registros.</div>`}}
async function editarMovimiento(id){const a=await all('movimientos'),x=a.find(y=>y.id===id);if(!x)return;const concepto=prompt('Concepto:',x.concepto);if(concepto===null)return;const monto=prompt('Importe:',x.monto);if(monto===null||+monto<=0)return;await put('movimientos',{...x,concepto:concepto.trim()||x.concepto,monto:+monto});await recalcularCierre(x.fecha);await renderMovs();await renderHist();await renderInicio()}
async function borrarMovimiento(id){if(!confirm('¿Eliminar este registro?'))return;const a=await all('movimientos'),x=a.find(y=>y.id===id);await del('movimientos',id);if(x)await recalcularCierre(x.fecha);await renderMovs();await renderHist();await renderInicio()}
async function datosDia(fecha=hoy()){const m=await movs(fecha),s=t=>m.filter(x=>x.tipo===t).reduce((a,b)=>a+(+b.monto||0),0);const c=(await all('cierres')).find(x=>x.fecha===fecha)||{};const gastos=s('caja'),compras=s('acumulado'),casa=s('casa'),efectivo=+c.efectivo||0,tarjeta=+c.tarjeta||0,ventas=efectivo+tarjeta,resultado=ventas-gastos-compras-casa;return{gastos,compras,casa,efectivo,tarjeta,ventas,resultado,cierre:c}}
function notaHTML(d){return `<div class='linea'><span class='et'>Venta total</span><span class='val'>${money(d.ventas)}</span></div><div class='linea'><span class='et'>Gastos del día</span><span class='val'>${money(d.gastos)}</span></div><div class='linea'><span class='et'>Compra grande</span><span class='val'>${money(d.compras)}</span></div><div class='linea'><span class='et'>Gasto casa</span><span class='val'>${money(d.casa)}</span></div><div class='linea'><span class='et'>Resultado</span><span class='val ${d.resultado<0?'neg':'pos'}'>${money(d.resultado)}</span></div><div class='sub'>Efectivo: <b>${money(d.efectivo)}</b> · Tarjeta: <b>${money(d.tarjeta)}</b></div>`}
async function renderInicio(){document.getElementById('notaHoy').innerHTML=notaHTML(await datosDia())}
async function calcularCierre(){const e=+vEfectivo.value||0,t=+vTarjeta.value||0,c=+contado.value||0,g=await sumTipo('caja'),compras=await sumTipo('acumulado'),casa=await sumTipo('casa'),fondoRestante=FONDO-g,efectivoFisico=fondoRestante+e,disponibleEfectivo=efectivoFisico-FONDO,resultado=e+t-g-compras-casa,dif=c-efectivoFisico;calc.innerHTML=`<div class='block-title'>Fondo fijo</div><div class='metric'><span>Fondo inicial</span><b>${money(FONDO)}</b></div><div class='metric'><span>Gastos chicos pagados</span><b>− ${money(g)}</b></div><div class='metric'><span>Fondo después de gastos</span><b>${money(fondoRestante)}</b></div><div class='metric'><span>Ventas en efectivo</span><b>+ ${money(e)}</b></div><div class='metric'><span>Efectivo que debe haber</span><b>${money(efectivoFisico)}</b></div><div class='metric'><span>Dejar como fondo</span><b>${money(FONDO)}</b></div><div class='metric'><span>Efectivo disponible después de reponer fondo</span><b>${money(disponibleEfectivo)}</b></div><div class='block-title'>Resultado del negocio</div><div class='metric'><span>Venta total</span><b>${money(e+t)}</b></div><div class='metric'><span>− Gastos del día</span><b>${money(g)}</b></div><div class='metric'><span>− Compras grandes</span><b>${money(compras)}</b></div><div class='metric'><span>− Gastos casa</span><b>${money(casa)}</b></div><div class='metric'><span>Resultado</span><b class='${resultado>=0?'ok':'danger'}'>${money(resultado)}</b></div><div class='block-title'>Comprobación física</div><div class='metric'><span>Efectivo contado</span><b>${money(c)}</b></div><div class='metric'><span>Diferencia</span><b class='${dif===0?'ok':'danger'}'>${dif===0?'✓ Cuadra':money(dif)}</b></div>`}
async function cerrarDia(){const e=+vEfectivo.value||0,t=+vTarjeta.value||0,c=+contado.value||0;if(e+t<=0)return alert('Captura las ventas.');const g=await sumTipo('caja'),compras=await sumTipo('acumulado'),casa=await sumTipo('casa'),esperado=FONDO-g+e;await put('cierres',{fecha:hoy(),efectivo:e,tarjeta:t,ventaTotal:e+t,gastosCaja:g,compras,casa,resultado:e+t-g-compras-casa,esperado,contado:c,diferencia:c-esperado});alert('Día guardado/actualizado.');show('historial')}
async function editarCierre(fecha){const cs=await all('cierres'),x=cs.find(y=>y.fecha===fecha);if(!x)return;const e=prompt('Ventas en efectivo:',x.efectivo);if(e===null)return;const t=prompt('Ventas con tarjeta:',x.tarjeta);if(t===null)return;const c=prompt('Efectivo contado:',x.contado);if(c===null)return;const g=await sumTipo('caja',fecha),compras=await sumTipo('acumulado',fecha),casa=await sumTipo('casa',fecha),esperado=FONDO-g+(+e||0);await put('cierres',{...x,efectivo:+e||0,tarjeta:+t||0,ventaTotal:(+e||0)+(+t||0),gastosCaja:g,compras,casa,resultado:(+e||0)+(+t||0)-g-compras-casa,esperado,contado:+c||0,diferencia:(+c||0)-esperado});renderHist();renderInicio()}
async function recalcularCierre(fecha){const cs=await all('cierres'),x=cs.find(y=>y.fecha===fecha);if(!x)return;const g=await sumTipo('caja',fecha),compras=await sumTipo('acumulado',fecha),casa=await sumTipo('casa',fecha),esperado=FONDO-g+x.efectivo;await put('cierres',{...x,gastosCaja:g,compras,casa,resultado:x.efectivo+x.tarjeta-g-compras-casa,esperado,diferencia:x.contado-esperado})}
async function renderHist(){const c=(await all('cierres')).sort((a,b)=>b.fecha.localeCompare(a.fecha));hist.innerHTML=c.length?(await Promise.all(c.map(async x=>{const d=await datosDia(x.fecha),m=await movs(x.fecha);return `<div class='card'><h3>${fechaLarga(x.fecha)}</h3><div class='nota'>${notaHTML(d)}</div><button class='editwide' onclick="editarCierre('${x.fecha}')">✏️ Modificar ventas / efectivo contado</button><div class='detalle'>${m.map(y=>`<div class='item'><div>${y.tipo==='caja'?'🧾':y.tipo==='acumulado'?'🛒':'🏠'} ${y.concepto}<small>${money(y.monto)}</small></div><div><button class='editbtn' onclick='editarMovimiento(${y.id})'>✏️</button><button class='delbtn' onclick='borrarMovimiento(${y.id})'>🗑️</button></div></div>`).join('')}</div></div>`}))).join(''):`<div class='empty'>Sin cierres.</div>`}
async function renderResumen(p){const cs=await all('cierres'),now=new Date(),fil=cs.filter(x=>{const d=new Date(x.fecha+'T12:00');if(p==='todo')return true;if(p==='mes')return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();const ini=new Date(now);ini.setDate(now.getDate()-6);ini.setHours(0,0,0,0);return d>=ini&&d<=now});let tot={efectivo:0,tarjeta:0,ventas:0,gastos:0,compras:0,casa:0,resultado:0};for(const x of fil){const d=await datosDia(x.fecha);Object.keys(tot).forEach(k=>tot[k]+=d[k]||0)}res.innerHTML=`<div class='card'><h3>${p==='semana'?'Últimos 7 días':p==='mes'?'Mes actual':'Todo el historial'}</h3><div class='metric'><span>Ventas efectivo</span><b>${money(tot.efectivo)}</b></div><div class='metric'><span>Ventas tarjeta</span><b>${money(tot.tarjeta)}</b></div><div class='metric'><span>Ventas totales</span><b>${money(tot.ventas)}</b></div><div class='block-title'>Gastos acumulados</div><div class='metric'><span>Gastos del día</span><b>${money(tot.gastos)}</b></div><div class='metric'><span>Compras grandes</span><b>${money(tot.compras)}</b></div><div class='metric'><span>Gastos casa</span><b>${money(tot.casa)}</b></div><div class='metric'><span>Gastos totales</span><b>${money(tot.gastos+tot.compras+tot.casa)}</b></div><div class='block-title'>Resultado</div><div class='metric'><span>Ventas − todos los gastos</span><b class='${tot.resultado>=0?'ok':'danger'}'>${money(tot.resultado)}</b></div></div>`}
async function exportar(){const data={version:4,fecha:new Date().toISOString(),movimientos:await all('movimientos'),cierres:await all('cierres')},blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`caja-facil-respaldo-${hoy()}.json`;a.click();URL.revokeObjectURL(a.href)}
function bloquearDatos(ocupado){
 operacionDatos=ocupado;
 document.getElementById('borrarTodo').disabled=ocupado;
 document.querySelector('#respaldo input[type=file]').disabled=ocupado;
}
async function importar(ev){
 if(!db||operacionDatos)return;
 const f=ev.target.files[0];if(!f)return;
 bloquearDatos(true);
 try{
  const d=JSON.parse(await f.text());
  if(!confirm('¿Restaurar respaldo?'))return;
  for(const x of d.movimientos||[]){const y={...x};delete y.id;await add('movimientos',y)}
  for(const x of d.cierres||[])await put('cierres',x);
  alert('Restaurado.');renderInicio();
 }catch(e){alert('Archivo no válido.');}
 finally{bloquearDatos(false);}
}
async function borrarTodo(){
 const boton=document.getElementById('borrarTodo');
 if(!db||boton.disabled||operacionDatos)return;
 if(!confirm('¿Quieres empezar de nuevo? Se eliminarán todos los gastos, compras y cierres de este dispositivo. Descarga un respaldo antes si quieres conservarlos.'))return;
 const palabra=prompt('Para confirmar, escribe BORRAR. Esta acción elimina todo el historial de este dispositivo.');
 if(palabra===null||palabra.trim().toUpperCase()!=='BORRAR')return;
 bloquearDatos(true);
 try{
  // Un solo cambio: ambos almacenes se vacían juntos o ninguno se modifica.
  await new Promise((ok,no)=>{
   const tx=db.transaction(['movimientos','cierres'],'readwrite');
   tx.oncomplete=()=>ok();
   tx.onabort=()=>no(tx.error||new Error('No se completó el borrado.'));
   tx.objectStore('movimientos').clear();
   tx.objectStore('cierres').clear();
  });
 }catch(e){
  bloquearDatos(false);
  alert('No se pudo borrar el historial. Tus registros se conservaron. Intenta de nuevo.');
  return;
 }
 try{
  document.querySelectorAll('main input').forEach(input=>{input.value='';});
  await Promise.all([renderInicio(),renderMovs(),renderHist(),renderResumen('semana'),calcularCierre()]);
  show('inicio');
  alert('Todo quedó limpio. Ya puedes empezar a capturar de nuevo.');
 }catch(e){
  alert('El historial se borró. Cierra y vuelve a abrir la app para ver los campos limpios.');
 }finally{bloquearDatos(false);}
}
openDB().then(async()=>{await renderInicio();await calcularCierre();bloquearDatos(operacionDatos);if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(r=>r.update()).catch(e=>console.warn('No se pudo actualizar el modo sin conexión.',e))});
