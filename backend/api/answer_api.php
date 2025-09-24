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
    require_once '../src/answer.php';
    require_once '../src/jwt.php';
    require_once '../src/results.php'; // Include results.php for saveStudentAnswer

    header("Content-Type: application/json");

    // CORS headers
    require_once 'cors.php';

    $method = $_SERVER['REQUEST_METHOD'];
    $data = json_decode(file_get_contents('php://input'), true);
    $action = isset($data['action']) ? $data['action'] : '';

    if ($method === 'POST' && $action === 'saveStudentAnswer') {
        // No JWT validation for public answer saving
    } else {
        // JWT validation for other actions (admin panel)
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
    }

    // Method spoofing to bypass hosting limitations on PUT/DELETE
    if ($method === 'POST' && isset($data['_method'])) {
        $method = strtoupper($data['_method']);
    }

    switch ($method) {
        case 'GET':
            if (!isset($_GET['question_id'])) {
                http_response_code(400);
                echo json_encode(["message" => "question_id is required"]);
                exit();
            }
            echo json_encode(getAnswers($_GET['question_id']));
            break;
        case 'POST':
            if ($action === 'saveStudentAnswer') {
                saveStudentAnswer($data['student_id'], $data['exam_id'], $data['question_id'], $data['answer_id']);
                echo json_encode(["success" => true, "message" => "Answer saved successfully"]);
            } else {
                createAnswer($data['question_id'], $data['respuesta'], $data['es_correcta']);
                echo json_encode(["message" => "Answer created"]);
            }
            break;
        case 'PUT':
            updateAnswer($data['id'], $data['respuesta'], $data['es_correcta']);
            echo json_encode(["message" => "Answer updated"]);
            break;
        case 'DELETE':
            deleteAnswer($data['id']);
            echo json_encode(["message" => "Answer deleted"]);
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
        'message' => 'A critical error occurred in answer_api.',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit();
}
?>