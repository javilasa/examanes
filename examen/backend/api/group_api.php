<?php
require_once '../src/group.php';
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

// Handle student group associations
if (isset($_GET['student_id'])) {
    $student_id = $_GET['student_id'];
    switch ($method) {
        case 'GET':
            echo json_encode(getStudentGroups($student_id));
            break;
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $group_ids = isset($data['group_ids']) ? $data['group_ids'] : [];
            setStudentGroups($student_id, $group_ids);
            echo json_encode(["message" => "Student group associations updated"]);
            break;
        default:
            http_response_code(405);
            echo json_encode(["message" => "Method not allowed"]);
            break;
    }
    exit();
}

// Handle general group operations
switch ($method) {
    case 'GET':
        echo json_encode(getGroups());
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        createGroup($data['nombre']);
        echo json_encode(["message" => "Group created"]);
        break;
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        updateGroup($data['id'], $data['nombre']);
        echo json_encode(["message" => "Group updated"]);
        break;
    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        deleteGroup($data['id']);
        echo json_encode(["message" => "Group deleted"]);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}
?>