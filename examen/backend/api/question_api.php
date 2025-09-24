<?php
require_once '../src/question.php';
require_once '../src/jwt.php';

header("Content-Type: application/json");

$headers = getallheaders();
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

switch ($method) {
    case 'GET':
        if (!isset($_GET['examen_id'])) {
            http_response_code(400);
            echo json_encode(["message" => "examen_id is required"]);
            exit();
        }
        echo json_encode(getQuestions($_GET['examen_id']));
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        createQuestion($data['examen_id'], $data['pregunta'], $data['peso']);
        echo json_encode(["message" => "Question created"]);
        break;
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        updateQuestion($data['id'], $data['pregunta'], $data['peso']);
        echo json_encode(["message" => "Question updated"]);
        break;
    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        deleteQuestion($data['id']);
        echo json_encode(["message" => "Question deleted"]);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}
?>