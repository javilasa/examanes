<?php
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
    require_once '../src/exam.php';
    require_once '../src/jwt.php';

    header("Content-Type: application/json");

    // CORS headers
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {" . $_SERVER['HTTP_ORIGIN'] . "}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
    }
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {" . $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] . "}");
        exit(0);
    }

    // Auth check
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
            echo json_encode(getExams());
            break;
        case 'POST':
            createExam($data['nombre'], $data['code'], $data['groups'] ?? []);
            echo json_encode(["message" => "Exam created"]);
            break;
        case 'PUT':
            $vigente = isset($data['vigente']) ? (int)$data['vigente'] : 0;
            updateExam($data['id'], $data['nombre'], $data['code'], $vigente, $data['groups'] ?? []);
            echo json_encode(["message" => "Exam updated"]);
            break;
        case 'DELETE':
            deleteExam($data['id']);
            echo json_encode(["message" => "Exam deleted"]);
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
        'message' => 'A critical error occurred in exam_api.',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit();
}
?>