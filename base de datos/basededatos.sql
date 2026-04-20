DROP DATABASE IF EXISTS classaccess;
CREATE DATABASE classaccess CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE classaccess;

-- --- 1. TABLA PROFESORES ---
CREATE TABLE profesores (
    id_profesor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    shortname VARCHAR(20) DEFAULT NULL, -- 🔥 Nombre corto para la pantalla IoT
    num_empleado VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150),
    password VARCHAR(255) DEFAULT NULL, -- NULL permite acceso solo con ID (si no es admin)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --- 2. TABLA ALUMNOS ---
CREATE TABLE alumnos (
    id_alumno INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) DEFAULT 'Estudiante',
    matricula VARCHAR(50) UNIQUE NOT NULL,
    rfid_uid VARCHAR(50) UNIQUE, -- UID de la tarjeta RFID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --- 3. TABLA SESIONES (CLASES IMPARTIDAS) ---
CREATE TABLE sesiones (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    id_profesor INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    FOREIGN KEY (id_profesor) REFERENCES profesores(id_profesor) ON DELETE CASCADE
);

-- --- 4. TABLA INSCRIPCIONES (GRUPOS) ---
CREATE TABLE inscripciones (
    id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
    id_profesor INT NOT NULL,
    matricula VARCHAR(50) NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_profesor) REFERENCES profesores(id_profesor) ON DELETE CASCADE,
    FOREIGN KEY (matricula) REFERENCES alumnos(matricula) ON DELETE CASCADE,
    UNIQUE(id_profesor, matricula) -- Evita que un alumno se inscriba doble al mismo profe
);

-- --- 5. TABLA ASISTENCIAS (REGISTROS DIARIOS) ---
CREATE TABLE asistencia_alumnos (
    id_asistencia_alum INT AUTO_INCREMENT PRIMARY KEY,
    id_sesion INT NOT NULL,
    matricula VARCHAR(50) NOT NULL,
    hora_llegada TIME NOT NULL,
    metodo ENUM('RFID', 'TECLADO') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sesion) REFERENCES sesiones(id_sesion) ON DELETE CASCADE,
    FOREIGN KEY (matricula) REFERENCES alumnos(matricula) ON DELETE CASCADE,
    UNIQUE(id_sesion, matricula) -- Un alumno solo puede tener una asistencia por sesión
);

-- --- 6. TABLA DISPOSITIVOS (Opcional) ---
CREATE TABLE dispositivos (
    id_dispositivo INT AUTO_INCREMENT PRIMARY KEY,
    mac_address VARCHAR(50) UNIQUE NOT NULL,
    nombre_salon VARCHAR(100) DEFAULT 'Sin Asignar',
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- --- DATOS DE EJEMPLO (SEMILLA) ---

-- 1. Insertar el Administrador y Profesores
INSERT INTO profesores (nombre, apellidos, shortname, num_empleado, email, password) VALUES 
('Administrador', 'Sistema', 'Admin', 'ADMIN', 'admin@classaccess.com', 'admin123'),
('Saul Noe', 'Perez Aguilera', 'Saul', '12345', 'saul@uteq.edu.mx', NULL), 
('Emmanuel Alberto', 'Escobedo Ortiz', 'Emmanuel', '105555', 'emmanuel@uteq.edu.mx', NULL);

-- 2. Insertar Alumnos de prueba
INSERT INTO alumnos (nombre, matricula, rfid_uid) VALUES 
('Juan Perez', '2023371155', 'A3B2C1D4'),
('Maria Lopez', '2023371156', 'F9E8D7C6');

-- 3. Inscribir alumnos con el profesor Emmanuel (Para pruebas)
INSERT INTO inscripciones (id_profesor, matricula) VALUES 
(3, '2023371155'), -- Emmanuel tiene a Juan
(3, '2023371156'); -- Emmanuel tiene a Maria