USE examen_db;

-- Insert data into students table
INSERT INTO students (codigo, nombre) VALUES
('STU001', 'Juan Perez'),
('STU002', 'Maria Lopez'),
('STU003', 'Carlos Garcia'),
('STU004', 'Laura Martinez');

-- Insert data into exams table
INSERT INTO exams (nombre, vigente) VALUES
('Examen de Bases de Datos', TRUE),
('Examen de Programacion', TRUE);

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
(4, 2, 4, 7); -- Laura Martinez (Grupo B) - Examen Programacion, Pregunta 4 (Correcta)

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

-- Insert data into group_exams table
INSERT INTO group_exams (examen_id, grupo, codigo_acceso) VALUES
(1, 'A', 'ABCDE'),
(2, 'B', 'FGHIJ');

-- Insert data into exam_questions table
INSERT INTO exam_questions (exam_id, question_id) VALUES
(1, 1),
(1, 2),
(2, 3),
(2, 4);