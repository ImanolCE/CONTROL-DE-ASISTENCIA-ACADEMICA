const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(cors());

app.use(express.json());

// --- 1. CONEXIÓN BASE DE DATOS ---
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'classaccess',
    waitForConnections: true,
    connectionLimit: 10
});

db.getConnection((err) => {
    if(err) console.error('❌ Error BD:', err.message);
    else console.log(' BD Conectada Correctamente');
});

// --- VARIABLES GLOBALES IOT ---
let tarjetaPendiente = null; 
let tiempoEspera = null;      
let timerInput = null;        
let timerBorrarAbajo = null; 
let loopReloj = null;        
let inputBuffer = "";        

// --- 2. CONEXIÓN IOT ---
let port = null;
let ultimaMacDetectada = null;
let pantallaInicialMostrada = false;

async function conectarArduino() {

    //  Cerrar sesiones activas al iniciar servidor
    db.query(
        "UPDATE sesiones SET fecha_fin = NOW()",
        () => {
            console.log("Sesiones previas cerradas al iniciar sistema");
            activarLaboratorioBase();
        }
    );

    //  Bootstrap MAC desde BD (sin esperar BOOT)
    await new Promise((resolve) => cargarMacDispositivoDefault(() => resolve()));

    //  Cerrar sesiones activas al iniciar servidor
    db.query(
        "UPDATE sesiones SET fecha_fin = NOW()",
        () => {
            console.log("Sesiones previas cerradas al iniciar sistema");
            activarLaboratorioBase();
        }
    );


    const ports = await SerialPort.list();
    const arduinoInfo = ports.find(p => p.manufacturer && (p.manufacturer.includes('Arduino') || p.manufacturer.includes('wch.cn')));
    const path = arduinoInfo ? arduinoInfo.path : '/dev/ttyUSB0'; 

    console.log(`🔌 Intentando conectar IoT en: ${path}`);

    port = new SerialPort({ path: path, baudRate: 115200, autoOpen: false });
    
    port.open((err) => {
        inputBuffer = "";
        tarjetaPendiente = null;
        if (timerInput) clearTimeout(timerInput);
        if (tiempoEspera) clearTimeout(tiempoEspera);
        if (timerBorrarAbajo) clearTimeout(timerBorrarAbajo);

        if (err) {
            console.log(` No se pudo abrir ${path}. Modo Web Only.`);
        } else {
            console.log(` IoT Conectado Exitosamente en ${path}`);
            // Pintar sin esperar RFID/BOOT
            pantallaInicialMostrada = true;     
            enviarTimeUnix();                   
            setTimeout(() => restaurarPantallaReposo(), 2000);
        }
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' })); // \r
    
    parser.on('data', (raw) => {

        //console.log("RAW SERIAL:", raw);

        try {
            //const data = JSON.parse(raw); 
            const clean = raw.toString().trim();
            const data = JSON.parse(clean);
                if (data.mac) {
                    ultimaMacDetectada = data.mac;
                        //  primera vez que detectamos MAC => pinta LAB sin esperar nada
                    if (!pantallaInicialMostrada) {
                        pantallaInicialMostrada = true;
                        enviarTimeUnix(); // si el firmware lo soporta, quita “Connecting to Server”
                        setTimeout(() => restaurarPantallaReposo(), 200);

                        if (!globalThis.__timeSync24h) {
                            globalThis.__timeSync24h = setInterval(() => enviarTimeUnix(), 24 * 60 * 60 * 1000);
                        }
                    }
                }

                if (data.type === "BOOT" && data.mac) {
                    ultimaMacDetectada = data.mac;

                    // 1) Sincroniza reloj (barra superior)
                    enviarTimeUnix();

                    // 2) Mostrar LAB de inmediato (pantalla base)
                    setTimeout(() => restaurarPantallaReposo(), 200);

                    // 3) Re-sincronizar cada 24h (como pide el doc)
                    if (!globalThis.__timeSync24h) {
                         globalThis.__timeSync24h = setInterval(() => enviarTimeUnix(), 24 * 60 * 60 * 1000);
                    }

                    return; // BOOT no debe pasar a lógica de RFID/KEYPAD
                }


            procesarDatosIoT(data);
            
        } catch (e) {
            console.log(" JSON inválido:", raw);
        }
    });
}
conectarArduino();

// --- 3. FUNCIONES DE PANTALLA ---
/* function enviarMensaje(texto, cmd) {
    //console.log("ENVIANDO A OLED:", texto);
    if (port && port.isOpen) {
        let textoFinal = texto.toString().substring(0, 21);
        port.write(JSON.stringify({ type: "MSG", text: textoFinal, cmd: cmd || "2" }) + "\n");
    }
} */

function enviarMensaje(texto, row = 0) {
    if (port?.isOpen && ultimaMacDetectada) {

        const mensaje = {
            type: "MSG",
            mac: ultimaMacDetectada,
            text: texto,
            row: row
        };

        port.write(JSON.stringify(mensaje) + "\n");
        console.log("ENVIANDO JSON A OLED:", mensaje);
    }
}

function enviarTimeUnix(unix = Math.floor(Date.now() / 1000)) {
  if (port?.isOpen && ultimaMacDetectada) {
    const msg = { type: "TIME", mac: ultimaMacDetectada, unix };
    port.write(JSON.stringify(msg) + "\n");
    console.log("ENVIANDO TIME:", msg);
  }
}

function enviarSonido(cmd) {
    if (port && port.isOpen) {
        port.write(JSON.stringify({ type: "CMD", cmd: cmd }) + "\n");
    }
}

function actualizarOLED(linea, texto) {
    if (!port || !port.isOpen) return;
    const cmd = linea.toString();
    port.write(JSON.stringify({ type: "MSG", text: "                     ", cmd: cmd }) + "\n");
    setTimeout(() => { enviarMensaje(texto, cmd); }, 50);
}

// 🔥 MODIFICADO: Ahora acepta un tercer parámetro 'duracion' (por defecto 3000ms)
function mensajeTemporalAbajo(texto, sound, duracion = 3000) {
    actualizarOLED(2, texto);
    if (sound) enviarSonido(sound);
    if (timerBorrarAbajo) clearTimeout(timerBorrarAbajo);
    
    // Usamos la duración personalizada
    timerBorrarAbajo = setTimeout(() => {
        actualizarOLED(2, "");

        //  Si estamos en LABORATORIO, restaurar prompt
        db.query(
            `SELECT tipo_sesion, id_profesor 
            FROM sesiones 
            WHERE fecha_fin > NOW() 
            ORDER BY id_sesion DESC 
            LIMIT 1`,
            (err, r) => {
                //  si es LABORATORIO o el "profe LAB" (id 6), repinta prompt
                if (r?.length && (r[0].tipo_sesion === "LABORATORIO" || r[0].id_profesor === 6)) {
                enviarMensaje("Ingrese Matricula", "2");
                }
            }
            );
    }, duracion);
}

// --- 4. PANTALLA REPOSO ---
function restaurarPantallaReposo() {

    if (loopReloj) clearTimeout(loopReloj);

    const sql = `
        SELECT s.id_sesion, s.fecha_inicio, s.tipo_sesion, p.shortname
        FROM sesiones s
        JOIN profesores p ON s.id_profesor = p.id_profesor
        WHERE s.fecha_fin > NOW()
        ORDER BY s.id_sesion DESC
        LIMIT 1
    `;

    db.query(sql, (err, res) => {

        // 🔵 NO HAY SESIÓN → MODO LAB BASE
        if (!res || !res.length) {
            // Pantalla LAB base (sin reloj)
            enviarMensaje("LAB INTEL", "0");        // grande (10 chars)
            enviarMensaje("Modo LAB", "1");         // pequeño
            enviarMensaje("Ingrese Matricula", "2");// pequeño abajo
            loopReloj = null;
            return;
        }

        const { fecha_inicio, tipo_sesion, shortname } = res[0];

        //  LABORATORIO → SIN CONTADOR
        if (tipo_sesion === "LABORATORIO") {
            // LABORATORIO: SIN contador, SIN loop
            loopReloj = null;

            enviarMensaje("LAB INTEL", "0");        
            enviarMensaje("Modo LAB", "1");
            enviarMensaje("Ingrese Matricula", "2");
            return;
        }

        // 🟢 SOLO CLASE Y ASESORIA LLEVAN RELOJ
        const inicio = new Date(fecha_inicio);
        const ahora = new Date();
        const limite = 15 * 60 * 1000;
        const diff = ahora - inicio;
        const restante = limite - diff;

        let textoBase = tipo_sesion === "ASESORIA"
            ? `Asesoria ${shortname}`
            : `Clase ${shortname}`;

        if (restante > 0) {
            const m = Math.floor(restante / 60000);
            const s = Math.floor((restante % 60000) / 1000);
            const reloj = `${m}:${s < 10 ? '0' : ''}${s}`;
            enviarMensaje(`${textoBase} ${reloj}`, "1");
            loopReloj = setTimeout(restaurarPantallaReposo, 1000);
        } else {
            enviarMensaje(textoBase, "1");
            loopReloj = null;
        }

    });
}

// --- BOOTSTRAP MAC DESDE BD (sin tocar Arduino) ---
function cargarMacDispositivoDefault(callback) {
  // Escoge el primer dispositivo del laboratorio (puedes filtrar por nombre_salon)
  const sql = `SELECT mac_address, nombre_salon FROM dispositivos ORDER BY id_dispositivo ASC LIMIT 1`;

  db.query(sql, (err, rows) => {
    if (err) {
      console.log(" No se pudo leer tabla dispositivos:", err.message);
      return callback(null);
    }
    if (!rows?.length) {
      console.log(" Tabla dispositivos vacía. No hay MAC para bootstrap.");
      return callback(null);
    }

    const mac = rows[0].mac_address;
    console.log(" MAC bootstrap desde BD:", mac, "|", rows[0].nombre_salon);

    // Setea MAC para poder mandar MSG/TIME desde el arranque
    ultimaMacDetectada = mac;
    callback(mac);
  });
}

// --- 5. LÓGICA DE NEGOCIO IOT ---
function procesarDatosIoT(data) {
    if (data.type === "RFID") {
        const uid = data.uid.replace(/[^A-F0-9]/g, '');
        inputBuffer = ""; 
        if (timerInput) clearTimeout(timerInput); 
        actualizarOLED(2, ""); 
        verificarTarjeta(uid);
    }
    else if (data.type === "KEYPAD") {
        enviarSonido("BUZZ_KEY"); 
        const k = data.key || data.id;
        if (timerInput) clearTimeout(timerInput);
        
        if (k === '#') { 
            procesarCodigo(inputBuffer); 
            inputBuffer = ""; 
        } 
        else if (k === '*') { 
            if (inputBuffer.length > 0) { 
                inputBuffer = inputBuffer.slice(0, -1); 
                enviarMensaje(inputBuffer, "2"); 
                iniciarTimerLimpieza(); 
            } 
            else { 
                // 🔥 MODIFICADO: Usamos mensajeTemporalAbajo con 2000ms (2 segundos)
                mensajeTemporalAbajo("Borrado", null, 2000); 
            }
            if (tarjetaPendiente) iniciarTimerEspera(); 
        } 
        else { 
            inputBuffer += k; 
            enviarMensaje(inputBuffer, "2"); 
            iniciarTimerLimpieza(); 
            if (tarjetaPendiente) iniciarTimerEspera(); 
        }
    }
}

function iniciarTimerLimpieza() {
    if (timerInput) clearTimeout(timerInput);
    timerInput = setTimeout(() => { 
        inputBuffer = ""; 
        mensajeTemporalAbajo("Tiempo Agotado", "BUZZ_ERR"); 
        tarjetaPendiente = null;
        if (tiempoEspera) clearTimeout(tiempoEspera); 
    }, 10000);
}

function iniciarTimerEspera() {
    if (tiempoEspera) clearTimeout(tiempoEspera);
    tiempoEspera = setTimeout(() => { 
        mensajeTemporalAbajo("Tiempo Agotado", "BUZZ_ERR"); 
        tarjetaPendiente = null; 
        inputBuffer = ""; 
        if (timerInput) clearTimeout(timerInput); 
    }, 15000);
}

function procesarCodigo(codigo) {
    if (!codigo) return;
    codigo = codigo.trim();
    if (tarjetaPendiente) autoRegistrar(tarjetaPendiente, codigo);
    else if (codigo === "999" || codigo === "000") gestionarModoSesion(codigo);
    else if (codigo === 'ADMIN' || codigo.length <= 6) gestionarClase(codigo);
    else registrarAsistencia(codigo, "TECLADO"); 
}

// --- 6. FUNCIONES ESPECÍFICAS IOT ---
function verificarTarjeta(uid) {
    db.query('SELECT matricula FROM alumnos WHERE rfid_uid = ?', [uid], (err, res) => {
        if (res.length > 0) { 
            registrarAsistencia(res[0].matricula, "RFID"); 
            tarjetaPendiente = null; 
        } 
        else { 
            mensajeTemporalAbajo("Tarjeta Nueva", "BUZZ_KEY");
            tarjetaPendiente = uid;
            iniciarTimerEspera(); 

            setTimeout(() => {
                if (timerBorrarAbajo) clearTimeout(timerBorrarAbajo); 
                enviarMensaje("Teclee Matricula", "2"); 
                iniciarTimerLimpieza(); 
            }, 2000);
        }
    });
}

function autoRegistrar(uid, matricula) {
    if (!matricula.startsWith('20') || matricula.length !== 10) { mensajeTemporalAbajo("ID Invalido", "BUZZ_ERR"); return; }
    db.query('SELECT matricula, rfid_uid FROM alumnos WHERE matricula = ?', [matricula], (e, r) => {
        if (r.length > 0 && r[0].rfid_uid) { mensajeTemporalAbajo("Ya Vinculada", "BUZZ_ERR"); tarjetaPendiente = null; if (tiempoEspera) clearTimeout(tiempoEspera); return; }
        const query = r.length > 0 ? 'UPDATE alumnos SET rfid_uid = ? WHERE matricula = ?' : 'INSERT INTO alumnos (matricula, rfid_uid, nombre) VALUES (?, ?, ?)';
        const params = r.length > 0 ? [uid, matricula] : [matricula, uid, 'Nuevo Estudiante'];
        db.query(query, params, (err) => {
            if (err) mensajeTemporalAbajo("Error BD", "BUZZ_ERR");
            else { mensajeTemporalAbajo("Vinculado OK", "BUZZ_OK"); setTimeout(() => registrarAsistencia(matricula, "RFID"), 2000); }
            tarjetaPendiente = null; if (tiempoEspera) clearTimeout(tiempoEspera);
        });
    });
}


function gestionarClase(codigo) {

    db.query(
        "SELECT * FROM sesiones WHERE fecha_fin > NOW() ORDER BY id_sesion DESC LIMIT 1",
        (err, sesionActiva) => {

            db.query(
                "SELECT * FROM profesores WHERE num_empleado = ?",
                [codigo],
                (err2, profe) => {

                    if (!profe.length) {
                        registrarAsistencia(codigo, "TECLADO");
                        return;
                    }

                    const idProfe = profe[0].id_profesor;
                    const nombre = profe[0].shortname;

                    if (!sesionActiva.length) {
                        crearSesion(idProfe, nombre, "CLASE");
                        return;
                    }

                    const sesion = sesionActiva[0];

                    // 🔵 SI ES LABORATORIO → CAMBIAR A CLASE
                    if (sesion.tipo_sesion === "LABORATORIO") {

                        db.query(
                            "UPDATE sesiones SET fecha_fin = NOW() WHERE id_sesion = ?",
                            [sesion.id_sesion],
                            () => crearSesion(idProfe, nombre, "CLASE")
                        );
                        return;
                    }

                    //  MISMO PROFESOR → CERRAR
                    if (sesion.id_profesor === idProfe) {

                        db.query(
                            "UPDATE sesiones SET fecha_fin = NOW() WHERE id_sesion = ?",
                            [sesion.id_sesion],
                            () => {
                                mensajeTemporalAbajo("Sesion Finalizada", "BUZZ_OK");
                                activarLaboratorioBase();
                            }
                        );
                        return;
                    }

                    // 🟡 OTRO PROFESOR
                    db.query(
                        "UPDATE sesiones SET fecha_fin = NOW() WHERE id_sesion = ?",
                        [sesion.id_sesion],
                        () => crearSesion(idProfe, nombre, "CLASE")
                    );

                }
            );
        }
    );
}


function gestionarModoSesion(codigo) {

    db.query(
        "SELECT * FROM sesiones WHERE fecha_fin > NOW() ORDER BY id_sesion DESC LIMIT 1",
        (err, res) => {

            if (!res.length) return;

            const sesion = res[0];

            if (sesion.tipo_sesion === "LABORATORIO") return;

            if (codigo === "999" && sesion.tipo_sesion === "CLASE") {

                db.query(
                    "UPDATE sesiones SET tipo_sesion = 'ASESORIA' WHERE id_sesion = ?",
                    [sesion.id_sesion],
                    () => {
                        mensajeTemporalAbajo("Modo Asesoria", "BUZZ_OK");
                        restaurarPantallaReposo();
                    }
                );
            }

            if (codigo === "000" && sesion.tipo_sesion === "ASESORIA") {

                db.query(
                    "UPDATE sesiones SET tipo_sesion = 'CLASE' WHERE id_sesion = ?",
                    [sesion.id_sesion],
                    () => {
                        mensajeTemporalAbajo("Modo Clase", "BUZZ_OK");
                        restaurarPantallaReposo();
                    }
                );
            }

        }
    );
}

function getAsignacionDefaultProfesor(id_profesor, id_cuatrimestre, callback) {
  db.query(
    `SELECT aa.id_asignacion
     FROM asignaciones_academicas aa
     WHERE aa.id_profesor = ?
       AND aa.id_cuatrimestre = ?
       AND aa.activo = 1
     ORDER BY aa.id_asignacion ASC
     LIMIT 1`,
    [id_profesor, id_cuatrimestre],
    (err, rows) => {
      if (err) return callback(err, null);
      if (!rows.length) return callback(null, null);
      callback(null, rows[0].id_asignacion);
    }
  );
}

function crearSesion(id_profesor, nombre, tipo = "CLASE") {
    getCuatrimestreActualId((err, id_cuatrimestre) => {

        if (err || !id_cuatrimestre) {
            mensajeTemporalAbajo("Error Cuatri", "BUZZ_ERR");
            return;
        }

        getAsignacionDefaultProfesor(id_profesor, id_cuatrimestre, (err2, id_asignacion) => {

            if (err2) {
                mensajeTemporalAbajo("Error Asign", "BUZZ_ERR");
                return;
            }

            db.query(
                `INSERT INTO sesiones 
                (id_profesor, id_cuatrimestre, id_asignacion, tipo_sesion, fecha_inicio, fecha_fin) 
                VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
                [id_profesor, id_cuatrimestre, id_asignacion, tipo],
                (err3) => {
                    if (err3) {
                        console.error(err3);
                        mensajeTemporalAbajo("Error BD", "BUZZ_ERR");
                    } else {
                        mensajeTemporalAbajo(`Sesion ${tipo} iniciada`, "BUZZ_OK");
                    }
                }
            );

        });
    });
}

function crearSesionLaboratorio(callback) {

    getCuatrimestreActualId((err, id_cuatrimestre) => {

        if (err || !id_cuatrimestre) {
            console.error("Error obteniendo cuatrimestre actual");
            return callback(false);
        }

        const ID_PROF_LAB = 6; // 

        db.query(
            `INSERT INTO sesiones 
            (id_profesor, id_cuatrimestre, id_asignacion, tipo_sesion, fecha_inicio, fecha_fin) 
            VALUES (?, ?, NULL, 'LABORATORIO', NOW(), '2099-12-31 23:59:59')`,
            [ID_PROF_LAB, id_cuatrimestre],
            (err) => {
                if (err) {
                    console.error("Error creando sesión LAB:", err);
                    return callback(false);
                }

                console.log("Sesión LABORATORIO creada automáticamente");
                callback(true);
            }
        );

    });
}

function activarLaboratorioBase() {

    crearSesionLaboratorio((ok) => {
        if (ok) {
            console.log("LABORATORIO base activo correctamente");
            setTimeout(restaurarPantallaReposo, 1000);
        } else {
            console.log("Error activando LAB base");
        }
    });

}


function registrarAsistencia(matricula, metodo) {

    if (!matricula.startsWith('20') || matricula.length !== 10) {
        mensajeTemporalAbajo("ID Invalido", "BUZZ_ERR");
        return;
    }

    db.query(
        `SELECT id_sesion, id_profesor, id_cuatrimestre, fecha_inicio, fecha_fin, tipo_sesion
         FROM sesiones
         WHERE fecha_fin > NOW()
         ORDER BY id_sesion DESC
         LIMIT 1`,
        (err, resSesion) => {

            if (err) {
                console.error(err);
                mensajeTemporalAbajo("Error BD", "BUZZ_ERR");
                return;
            }

            if (!resSesion.length) {
                mensajeTemporalAbajo("Sin Sesion Activa", "BUZZ_ERR");
                return;
            }

            //const { id_sesion, fecha_inicio } = resSesion[0];
            const { id_sesion, id_profesor, id_cuatrimestre, fecha_inicio } = resSesion[0];

            // 🔥 validar tolerancia
            const inicio = new Date(fecha_inicio);
            const ahora = new Date();
            const diffMinutos = (ahora - inicio) / 60000;

            if (resSesion[0].tipo_sesion !== "LABORATORIO") {
                if (diffMinutos > 15) {
                    mensajeTemporalAbajo("Tolerancia Fin", "BUZZ_ERR");
                    return;
                }
            }

            // 🔥 verificar si ya registró asistencia
            db.query(
                `SELECT * FROM asistencia_alumnos 
                 WHERE id_sesion = ? AND matricula = ?`,
                [id_sesion, matricula],
                (err, duplicado) => {

                    if (duplicado.length > 0) {
                        mensajeTemporalAbajo("Ya Asistio", "BUZZ_KEY");
                        return;
                    }

                    // 🔥 insertar asistencia
                    db.query(
                        `INSERT INTO asistencia_alumnos 
                        (id_sesion, matricula, hora_llegada, metodo)
                        VALUES (?, ?, CURTIME(), ?)`,
                        [id_sesion, matricula, metodo],
                        (err) => {

                            if (err) {
                                console.error(err);
                                mensajeTemporalAbajo("Error BD", "BUZZ_ERR");
                                return;
                            }

                            //  asegurar inscripción del alumno en el cuatrimestre actual del profesor
                            db.query(
                                `INSERT IGNORE INTO inscripciones 
                                (id_profesor, id_cuatrimestre, matricula, fecha_inscripcion)
                                VALUES (?, ?, ?, NOW())`,
                                [id_profesor, id_cuatrimestre, matricula],
                                (errIns) => {
                                    if (errIns) {
                                        console.error("Error inscribiendo alumno:", errIns);
                                    }
                                }
                            );

                            mensajeTemporalAbajo("Asistencia OK", "BUZZ_OK", 6000);
                        }
                    );
                }
            );
        }
    );
}


// --- HELPERS CUATRIMESTRE ---
function getCuatrimestreActualId(callback) {
  db.query(`SELECT id FROM cuatrimestres WHERE es_actual = 1 ORDER BY id DESC LIMIT 1`, (err, rows) => {
    if (err) return callback(err, null);
    if (!rows?.length) return callback(null, null);
    callback(null, rows[0].id);
  });
}



// --- 7. RUTAS API  ---

app.post('/api/login', (req, res) => {
    const { num_empleado, password } = req.body;
    const query = num_empleado === 'ADMIN' ? 'SELECT * FROM profesores WHERE num_empleado = ? AND password = ?' : 'SELECT * FROM profesores WHERE num_empleado = ?';
    const params = num_empleado === 'ADMIN' ? [num_empleado, password] : [num_empleado];
    db.query(query, params, (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        if (result.length > 0) res.json({ success: true, profesor: result[0] });
        else res.status(401).json({ success: false, message: "Credenciales incorrectas" });
    });
});

app.post('/api/profesores', (req, res) => {
    const { nombre, apellidos, shortname, num_empleado, email, password } = req.body;
    db.query("INSERT INTO profesores (nombre, apellidos, shortname, num_empleado, email, password) VALUES (?, ?, ?, ?, ?, ?)", [nombre, apellidos, shortname || nombre.split(' ')[0], num_empleado, email, password || null], (e) => {
        if(e) return res.status(500).json({success: false, error: e.message});
        res.json({success: true});
    });
});

app.get('/api/admin/profesores', (req, res) => { 
    db.query('SELECT * FROM profesores ORDER BY nombre ASC', (e, r) => { if(e) return res.status(500).json({error:e.message}); res.json({ success: true, data: r }); });
});

app.get('/api/admin/todos-alumnos', (req, res) => { 
    db.query('SELECT * FROM alumnos ORDER BY nombre ASC', (e, r) => { if(e) return res.status(500).json({error:e.message}); res.json({ success: true, data: r }); });
});

app.get('/api/admin/alumnos-por-profesor', (req, res) => {
    const sql = `SELECT p.id_profesor, p.nombre, p.apellidos, a.id_alumno, a.matricula, a.nombre as nombre_alumno, a.rfid_uid FROM profesores p LEFT JOIN inscripciones i ON p.id_profesor = i.id_profesor LEFT JOIN alumnos a ON i.matricula = a.matricula ORDER BY p.nombre ASC`;
    db.query(sql, (err, results) => {
        if(err) return res.status(500).json({error:err.message});
        const grupos = {};
        results.forEach(row => {
            if (!grupos[row.id_profesor]) grupos[row.id_profesor] = { id_profesor: row.id_profesor, nombre: row.nombre, apellidos: row.apellidos, alumnos: [] };
            if (row.id_alumno) grupos[row.id_profesor].alumnos.push({ id_alumno: row.id_alumno, matricula: row.matricula, nombre: row.nombre_alumno, rfid_uid: row.rfid_uid });
        });
        res.json({ success: true, data: Object.values(grupos) });
    });
});

app.delete('/api/admin/eliminar-profesor/:id', (req, res) => { db.query('DELETE FROM profesores WHERE id_profesor = ?', [req.params.id], (e) => { if(e) return res.status(500).json({success: false}); res.json({success: true}); }); });
app.delete('/api/admin/eliminar-alumno/:id', (req, res) => { db.query('DELETE FROM alumnos WHERE id_alumno = ?', [req.params.id], (e) => { if(e) return res.status(500).json({success: false}); res.json({success: true}); }); });
app.post('/api/admin/desinscribir', (req, res) => { db.query('DELETE FROM inscripciones WHERE matricula = ? AND id_profesor = ?', [req.body.matricula, req.body.id_profesor], (e) => { if(e) return res.status(500).json({success: false}); res.json({success: true}); }); });
app.put('/api/admin/editar-alumno', (req, res) => { const { id_alumno, matricula, nombre, rfid_uid } = req.body; db.query('UPDATE alumnos SET matricula=?, nombre=?, rfid_uid=? WHERE id_alumno=?', [matricula, nombre, rfid_uid, id_alumno], (e) => { if(e) return res.status(500).json({success: false}); res.json({success: true}); }); });
app.put('/api/admin/editar-profesor', (req, res) => { const { id_profesor, nombre, apellidos, shortname, num_empleado, email } = req.body; db.query('UPDATE profesores SET nombre=?, apellidos=?, shortname=?, num_empleado=?, email=? WHERE id_profesor=?', [nombre, apellidos, shortname, num_empleado, email, id_profesor], (e) => { if(e) return res.status(500).json({success: false}); res.json({success: true}); }); });


// --- ADMIN: CUATRIMESTRES ---

// Obtener todos los cuatrimestres
app.get('/api/admin/cuatrimestres', (req, res) => {
    db.query(
        `SELECT id, nombre, fecha_inicio, fecha_fin, es_actual 
         FROM cuatrimestres 
         ORDER BY fecha_inicio DESC`,
        (err, rows) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, data: rows });
        }
    );
});


// Crear nuevo cuatrimestre
app.post('/api/admin/cuatrimestres', (req, res) => {
    const { nombre, fecha_inicio, fecha_fin } = req.body;

    if (!nombre || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ success: false, message: "Datos incompletos" });
    }

    db.query(
        `INSERT INTO cuatrimestres (nombre, fecha_inicio, fecha_fin, es_actual)
         VALUES (?, ?, ?, 0)`,
        [nombre, fecha_inicio, fecha_fin],
        (err) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, message: "Cuatrimestre creado correctamente" });
        }
    );
});


// Editar cuatrimestre
app.put('/api/admin/cuatrimestres/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, fecha_inicio, fecha_fin } = req.body;

    if (!nombre || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ success: false, message: "Datos incompletos" });
    }

    db.query(
        `UPDATE cuatrimestres
         SET nombre = ?, fecha_inicio = ?, fecha_fin = ?
         WHERE id = ?`,
        [nombre, fecha_inicio, fecha_fin, id],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Cuatrimestre no encontrado" });
            }
            res.json({ success: true, message: "Cuatrimestre actualizado correctamente" });
        }
    );
});

// Eliminar cuatrimestre
app.delete('/api/admin/cuatrimestres/:id', (req, res) => {
    const { id } = req.params;

    db.query(`SELECT es_actual FROM cuatrimestres WHERE id = ?`, [id], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (!rows.length) return res.status(404).json({ success: false, message: "Cuatrimestre no encontrado" });

        if (Number(rows[0].es_actual) === 1) {
            return res.status(400).json({ success: false, message: "No se puede eliminar el cuatrimestre actual" });
        }

        db.query(`SELECT COUNT(*) AS total FROM sesiones WHERE id_cuatrimestre = ?`, [id], (err2, sRows) => {
            if (err2) return res.status(500).json({ success: false, error: err2.message });

            db.query(`SELECT COUNT(*) AS total FROM inscripciones WHERE id_cuatrimestre = ?`, [id], (err3, iRows) => {
                if (err3) return res.status(500).json({ success: false, error: err3.message });

                const totalSesiones = sRows?.[0]?.total || 0;
                const totalInscripciones = iRows?.[0]?.total || 0;

                if (totalSesiones > 0 || totalInscripciones > 0) {
                    return res.status(400).json({
                        success: false,
                        message: "No se puede eliminar porque tiene sesiones o inscripciones asociadas"
                    });
                }

                db.query(`DELETE FROM cuatrimestres WHERE id = ?`, [id], (err4) => {
                    if (err4) return res.status(500).json({ success: false, error: err4.message });
                    res.json({ success: true, message: "Cuatrimestre eliminado correctamente" });
                });
            });
        });
    });
});


// Marcar cuatrimestre como actual
app.put('/api/admin/cuatrimestres/:id/actual', (req, res) => {
    const { id } = req.params;

    db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        connection.beginTransaction(err => {
            if (err) return res.status(500).json({ success: false, error: err.message });

            // 1️⃣ Apagar todos
            connection.query(`UPDATE cuatrimestres SET es_actual = 0`, (err) => {
                if (err) {
                    connection.rollback(() => connection.release());
                    return res.status(500).json({ success: false, error: err.message });
                }

                // 2️⃣ Encender el seleccionado
                connection.query(
                    `UPDATE cuatrimestres SET es_actual = 1 WHERE id = ?`,
                    [id],
                    (err) => {
                        if (err) {
                            connection.rollback(() => connection.release());
                            return res.status(500).json({ success: false, error: err.message });
                        }

                        connection.commit(err => {
                            if (err) {
                                connection.rollback(() => connection.release());
                                return res.status(500).json({ success: false, error: err.message });
                            }

                            connection.release();
                            res.json({ success: true, message: "Cuatrimestre actualizado correctamente" });
                        });
                    }
                );
            });
        });
    });
});


app.post('/api/admin/reporte-afluencia', (req, res) => {
    const { fechaInicio, fechaFin } = req.body;
    const q1 = `SELECT al.matricula as id, al.nombre, DATE_FORMAT(a.created_at, '%Y-%m-%d') as fecha, TIME_FORMAT(a.hora_llegada, '%H:%i') as hora, a.id_sesion 
                FROM asistencia_alumnos a JOIN alumnos al ON a.matricula = al.matricula 
                WHERE DATE(a.created_at) BETWEEN ? AND ? ORDER BY a.created_at DESC`;
    const q2 = `SELECT p.num_empleado as id, CONCAT(p.nombre, ' ', p.apellidos) as nombre, DATE_FORMAT(s.fecha_inicio, '%Y-%m-%d') as fecha, TIME_FORMAT(s.fecha_inicio, '%H:%i') as hora, s.id_sesion 
                FROM sesiones s JOIN profesores p ON s.id_profesor = p.id_profesor 
                WHERE DATE(s.fecha_inicio) BETWEEN ? AND ? ORDER BY s.fecha_inicio DESC`;
    db.query(q1, [fechaInicio, fechaFin], (e, rawAlumnos) => {
        if(e) return res.status(500).json({error: "Error Alumnos: " + e.message});
        db.query(q2, [fechaInicio, fechaFin], (e, rawProfes) => {
            if(e) return res.status(500).json({error: "Error Profes: " + e.message});
            const procesar = (lista) => {
                const agrupado = {};
                lista.forEach(item => {
                    const key = item.id + '|' + item.fecha; 
                    if (!agrupado[key]) {
                        agrupado[key] = { id: item.id, nombre: item.nombre, fecha: item.fecha, sesiones: new Set(), horas: [] };
                    }
                    agrupado[key].sesiones.add(item.id_sesion);
                    agrupado[key].horas.push(item.hora);
                });
                return Object.values(agrupado).map(obj => ({
                    ...obj, total_actividad: obj.sesiones.size, horas: [...new Set(obj.horas)].sort().join(', ') 
                })).sort((a,b) => b.fecha.localeCompare(a.fecha)); 
            };
            res.json({ success: true, alumnos: procesar(rawAlumnos), profesores: procesar(rawProfes) });
        });
    });
});


// =========================
// ADMIN: MATERIAS
// =========================

// Listar materias
app.get('/api/admin/materias', (req, res) => {
  db.query(
    `SELECT * FROM materias ORDER BY nombre ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  );
});

// Crear materia
app.post('/api/admin/materias', (req, res) => {
  const { clave, nombre, horas_asignatura } = req.body;

  if (!nombre) {
    return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
  }

  db.query(
    `INSERT INTO materias (clave, nombre, horas_asignatura)
     VALUES (?, ?, ?)`,
    [clave || null, nombre, horas_asignatura || null],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Materia creada correctamente' });
    }
  );
});

// Editar materia
app.put('/api/admin/materias/:id', (req, res) => {
  const { id } = req.params;
  const { clave, nombre, horas_asignatura } = req.body;

  if (!nombre) {
    return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
  }

  db.query(
    `UPDATE materias
     SET clave = ?, nombre = ?, horas_asignatura = ?
     WHERE id_materia = ?`,
    [clave || null, nombre, horas_asignatura || null, id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'Materia no encontrada' });
      }
      res.json({ success: true, message: 'Materia actualizada correctamente' });
    }
  );
});

// Eliminar materia
app.delete('/api/admin/materias/:id', (req, res) => {
  const { id } = req.params;

  db.query(
    `DELETE FROM materias WHERE id_materia = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'Materia no encontrada' });
      }
      res.json({ success: true, message: 'Materia eliminada correctamente' });
    }
  );
});

// =========================
// ADMIN: GRUPOS
// =========================

// Listar grupos
app.get('/api/admin/grupos', (req, res) => {
  db.query(
    `SELECT * FROM grupos ORDER BY nombre ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  );
});

// Crear grupo
app.post('/api/admin/grupos', (req, res) => {
  const { nombre, turno } = req.body;

  if (!nombre) {
    return res.status(400).json({ success: false, message: 'El nombre del grupo es obligatorio' });
  }

  db.query(
    `INSERT INTO grupos (nombre, turno)
     VALUES (?, ?)`,
    [nombre, turno || null],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Grupo creado correctamente' });
    }
  );
});

// Editar grupo
app.put('/api/admin/grupos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, turno } = req.body;

  if (!nombre) {
    return res.status(400).json({ success: false, message: 'El nombre del grupo es obligatorio' });
  }

  db.query(
    `UPDATE grupos
     SET nombre = ?, turno = ?
     WHERE id_grupo = ?`,
    [nombre, turno || null, id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
      }
      res.json({ success: true, message: 'Grupo actualizado correctamente' });
    }
  );
});

// Eliminar grupo
app.delete('/api/admin/grupos/:id', (req, res) => {
  const { id } = req.params;

  db.query(
    `DELETE FROM grupos WHERE id_grupo = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
      }
      res.json({ success: true, message: 'Grupo eliminado correctamente' });
    }
  );
});

// =========================
// ADMIN: ASIGNACIONES ACADÉMICAS
// =========================

// Listar asignaciones
app.get('/api/admin/asignaciones', (req, res) => {
  db.query(
    `SELECT 
        aa.id_asignacion,
        aa.id_profesor,
        aa.id_cuatrimestre,
        aa.id_materia,
        aa.id_grupo,
        aa.activo,
        CONCAT(p.nombre, ' ', p.apellidos) AS profesor,
        p.shortname,
        c.nombre AS cuatrimestre,
        m.clave AS materia_clave,
        m.nombre AS materia,
        m.horas_asignatura,
        g.nombre AS grupo,
        g.turno
     FROM asignaciones_academicas aa
     JOIN profesores p ON aa.id_profesor = p.id_profesor
     JOIN cuatrimestres c ON aa.id_cuatrimestre = c.id
     JOIN materias m ON aa.id_materia = m.id_materia
     JOIN grupos g ON aa.id_grupo = g.id_grupo
     ORDER BY c.fecha_inicio DESC, profesor ASC, m.nombre ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  );
});

// Crear asignación
app.post('/api/admin/asignaciones', (req, res) => {
  const { id_profesor, id_cuatrimestre, id_materia, id_grupo, activo } = req.body;

  if (!id_profesor || !id_cuatrimestre || !id_materia || !id_grupo) {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }

  db.query(
    `INSERT INTO asignaciones_academicas
     (id_profesor, id_cuatrimestre, id_materia, id_grupo, activo)
     VALUES (?, ?, ?, ?, ?)`,
    [id_profesor, id_cuatrimestre, id_materia, id_grupo, activo ?? 1],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Asignación creada correctamente' });
    }
  );
});

// Editar asignación
app.put('/api/admin/asignaciones/:id', (req, res) => {
  const { id } = req.params;
  const { id_profesor, id_cuatrimestre, id_materia, id_grupo, activo } = req.body;

  if (!id_profesor || !id_cuatrimestre || !id_materia || !id_grupo) {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }

  db.query(
    `UPDATE asignaciones_academicas
     SET id_profesor = ?, id_cuatrimestre = ?, id_materia = ?, id_grupo = ?, activo = ?
     WHERE id_asignacion = ?`,
    [id_profesor, id_cuatrimestre, id_materia, id_grupo, activo ?? 1, id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
      }
      res.json({ success: true, message: 'Asignación actualizada correctamente' });
    }
  );
});

// Eliminar asignación
app.delete('/api/admin/asignaciones/:id', (req, res) => {
  const { id } = req.params;

  db.query(
    `DELETE FROM asignaciones_academicas WHERE id_asignacion = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
      }
      res.json({ success: true, message: 'Asignación eliminada correctamente' });
    }
  );
});


//////
/////

app.get('/api/dashboard/:id_profesor', (req, res) => {
  const { id_profesor } = req.params;
  const { cuatrimestreId } = req.query; // 👈 viene del front

  // 1) Total inscritos (por cuatri si aplica)
  const paramsIns = [id_profesor];
  let whereIns = "id_profesor = ?";
  if (cuatrimestreId) {
    whereIns += " AND id_cuatrimestre = ?";
    paramsIns.push(cuatrimestreId);
  }

  db.query(
    `SELECT COUNT(*) as total FROM inscripciones WHERE ${whereIns}`,
    paramsIns,
    (e, r1) => {
      if (e) return res.status(500).json({ error: e.message });

      // 2) Asistencias hoy (por cuatri si aplica)
      const paramsHoy = [id_profesor];
      let whereHoy = "s.id_profesor = ? AND DATE(s.fecha_inicio) = CURDATE()";
      if (cuatrimestreId) {
        whereHoy += " AND s.id_cuatrimestre = ?";
        paramsHoy.push(cuatrimestreId);
      }

      db.query(
        `SELECT COUNT(*) as total
         FROM asistencia_alumnos a
         JOIN sesiones s ON a.id_sesion = s.id_sesion
         WHERE ${whereHoy}`,
        paramsHoy,
        (e2, r2) => {
          if (e2) return res.status(500).json({ error: e2.message });

          // 3) Recientes (por cuatri si aplica)
          const paramsRec = [id_profesor];
          let whereRec = "s.id_profesor = ? AND DATE(s.fecha_inicio) = CURDATE()";
          if (cuatrimestreId) {
            whereRec += " AND s.id_cuatrimestre = ?";
            paramsRec.push(cuatrimestreId);
          }

          db.query(
            `SELECT a.hora_llegada, al.matricula, al.nombre, a.metodo
             FROM asistencia_alumnos a
             JOIN sesiones s ON a.id_sesion = s.id_sesion
             JOIN alumnos al ON a.matricula = al.matricula
             WHERE ${whereRec}
             ORDER BY a.hora_llegada DESC
             LIMIT 5`,
            paramsRec,
            (e3, r3) => {
              if (e3) return res.status(500).json({ error: e3.message });

              res.json({
                success: true,
                alumnos: r1?.[0]?.total || 0,
                asistencias_hoy: r2?.[0]?.total || 0,
                recientes: r3 || []
              });
            }
          );
        }
      );
    }
  );
});


//  MIS ALUMNOS - ahora filtra por cuatrimestreId si lo mandas
app.post('/api/mis-alumnos', (req, res) => {
  const { id_profesor, cuatrimestreId } = req.body;

  const params = [id_profesor];
  let where = "i.id_profesor = ?";
  if (cuatrimestreId) {
    where += " AND i.id_cuatrimestre = ?";
    params.push(cuatrimestreId);
  }

  db.query(
    `SELECT a.matricula, a.nombre, i.fecha_inscripcion
     FROM inscripciones i
     JOIN alumnos a ON i.matricula = a.matricula
     WHERE ${where}
     ORDER BY a.nombre ASC`,
    params,
    (e, r) => {
      if (e) return res.status(500).json({ error: e.message });
      res.json({ success: true, data: r });
    }
  );
});

//  REPORTE - ahora filtra por cuatrimestreId si lo mandas
app.post('/api/reporte', (req, res) => {
  const { id_profesor, fechaInicio, fechaFin, cuatrimestreId } = req.body;

  // Total inscritos (por cuatri si aplica)
  const paramsTotal = [id_profesor];
  let whereTotal = "id_profesor = ?";
  if (cuatrimestreId) {
    whereTotal += " AND id_cuatrimestre = ?";
    paramsTotal.push(cuatrimestreId);
  }

  db.query(
    `SELECT COUNT(*) as total FROM inscripciones WHERE ${whereTotal}`,
    paramsTotal,
    (e, rT) => {
      if (e) return res.status(500).json({ error: e.message });

      // Sesiones + asistencias (por cuatri si aplica)
      const params = [id_profesor, fechaInicio, fechaFin];
      let where = "s.id_profesor = ? AND DATE(s.fecha_inicio) BETWEEN ? AND ?";
      if (cuatrimestreId) {
        where += " AND s.id_cuatrimestre = ?";
        params.push(cuatrimestreId);
      }

      db.query(
        `SELECT s.id_sesion, s.fecha_inicio, s.fecha_fin,
                a.hora_llegada, al.matricula, al.nombre, a.metodo
         FROM sesiones s
         LEFT JOIN asistencia_alumnos a ON s.id_sesion = a.id_sesion
         LEFT JOIN alumnos al ON a.matricula = al.matricula
         WHERE ${where}
         ORDER BY s.fecha_inicio DESC, a.hora_llegada ASC`,
        params,
        (e2, rows) => {
          if (e2) return res.status(500).json({ error: e2.message });

          const map = {};
          rows.forEach(r => {
            if (!map[r.id_sesion]) {
              map[r.id_sesion] = {
                id_sesion: r.id_sesion,
                fecha: r.fecha_inicio,
                inicio: new Date(r.fecha_inicio).toLocaleTimeString(),
                fin: new Date(r.fecha_fin).toLocaleTimeString(),
                asistencias: []
              };
            }
            if (r.matricula) {
              map[r.id_sesion].asistencias.push({
                matricula: r.matricula,
                nombre: r.nombre,
                hora: r.hora_llegada,
                metodo: r.metodo
              });
            }
          });

          res.json({
            success: true,
            data: Object.values(map),
            totalMisAlumnos: rT?.[0]?.total || 0
          });
        }
      );
    }
  );
});

/// CUATRIMESTRES 

app.get('/api/cuatrimestres', (req, res) => {
  db.query(`SELECT id, nombre, fecha_inicio, fecha_fin, es_actual FROM cuatrimestres ORDER BY fecha_inicio DESC`, (e, r) => {
    if (e) return res.status(500).json({ success: false, error: e.message });
    res.json({ success: true, data: r });
  });
});


app.get('/api/cuatrimestres/actual', (req, res) => {
  db.query(`SELECT id, nombre, fecha_inicio, fecha_fin, es_actual FROM cuatrimestres WHERE es_actual = 1 ORDER BY id DESC LIMIT 1`, (e, r) => {
    if (e) return res.status(500).json({ success: false, error: e.message });
    if (!r?.length) return res.status(404).json({ success: false, message: 'No hay cuatrimestre actual' });
    res.json({ success: true, data: r[0] });
  });
});


///// APIS DE SESIONES /////

app.get("/api/sesiones", (req, res) => {
  const { cuatrimestre, id_profesor } = req.query;

  let sql = `
    SELECT 
      s.id_sesion,
      s.tipo_sesion,
      s.tipo_asesoria,
      s.unidad_tema,
      s.id_cuatrimestre,
      s.id_asignacion,
      c.nombre AS cuatrimestre_nombre,
      p.id_profesor,
      p.shortname,
      p.nombre,
      p.apellidos,
      m.nombre AS materia,
      m.clave AS materia_clave,
      g.nombre AS grupo,
      s.fecha_inicio,
      s.fecha_fin,
      CASE WHEN s.fecha_fin > NOW() THEN 'ACTIVA' ELSE 'CERRADA' END AS estado
    FROM sesiones s
    LEFT JOIN cuatrimestres c ON c.id = s.id_cuatrimestre
    LEFT JOIN profesores p ON p.id_profesor = s.id_profesor
    LEFT JOIN asignaciones_academicas aa ON s.id_asignacion = aa.id_asignacion
    LEFT JOIN materias m ON aa.id_materia = m.id_materia
    LEFT JOIN grupos g ON aa.id_grupo = g.id_grupo
    WHERE 1=1
  `;

  const params = [];

  if (cuatrimestre) {
    sql += " AND s.id_cuatrimestre = ? ";
    params.push(cuatrimestre);
  }

  if (id_profesor) {
    sql += " AND s.id_profesor = ? ";
    params.push(id_profesor);
  }

  sql += " ORDER BY s.id_sesion DESC ";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});


app.get("/api/sesiones/:id/asistencias", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      s.id_sesion,
      s.tipo_sesion,
      s.tipo_asesoria,
      s.unidad_tema,
      s.fecha_inicio,
      s.fecha_fin,
      c.nombre AS cuatrimestre,
      CONCAT(p.nombre, ' ', p.apellidos) AS profesor,
      p.shortname,
      m.nombre AS materia,
      m.clave AS materia_clave,
      m.horas_asignatura,
      g.nombre AS grupo,
      a.id_asistencia_alum,
      a.matricula,
      al.nombre AS nombre_alumno,
      a.hora_llegada,
      a.metodo,
      a.created_at
    FROM sesiones s
    LEFT JOIN cuatrimestres c ON c.id = s.id_cuatrimestre
    LEFT JOIN profesores p ON p.id_profesor = s.id_profesor
    LEFT JOIN asignaciones_academicas aa ON s.id_asignacion = aa.id_asignacion
    LEFT JOIN materias m ON aa.id_materia = m.id_materia
    LEFT JOIN grupos g ON aa.id_grupo = g.id_grupo
    LEFT JOIN asistencia_alumnos a ON a.id_sesion = s.id_sesion
    LEFT JOIN alumnos al ON al.matricula = a.matricula
    WHERE s.id_sesion = ?
    ORDER BY a.created_at ASC
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    if (!rows.length) {
      return res.json({ success: true, session: null, asistencias: [] });
    }

    const head = rows[0];

    const session = {
      id_sesion: head.id_sesion,
      tipo_sesion: head.tipo_sesion,
      tipo_asesoria: head.tipo_asesoria,
      unidad_tema: head.unidad_tema,
      fecha_inicio: head.fecha_inicio,
      fecha_fin: head.fecha_fin,
      cuatrimestre: head.cuatrimestre,
      profesor: head.profesor,
      shortname: head.shortname,
      materia: head.materia,
      materia_clave: head.materia_clave,
      horas_asignatura: head.horas_asignatura,
      grupo: head.grupo
    };

    const asistencias = rows
      .filter(r => r.id_asistencia_alum)
      .map(r => ({
        id_asistencia_alum: r.id_asistencia_alum,
        matricula: r.matricula,
        nombre_alumno: r.nombre_alumno,
        hora_llegada: r.hora_llegada,
        metodo: r.metodo,
        created_at: r.created_at
      }));

    res.json({ success: true, session, asistencias });
  });
});



app.get("/api/lab", (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ success: false, message: "from y to son requeridos (YYYY-MM-DD)" });
  }

  const sql = `
    SELECT
      a.id_asistencia_alum,
      a.matricula,
      a.metodo,
      a.created_at,
      s.id_sesion
    FROM asistencia_alumnos a
    JOIN sesiones s ON s.id_sesion = a.id_sesion
    WHERE s.tipo_sesion = 'LABORATORIO'
      AND a.created_at >= CONCAT(?, ' 00:00:00')
      AND a.created_at <= CONCAT(?, ' 23:59:59')
    ORDER BY a.created_at ASC
  `;

  db.query(sql, [from, to], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

// =========================
// HORARIOS
// =========================

// Admin: ver todos los horarios
app.get('/api/admin/horarios', (req, res) => {
  db.query(
    `SELECT
        h.id_horario,
        h.id_asignacion,
        h.dia_semana,
        h.hora_inicio,
        h.hora_fin,
        h.tipo_sesion,
        h.aula,
        CONCAT(p.nombre, ' ', p.apellidos) AS profesor,
        m.nombre AS materia,
        g.nombre AS grupo,
        c.nombre AS cuatrimestre
     FROM horarios h
     JOIN asignaciones_academicas aa ON h.id_asignacion = aa.id_asignacion
     JOIN profesores p ON aa.id_profesor = p.id_profesor
     JOIN materias m ON aa.id_materia = m.id_materia
     JOIN grupos g ON aa.id_grupo = g.id_grupo
     JOIN cuatrimestres c ON aa.id_cuatrimestre = c.id
     ORDER BY FIELD(h.dia_semana,'LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'), h.hora_inicio ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    }
  );
});

// Profesor: ver solo sus horarios
app.get('/api/profesor/:id_profesor/horarios', (req, res) => {
  const { id_profesor } = req.params;
  const { cuatrimestreId } = req.query;

  let sql = `
    SELECT
        h.id_horario,
        h.id_asignacion,
        h.dia_semana,
        h.hora_inicio,
        h.hora_fin,
        h.tipo_sesion,
        h.aula,
        m.nombre AS materia,
        g.nombre AS grupo,
        c.nombre AS cuatrimestre
     FROM horarios h
     JOIN asignaciones_academicas aa ON h.id_asignacion = aa.id_asignacion
     JOIN materias m ON aa.id_materia = m.id_materia
     JOIN grupos g ON aa.id_grupo = g.id_grupo
     JOIN cuatrimestres c ON aa.id_cuatrimestre = c.id
     WHERE aa.id_profesor = ?
  `;
  const params = [id_profesor];

  if (cuatrimestreId) {
    sql += ` AND aa.id_cuatrimestre = ?`;
    params.push(cuatrimestreId);
  }

  sql += ` ORDER BY FIELD(h.dia_semana,'LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'), h.hora_inicio ASC`;

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
});

// Crear horario (admin)
app.post('/api/admin/horarios', (req, res) => {
  const { id_asignacion, dia_semana, hora_inicio, hora_fin, tipo_sesion, aula } = req.body;

  if (!id_asignacion || !dia_semana || !hora_inicio || !hora_fin || !tipo_sesion) {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }

  db.query(
    `INSERT INTO horarios
     (id_asignacion, dia_semana, hora_inicio, hora_fin, tipo_sesion, aula)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_asignacion, dia_semana, hora_inicio, hora_fin, tipo_sesion, aula || null],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Horario creado correctamente' });
    }
  );
});

// Editar horario (admin o profesor)
app.put('/api/horarios/:id', (req, res) => {
  const { id } = req.params;
  const { id_asignacion, dia_semana, hora_inicio, hora_fin, tipo_sesion, aula } = req.body;

  if (!id_asignacion || !dia_semana || !hora_inicio || !hora_fin || !tipo_sesion) {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }

  db.query(
    `UPDATE horarios
     SET id_asignacion = ?, dia_semana = ?, hora_inicio = ?, hora_fin = ?, tipo_sesion = ?, aula = ?
     WHERE id_horario = ?`,
    [id_asignacion, dia_semana, hora_inicio, hora_fin, tipo_sesion, aula || null, id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'Horario no encontrado' });
      }
      res.json({ success: true, message: 'Horario actualizado correctamente' });
    }
  );
});

// Eliminar horario (admin o profesor)
app.delete('/api/horarios/:id', (req, res) => {
  const { id } = req.params;

  db.query(
    `DELETE FROM horarios WHERE id_horario = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'Horario no encontrado' });
      }
      res.json({ success: true, message: 'Horario eliminado correctamente' });
    }
  );
});

// =========================
// PROFESOR: ASIGNACIONES Y CRUD DE HORARIOS PROPIOS
// =========================

// Profesor: ver solo sus asignaciones activas por cuatrimestre
app.get('/api/profesor/:id_profesor/asignaciones', (req, res) => {
  const { id_profesor } = req.params;
  const { cuatrimestreId } = req.query;

  let sql = `
    SELECT
      aa.id_asignacion,
      aa.id_profesor,
      aa.id_cuatrimestre,
      aa.id_materia,
      aa.id_grupo,
      aa.activo,
      c.nombre AS cuatrimestre,
      m.clave AS materia_clave,
      m.nombre AS materia,
      m.horas_asignatura,
      g.nombre AS grupo,
      g.turno
    FROM asignaciones_academicas aa
    JOIN cuatrimestres c ON aa.id_cuatrimestre = c.id
    JOIN materias m ON aa.id_materia = m.id_materia
    JOIN grupos g ON aa.id_grupo = g.id_grupo
    WHERE aa.id_profesor = ?
  `;

  const params = [id_profesor];

  if (cuatrimestreId) {
    sql += ` AND aa.id_cuatrimestre = ?`;
    params.push(cuatrimestreId);
  }

  sql += ` ORDER BY aa.activo DESC, m.nombre ASC, g.nombre ASC`;

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
});

// Profesor: crear horario SOLO sobre sus asignaciones
app.post('/api/profesor/:id_profesor/horarios', (req, res) => {
  const { id_profesor } = req.params;
  const { id_asignacion, dia_semana, hora_inicio, hora_fin, tipo_sesion, aula } = req.body;

  if (!id_asignacion || !dia_semana || !hora_inicio || !hora_fin || !tipo_sesion) {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }

  db.query(
    `SELECT id_asignacion
     FROM asignaciones_academicas
     WHERE id_asignacion = ? AND id_profesor = ?`,
    [id_asignacion, id_profesor],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!rows.length) {
        return res.status(403).json({ success: false, message: 'La asignación no pertenece al profesor' });
      }

      db.query(
        `INSERT INTO horarios
         (id_asignacion, dia_semana, hora_inicio, hora_fin, tipo_sesion, aula)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id_asignacion, dia_semana, hora_inicio, hora_fin, tipo_sesion, aula || null],
        (err2) => {
          if (err2) return res.status(500).json({ success: false, error: err2.message });
          res.json({ success: true, message: 'Horario creado correctamente' });
        }
      );
    }
  );
});

// Profesor: editar horario SOLO si le pertenece
app.put('/api/profesor/:id_profesor/horarios/:id_horario', (req, res) => {
  const { id_profesor, id_horario } = req.params;
  const { id_asignacion, dia_semana, hora_inicio, hora_fin, tipo_sesion, aula } = req.body;

  if (!id_asignacion || !dia_semana || !hora_inicio || !hora_fin || !tipo_sesion) {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }

  db.query(
    `SELECT h.id_horario
     FROM horarios h
     JOIN asignaciones_academicas aa ON h.id_asignacion = aa.id_asignacion
     WHERE h.id_horario = ? AND aa.id_profesor = ?`,
    [id_horario, id_profesor],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!rows.length) {
        return res.status(403).json({ success: false, message: 'El horario no pertenece al profesor' });
      }

      db.query(
        `SELECT id_asignacion
         FROM asignaciones_academicas
         WHERE id_asignacion = ? AND id_profesor = ?`,
        [id_asignacion, id_profesor],
        (err2, rows2) => {
          if (err2) return res.status(500).json({ success: false, error: err2.message });
          if (!rows2.length) {
            return res.status(403).json({ success: false, message: 'La asignación no pertenece al profesor' });
          }

          db.query(
            `UPDATE horarios
             SET id_asignacion = ?, dia_semana = ?, hora_inicio = ?, hora_fin = ?, tipo_sesion = ?, aula = ?
             WHERE id_horario = ?`,
            [id_asignacion, dia_semana, hora_inicio, hora_fin, tipo_sesion, aula || null, id_horario],
            (err3, result) => {
              if (err3) return res.status(500).json({ success: false, error: err3.message });
              if (!result.affectedRows) {
                return res.status(404).json({ success: false, message: 'Horario no encontrado' });
              }
              res.json({ success: true, message: 'Horario actualizado correctamente' });
            }
          );
        }
      );
    }
  );
});

// Profesor: eliminar horario SOLO si le pertenece
app.delete('/api/profesor/:id_profesor/horarios/:id_horario', (req, res) => {
  const { id_profesor, id_horario } = req.params;

  db.query(
    `SELECT h.id_horario
     FROM horarios h
     JOIN asignaciones_academicas aa ON h.id_asignacion = aa.id_asignacion
     WHERE h.id_horario = ? AND aa.id_profesor = ?`,
    [id_horario, id_profesor],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!rows.length) {
        return res.status(403).json({ success: false, message: 'El horario no pertenece al profesor' });
      }

      db.query(
        `DELETE FROM horarios WHERE id_horario = ?`,
        [id_horario],
        (err2, result) => {
          if (err2) return res.status(500).json({ success: false, error: err2.message });
          if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Horario no encontrado' });
          }
          res.json({ success: true, message: 'Horario eliminado correctamente' });
        }
      );
    }
  );
});


// =========================
// DISPOSITIVOS / SALONES
// =========================

app.get('/api/dispositivos', (req, res) => {
  db.query(
    `SELECT id_dispositivo, mac_address, nombre_salon
     FROM dispositivos
     ORDER BY nombre_salon ASC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, data: rows });
    }
  );
});


const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server MASTER vFINAL (Ubuntu/Linux Ready) running on port ${PORT}`));
