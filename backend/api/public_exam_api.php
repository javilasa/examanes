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
    require_once '../src/exam.php';
    require_once '../src/student.php';
    require_once '../src/question.php';
    require_once '../src/answer.php';
    require_once '../src/results.php';

    header("Content-Type: application/json");

    // CORS headers
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
    }
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
        exit(0);
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $data = json_decode(file_get_contents('php://input'), true);
    $action = isset($_GET['action']) ? $_GET['action'] : ($data['action'] ?? '');

    switch ($method) {
        case 'GET':
            switch ($action) {
                case 'getExamByCode':
                    if (isset($_GET['code'])) {
                        $exam = getExamByCode($_GET['code']);
                        echo json_encode($exam ? ["success" => true, "exam" => $exam] : ["success" => false, "message" => "Examen no encontrado."]);
                    } else {
                        echo json_encode(["success" => false, "message" => "Código de examen no proporcionado."]);
                    }
                    break;
                case 'getStudentByCode':
                    if (isset($_GET['code'])) {
                        $student = getStudentByCode($_GET['code']);
                        echo json_encode($student ? ["success" => true, "student" => $student] : ["success" => false, "message" => "Estudiante no encontrado."]);
                    } else {
                        echo json_encode(["success" => false, "message" => "Código de estudiante no proporcionado."]);
                    }
                    break;
                case 'getExamQuestions':
                    if (isset($_GET['exam_id'])) {
                        $examDetails = getExamDetailsWithQuestionsAndAnswers($_GET['exam_id']);
                        echo json_encode($examDetails ? ["success" => true, "questions" => $examDetails['questions']] : ["success" => false, "message" => "No se encontraron preguntas para este examen."]);
                    } else {
                        echo json_encode(["success" => false, "message" => "ID de examen no proporcionado."]);
                    }
                    break;
                case 'getRemainingQuestions':
                    if (isset($_GET['student_id'], $_GET['exam_id'])) {
                        $remainingQuestions = getRemainingQuestionsForStudent($_GET['student_id'], $_GET['exam_id']);
                        echo json_encode(!empty($remainingQuestions) ? ["success" => true, "status" => "resume", "questions" => $remainingQuestions] : ["success" => true, "status" => "completed"]);
                    } else {
                        echo json_encode(["success" => false, "message" => "student_id and exam_id are required."]);
                    }
                    break;
                case 'validateExamStudent':
                    if (isset($_GET['exam_code']) && isset($_GET['student_code'])) {
                        $examCode = $_GET['exam_code'];
                        $studentCode = $_GET['student_code'];

                        // 1. Validate Exam Existence and Vigencia (Error 100)
                        $exam = getExamByCode($examCode);
                        if (!$exam) {
                            echo json_encode(["success" => false, "error_code" => 100, "message" => "Examen no encontrado o no vigente."]);
                            break;
                        }

                        // 2. Validate Student Existence (Error 300)
                        $student = getStudentByCode($studentCode);
                        if (!$student) {
                            echo json_encode(["success" => false, "error_code" => 300, "message" => "Estudiante no encontrado."]);
                            break;
                        }

                        // 3. Validate Group Match (Error 400)
                        $examGroupIds = array_map(function($group) { return $group['id']; }, $exam['groups']);
                        $studentGroupIds = array_map(function($group) { return $group['id']; }, $student['groups']);

                        $commonGroups = array_intersect($examGroupIds, $studentGroupIds);

                        if (empty($commonGroups)) {
                            echo json_encode(["success" => false, "error_code" => 400, "message" => "El estudiante no pertenece a un grupo asociado con este examen."]);
                            break;
                        }

                        // All validations passed, return exam information
                        echo json_encode(["success" => true, "exam" => $exam]);

                    } else {
                        echo json_encode(["success" => false, "message" => "Códigos de examen y estudiante no proporcionados."]);
                    }
                    break;
                default:
                    http_response_code(400);
                    echo json_encode(["success" => false, "message" => "Acción GET no válida."]);
                    break;
            }
            break;
        case 'POST':
            if ($action === 'saveStudentAnswer') {
                saveStudentAnswer($data['student_id'], $data['exam_id'], $data['question_id'], $data['answer_id']);
                echo json_encode(["success" => true, "message" => "Answer saved successfully"]);
            } else {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Acción POST no válida."]);
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Method not allowed"]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'A critical error occurred in public_exam_api.',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit();
}
?>