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
    require_once '../src/results.php';
    require_once '../src/jwt.php';

    header("Content-Type: application/json");

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            if (isset($_GET['action'])) {
                switch ($_GET['action']) {
                    case 'getExams':
                        echo json_encode(getAllExams());
                        break;
                    case 'getGroups':
                        echo json_encode(getAllGroups());
                        break;
                    case 'getStudentScores':
                        if (isset($_GET['exam_id'], $_GET['group_id'])) {
                            echo json_encode(getStudentScoresByExamAndGroup((int)$_GET['exam_id'], (int)$_GET['group_id']));
                        } else {
                            http_response_code(400);
                            echo json_encode(["message" => "Missing exam_id or group_id for getStudentScores"]);
                        }
                        break;
                    case 'detailed_results':
                        if (isset($_GET['student_id'], $_GET['exam_id'])) {
                            $results = getExamResults((int)$_GET['student_id'], (int)$_GET['exam_id']);
                            echo json_encode(["success" => true, "data" => $results]);
                        } else {
                            http_response_code(400);
                            echo json_encode(["message" => "Missing student_id or exam_id for detailed_results"]);
                        }
                        break;
                    case 'getStudentInfo':
                        if (isset($_GET['student_id'])) {
                            echo json_encode(getStudentInfo((int)$_GET['student_id']));
                        } else {
                            http_response_code(400);
                            echo json_encode(["message" => "Missing student_id for getStudentInfo"]);
                        }
                        break;
                    case 'getExamResults':
                        if (isset($_GET['student_id'], $_GET['exam_id'])) {
                            $results = getExamResults((int)$_GET['student_id'], (int)$_GET['exam_id']);
                            echo json_encode(["success" => true, "data" => $results]);
                        } else {
                            http_response_code(400);
                            echo json_encode(["message" => "Missing student_id or exam_id for getExamResults"]);
                        }
                        break;
                    default:
                        http_response_code(400);
                        echo json_encode(["message" => "Invalid action"]);
                        break;
                }
            } else if (isset($_GET['exam_id'], $_GET['group_id'])) {
                echo json_encode(getStudentScoresByExamAndGroup((int)$_GET['exam_id'], (int)$_GET['group_id']));
            } else {
                http_response_code(400);
                echo json_encode(["message" => "Action not specified or invalid parameters"]);
            }
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
        'message' => 'A critical error occurred in results_api.',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit();
}
?>