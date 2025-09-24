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
    require_once '../src/config.php';
    require_once '../src/jwt.php';

    header("Content-Type: application/json");

    $method = $_SERVER['REQUEST_METHOD'];
    $endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

    // No JWT validation for login
    if ($endpoint === 'login') {
        $data = json_decode(file_get_contents('php://input'), true);
        $codigo_acceso = $data['codigo_acceso'];
        $codigo_estudiante = $data['codigo_estudiante'];

        $conn = connect();
        $stmt = $conn->prepare("SELECT e.nombre as examen_nombre, s.nombre as estudiante_nombre FROM group_exams ge JOIN exams e ON ge.examen_id = e.id JOIN students s ON s.codigo = ? WHERE ge.codigo_acceso = ? AND s.grupo = ge.grupo");
        $stmt->bind_param("ss", $codigo_estudiante, $codigo_acceso);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            $token = generateToken(); // Generate a new token
            echo json_encode(["token" => $token, "examen_nombre" => $row['examen_nombre'], "estudiante_nombre" => $row['estudiante_nombre']]);
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Invalid access code or student code"]);
        }
        $stmt->close();
        $conn->close();
        exit();
    }

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

    switch ($endpoint) {
        case 'get_exam':
            echo json_encode(["message" => "get_exam endpoint not fully implemented"]);
            break;
        case 'register_answer':
            $data = json_decode(file_get_contents('php://input'), true);
            $conn = connect();
            $stmt = $conn->prepare("INSERT INTO student_answers (student_id, examen_id, question_id, answer_id) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("iiii", $data['student_id'], $data['examen_id'], $data['question_id'], $data['answer_id']);
            $stmt->execute();
            $stmt->close();
            $conn->close();
            echo json_encode(["message" => "Answer registered"]);
            break;
        case 'get_result':
            echo json_encode(["message" => "get_result endpoint not fully implemented"]);
            break;
        default:
            http_response_code(404);
            echo json_encode(["message" => "Endpoint not found"]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'A critical error occurred in exam_service.',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit();
}
?>