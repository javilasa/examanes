<?php
require_once '../src/exam.php';
require_once '../src/jwt.php';

header("Content-Type: application/json");

// Allow from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {" . $_SERVER['HTTP_ORIGIN'] . "}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        // may also be using PUT, PATCH, HEAD etc
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");         

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {" . $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] . "}");

    exit(0);
}

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
        echo json_encode(getExams());
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $nombre = $data['nombre'];
        $code = $data['code'];
        $groupIds = isset($data['groups']) ? $data['groups'] : [];
        createExam($nombre, $code, $groupIds);
        echo json_encode(["message" => "Exam created"]);
        break;
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'];
        $nombre = $data['nombre'];
        $code = $data['code'];
        $vigente = isset($data['vigente']) ? (bool)$data['vigente'] : false;
        $groupIds = isset($data['groups']) ? $data['groups'] : [];
        updateExam($id, $nombre, $code, $vigente, $groupIds);
        echo json_encode(["message" => "Exam updated"]);
        break;
    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        deleteExam($data['id']);
        echo json_encode(["message" => "Exam deleted"]);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}
?>