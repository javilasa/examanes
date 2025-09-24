<?php
define('DB_HOST', 'db');
define('DB_USER', 'root');
define('DB_PASS', 'root');
define('DB_NAME', 'examen_db');

// Conexión a la base de datos
function connect() {
    $connect = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($connect->connect_error) {
        die("Connection failed: " . $connect->connect_error);
    }

    return $connect;
}
?>