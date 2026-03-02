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
    require_once '../src/exam_incident.php';
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

    $method = $_SERVER['REQUEST_METHOD'];
    // Obtener el contenido de la petición
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    // Verificar si el JSON es válido
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'JSON inválido']);
        exit;
    }

    if (isset($_POST['student_id'])) {
       
        switch ($method) {
            case 'GET':
                echo json_encode([]);
                break;
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $studentId = $data['student_id'];
                $examId = $data['exam_id'];
                $incidentType = $data['incident_type'];

                createExamIncident($studentId, $examId, $incidentType);
                echo json_encode(["message" => "Incident created"]);
                break;
            default:
                http_response_code(405);
                echo json_encode(["message" => "Method not allowed"]);
                break;
        }
        exit();
    }
    echo json_encode(["method" => $method, "data" => print_r($data,true)]);
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