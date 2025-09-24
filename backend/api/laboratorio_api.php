<?php
// Maximum error handling
error_reporting(0);
set_error_handler(function($severity, $message, $file, $line) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'A PHP error occurred.',
        'error' => ['severity' => $severity, 'message' => $message, 'file' => $file, 'line' => $line]
    ]);
    exit();
});

try {
    require_once '../src/laboratorio.php';
    require_once '../src/group.php'; // Added for getGroups
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
            header("Access-Control-Allow-Methods: POST, OPTIONS");
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
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Authorization header not found"]);
            exit();
        }
    }

    $token = str_replace('Bearer ', '', $headers['Authorization']);
    if (!validateToken($token)) {
        http_response_code(401);
        echo json_encode(["message" => "Invalid token"]);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed. Only POST is accepted."]);
        exit();
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['action'])) {
        http_response_code(400);
        echo json_encode(["message" => "'action' parameter is missing."]);
        exit();
    }

    $action = $data['action'];
    $response = ['message' => "Action '{$action}' executed successfully."];

    switch ($action) {
        // Laboratorios actions
        case 'createLaboratorio':
            $response['id'] = createLaboratorio($data['nombre'], $data['codigo'], $data['activo'] ?? 1, $data['groups'] ?? []);
            break;
        case 'getLaboratorios':
            $response['data'] = getLaboratorios();
            break;
        case 'getLaboratorioById':
            $response['data'] = getLaboratorioById($data['id']);
            break;
        case 'updateLaboratorio':
            $response['success'] = updateLaboratorio($data['id'], $data['nombre'], $data['codigo'], $data['activo'] ?? 1, $data['groups'] ?? []);
            break;
        case 'deleteLaboratorio':
            deleteLaboratorio($data['id']);
            break;

        // Laboratorios-Grupos actions
        case 'assignLaboratorioToGrupo':
            $response['id'] = assignLaboratorioToGrupo($data['id_laboratorio'], $data['id_grupo']);
            break;
        case 'getGruposForLaboratorio':
            $response['data'] = getGruposForLaboratorio($data['id_laboratorio']);
            break;
        case 'removeLaboratorioFromGrupo':
            removeLaboratorioFromGrupo($data['id_laboratorio'], $data['id_grupo']);
            break;

        // Items-Laboratorio actions
        case 'createItemLaboratorio':
            $response['id'] = createItemLaboratorio($data['id_laboratorio'], $data['nombre_archivo']);
            break;
        case 'getItemsForLaboratorio':
            $response['data'] = getItemsForLaboratorio($data['id_laboratorio']);
            break;
        case 'updateItemLaboratorio':
            updateItemLaboratorio($data['id_item'], $data['nombre_archivo']);
            break;
        case 'deleteItemLaboratorio':
            deleteItemLaboratorio($data['id_item']);
            break;

        // Student-Items actions
        case 'assignItemToStudent':
            $response['id'] = assignItemToStudent($data['id_student'], $data['id_item'], $data['relative_path']);
            break;
        case 'getItemsForStudent':
            $response['data'] = getItemsForStudent($data['id_student']);
            break;
        case 'updateStudentItemPath':
            updateStudentItemPath($data['id'], $data['relative_path']);
            break;
        case 'deleteStudentItem':
            deleteStudentItem($data['id']);
            break;

        // --- New Actions ---
        case 'getGroups': // For populating dropdowns
            $response['data'] = getGroups();
            break;
        case 'createOrUpdateNota':
            $response['success'] = createOrUpdateNota($data['id_laboratorio'], $data['id_student'], $data['nota']);
            break;
        case 'getReviewData':
            $response['data'] = getReviewData($data['id_laboratorio'], $data['id_grupo']);
            break;

        default:
            http_response_code(400);
            $response = ['message' => "Unknown action: {$action}"];
            break;
    }

    echo json_encode($response);

} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'A critical error occurred in laboratorio_api.',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit();
}
?>