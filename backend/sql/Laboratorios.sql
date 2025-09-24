DROP TABLE IF EXISTS laboratorio_nota;
DROP TABLE IF EXISTS student_items;
DROP TABLE IF EXISTS items_laboratorio;
DROP TABLE IF EXISTS laboratorios_grupos;
DROP TABLE IF EXISTS laboratorios;

-- Tabla de Laboratorios
CREATE TABLE laboratorios (
    id_laboratorio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50),
    activo TINYINT(1) DEFAULT 1
);

-- Tabla de Relación Laboratorios-Grupos
CREATE TABLE laboratorios_grupos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_laboratorio INT NOT NULL,
    id_grupo INT NOT NULL,
    FOREIGN KEY (id_laboratorio) REFERENCES laboratorios(id_laboratorio) ON DELETE CASCADE,
    FOREIGN KEY (id_grupo) REFERENCES groups(id) ON DELETE CASCADE
);

-- Tabla de Items de Laboratorio
CREATE TABLE items_laboratorio (
    id_item INT AUTO_INCREMENT PRIMARY KEY,
    id_laboratorio INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_laboratorio) REFERENCES laboratorios(id_laboratorio) ON DELETE CASCADE
);

-- Tabla de Items de Estudiantes
CREATE TABLE student_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_student INT NOT NULL,
    id_item INT NOT NULL,
    relative_path VARCHAR(255),
    upload_timestamp DATETIME,
    FOREIGN KEY (id_student) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (id_item) REFERENCES items_laboratorio(id_item) ON DELETE CASCADE,
    UNIQUE KEY unique_student_item (id_student, id_item)
);

-- Tabla de Notas de Laboratorio
CREATE TABLE laboratorio_nota (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_laboratorio INT NOT NULL,
    id_student INT NOT NULL,
    nota FLOAT,
    FOREIGN KEY (id_laboratorio) REFERENCES laboratorios(id_laboratorio) ON DELETE CASCADE,
    FOREIGN KEY (id_student) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_nota (id_laboratorio, id_student)
);