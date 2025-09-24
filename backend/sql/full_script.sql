SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS student_answers;
DROP TABLE IF EXISTS exam_questions;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS student_groups;
DROP TABLE IF EXISTS exam_groups;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS exam_incidents;

SET FOREIGN_KEY_CHECKS = 1;

-- Creación de la base de datos
--CREATE DATABASE IF NOT EXISTS examen_db;
--USE examen_db;

-- Tabla de Estudiantes
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL
);

-- Tabla de Examenes
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    code VARCHAR(255) UNIQUE NOT NULL,
    vigente BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabla de Preguntas
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    examen_id INT NOT NULL,
    pregunta TEXT NOT NULL,
    peso FLOAT NOT NULL DEFAULT 1.0,
    FOREIGN KEY (examen_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- Tabla de Respuestas Posibles
CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    respuesta TEXT NOT NULL,
    es_correcta BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Tabla de Relación Examen-Preguntas (muchos a muchos)
CREATE TABLE exam_questions (
    exam_id INT NOT NULL,
    question_id INT NOT NULL,
    PRIMARY KEY (exam_id, question_id),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Tabla de Respuestas de los Estudiantes
CREATE TABLE student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    examen_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_id INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (examen_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE
);

-- Tabla de Grupos
CREATE TABLE groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL
);

-- Tabla de Relación Estudiantes-Grupos
CREATE TABLE student_groups (
    student_id INT NOT NULL,
    group_id INT NOT NULL,
    PRIMARY KEY (student_id, group_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Tabla para asignar examenes a grupos
CREATE TABLE exam_groups (
    exam_id INT NOT NULL,
    group_id INT NOT NULL,
    PRIMARY KEY (exam_id, group_id),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Tabla de Incidentes del Examen
CREATE TABLE exam_incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    exam_id INT NOT NULL,
    incident_type VARCHAR(255) NOT NULL,
    incident_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);


-- Insert data into students table
INSERT INTO students (codigo, nombre) VALUES
('STU001', 'Juan Perez'),
('STU002', 'Maria Lopez'),
('STU003', 'Carlos Garcia'),
('STU004', 'Laura Martinez');

-- Insert data into exams table
INSERT INTO exams (nombre, code, vigente) VALUES
('Examen de Bases de Datos', 'EXAMBD001', TRUE),
('Examen de Programacion', 'EXAMPROG001', TRUE);

-- Insert data into questions table
INSERT INTO questions (examen_id, pregunta, peso) VALUES
(1, '¿Qué es una clave primaria?', 1.0),
(1, '¿Qué es una clave foránea?', 1.0),
(2, '¿Qué es un bucle for?', 1.0),
(2, '¿Qué es una función?', 1.0);

-- Insert data into answers table
INSERT INTO answers (question_id, respuesta, es_correcta) VALUES
(1, 'Un identificador único para una fila', TRUE),
(1, 'Un campo que puede contener valores duplicados', FALSE),
(2, 'Un campo que referencia a una clave primaria en otra tabla', TRUE),
(2, 'Un campo que no tiene relación con otras tablas', FALSE),
(3, 'Una estructura de control para repetir código', TRUE),
(3, 'Una forma de declarar variables', FALSE),
(4, 'Un bloque de código reutilizable', TRUE),
(4, 'Un tipo de dato', FALSE);

-- Insert data into student_answers table
INSERT INTO student_answers (student_id, examen_id, question_id, answer_id) VALUES
(1, 1, 1, 1), -- Juan Perez (Grupo A) - Examen BD, Pregunta 1 (Correcta)
(1, 1, 2, 3), -- Juan Perez (Grupo A) - Examen BD, Pregunta 2 (Correcta)
(2, 1, 1, 2), -- Maria Lopez (Grupo B) - Examen BD, Pregunta 1 (Incorrecta)
(3, 2, 3, 5), -- Carlos Garcia (Grupo A) - Examen Programacion, Pregunta 3 (Correcta)
(4, 2, 4, 7); -- Laura Martinez (Grupo B) - Examen Programacion, Pregunta 4 (Correcta);

-- Insert data into groups table
INSERT INTO groups (nombre) VALUES
('Grupo 1'),
('Grupo 2');

-- Insert data into student_groups table
INSERT INTO student_groups (student_id, group_id) VALUES
(1, 1),
(2, 2),
(3, 1),
(4, 2);

-- Insert data into exam_questions table
INSERT INTO exam_questions (exam_id, question_id) VALUES
(1, 1),
(1, 2),
(2, 3),
(2, 4);