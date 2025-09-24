<?php
$envPath = __DIR__ . '/../../frontend/js/env.json';
$configPath = __DIR__ . '/../../frontend/js/config.json';

// Leer y decodificar JSON de environment
$envJson = json_decode(file_get_contents($envPath), true);
$environment = $envJson['environment'] ?? 'development';

// Leer y decodificar JSON de configuración
$configJson = json_decode(file_get_contents($configPath), true);

// Seleccionar la configuración de base de datos según el environment
$dbConfig = $configJson['dataBaseConn'][$environment] ?? null;

if (!$dbConfig) {
    die("No database config found for environment: $environment");
}

// Definir constantes con los valores del JSON
define('DB_HOST', $dbConfig['host']);
define('DB_USER', $dbConfig['user']);
define('DB_PASS', $dbConfig['password']);
define('DB_NAME', $dbConfig['database']);

// Conexión a la base de datos
function connect() {
    // 1. Check if mysqli extension is loaded
    if (!extension_loaded('mysqli')) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(["message" => "Server configuration error: mysqli extension not loaded."]);
        exit();
    }

    // 2. Broader error handling for connection
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    try {
        $connect = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        $connect->set_charset("utf8mb4");
        return $connect;
    } catch (Throwable $e) { // Catch any error (Throwable is the base for all errors in PHP 7+)
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            "message" => "Database connection failed.",
            "error" => $e->getMessage(),
            "details" => [
                "host" => DB_HOST,
                "user" => DB_USER,
                "database" => DB_NAME
            ]
        ]);
        exit();
    }
}
?>