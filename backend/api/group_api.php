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
    require_once '../src/group.php';
    require_once '../src/jwt.php';

    header("Content-Type: application/json");

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

    if (isset($_GET['student_id'])) {
        $student_id = $_GET['student_id'];
        switch ($method) {
            case 'GET':
                echo json_encode(getStudentGroups($student_id));
                break;
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                setStudentGroups($student_id, $data['group_ids'] ?? []);
                echo json_encode(["message" => "Student group associations updated"]);
                break;
            default:
                http_response_code(405);
                echo json_encode(["message" => "Method not allowed"]);
                break;
        }
        exit();
    }

    $data = json_decode(file_get_contents('php://input'), true);

    // Method spoofing to bypass hosting limitations on PUT/DELETE
    if ($method === 'POST' && isset($data['_method'])) {
        $method = strtoupper($data['_method']);
    }

    switch ($method) {
        case 'GET':
            echo json_encode(getGroups());
            break;
        case 'POST':
            createGroup($data['nombre']);
            echo json_encode(["message" => "Group created"]);
            break;
        case 'PUT':
            updateGroup($data['id'], $data['nombre']);
            echo json_encode(["message" => "Group updated"]);
            break;
        case 'DELETE':
            deleteGroup($data['id']);
            echo json_encode(["message" => "Group deleted"]);
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
        'message' => 'A critical error occurred in group_api.',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit();
}
?>