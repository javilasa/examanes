<?php
require_once '../src/student.php';
require_once '../src/jwt.php'; // Placeholder for JWT library
require_once '../src/group.php'; // Include group functions

header("Content-Type: application/json");

$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(["message" => "Authorization header not found"]);
    exit();
}

$token = str_replace('Bearer ', '', $headers['Authorization']);
if (!validateToken($token)) { // Placeholder for token validation
    http_response_code(401);
    echo json_encode(["message" => "Invalid token"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        echo json_encode(getStudents());
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $codigo = $data['codigo'];
        $nombre = $data['nombre'];
        $groupIds = isset($data['groups']) ? $data['groups'] : []; // Expect 'groups' array
        createStudent($codigo, $nombre, $groupIds); // Pass groupIds
        echo json_encode(["message" => "Student created"]);
        break;
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        error_log("student_api.php PUT data: " . print_r($data, true)); // Debugging
        $id = $data['id'];
        $codigo = $data['codigo'];
        $nombre = $data['nombre'];
        $groupIds = isset($data['groups']) ? $data['groups'] : []; // Expect 'groups' array
        error_log("student_api.php PUT groupIds: " . print_r($groupIds, true)); // Debugging
        updateStudent($id, $codigo, $nombre, $groupIds); // Pass groupIds
        echo json_encode(["message" => "Student updated"]);
        break;
    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        deleteStudent($data['id']);
        echo json_encode(["message" => "Student deleted"]);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}
?>