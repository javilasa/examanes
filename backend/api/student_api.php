<?php
require_once 'cors.php';
// Maximum error handling to force JSON response
error_reporting(0);
set_error_handler(function($severity, $message, $file, $line) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'A PHP error occurred.',
        'error' => [
            'severity' => $severity,
            'message' => $message,
            'file' => $file,
            'line' => $line
        ]
    ]);
    exit();
});

try {
    require_once '../src/student.php';
    require_once '../src/jwt.php';
    require_once '../src/group.php';

    header("Content-Type: application/json");

    // This check is now inside the try block
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $key = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$key] = $value;
            }
        }
    }

    if (!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(["message" => "Authorization header not found"]);
        exit();
    }

    $token = str_replace('Bearer ', '', $headers['Authorization']);
    if (!validateToken($token)) {
        http_response_code(401);
        echo json_encode(["message" => "Invalid token"]);
        exit();
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $data = json_decode(file_get_contents('php://input'), true);

    // Method spoofing to bypass hosting limitations on PUT/DELETE
    if ($method === 'POST' && isset($data['_method'])) {
        $method = strtoupper($data['_method']);
    }

    switch ($method) {
        case 'GET':
            echo json_encode(getStudents());
            break;
        case 'POST':
            $codigo = $data['codigo'];
            $nombre = $data['nombre'];
            $groupIds = isset($data['groups']) ? $data['groups'] : [];
            createStudent($codigo, $nombre, $groupIds);
            echo json_encode(["message" => "Student created"]);
            break;
        case 'PUT':
            updateStudent($data['id'], $data['codigo'], $data['nombre'], $data['groups'] ?? []);
            echo json_encode(["message" => "Student updated"]);
            break;
        case 'DELETE':
            deleteStudent($data['id']);
            echo json_encode(["message" => "Student deleted"]);
            break;
        default:
            http_response_code(405);
            echo json_encode(["message" => "Method not allowed"]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'A critical error occurred.',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit();
}
?>