<?php
require_once '../src/answer.php';
require_once '../src/jwt.php';
require_once '../src/results.php'; // Include results.php for saveStudentAnswer

header("Content-Type: application/json");

// Allow from any origin for public access (if needed, but this API is protected by JWT)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");         

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    exit(0);
}

$headers = getallheaders();
// This API is used by the public exam page, which does not send a JWT token.
// So, I need to remove the JWT validation for POST requests that are for saving student answers.
// For other actions (GET, PUT, DELETE for admin panel), JWT validation should remain.

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);
$action = isset($data['action']) ? $data['action'] : '';

if ($method === 'POST' && $action === 'saveStudentAnswer') {
    // No JWT validation for public answer saving
} else {
    // JWT validation for other actions (admin panel)
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
            $studentId = $data['student_id'];
            $examId = $data['exam_id'];
            $questionId = $data['question_id'];
            $answerId = $data['answer_id'];
            saveStudentAnswer($studentId, $examId, $questionId, $answerId);
            echo json_encode(["success" => true, "message" => "Answer saved successfully"]);
        } else {
            // Original POST for creating answers (admin panel)
            createAnswer($data['question_id'], $data['respuesta'], $data['es_correcta']);
            echo json_encode(["message" => "Answer created"]);
        }
        break;
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        updateAnswer($data['id'], $data['respuesta'], $data['es_correcta']);
        echo json_encode(["message" => "Answer updated"]);
        break;
    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        deleteAnswer($data['id']);
        echo json_encode(["message" => "Answer deleted"]);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}
?>