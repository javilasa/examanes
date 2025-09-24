<?php
require_once '../src/exam.php';
require_once '../src/student.php';
require_once '../src/question.php';
require_once '../src/answer.php';
require_once '../src/results.php'; // Include results.php for saveStudentAnswer and getRemainingQuestionsForStudent

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

// Removed JWT validation for public API

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['action']) ? $_GET['action'] : (isset($data['action']) ? $data['action'] : ''); // Get action from GET or POST


switch ($method) {
    case 'GET':
        switch ($action) {
            case 'getExamByCode':
                if (isset($_GET['code'])) {
                    $examCode = $_GET['code'];
                    $exam = getExamByCode($examCode);
                    if ($exam) {
                        echo json_encode(["success" => true, "exam" => $exam]);
                    } else {
                        echo json_encode(["success" => false, "message" => "Examen no encontrado."]);
                    }
                } else {
                    echo json_encode(["success" => false, "message" => "Código de examen no proporcionado."]);
                }
                break;
            case 'getStudentByCode':
                if (isset($_GET['code'])) {
                    $studentCode = $_GET['code'];
                    $student = getStudentByCode($studentCode);
                    if ($student) {
                        echo json_encode(["success" => true, "student" => $student]);
                    } else {
                        echo json_encode(["success" => false, "message" => "Estudiante no encontrado."]);
                    }
                } else {
                    echo json_encode(["success" => false, "message" => "Código de estudiante no proporcionado."]);
                }
                break;
            case 'getExamQuestions':
                if (isset($_GET['exam_id'])) {
                    $examId = $_GET['exam_id'];
                    $examDetails = getExamDetailsWithQuestionsAndAnswers($examId);
                    if ($examDetails) {
                        echo json_encode(["success" => true, "questions" => $examDetails['questions']]);
                    } else {
                        echo json_encode(["success" => false, "message" => "No se encontraron preguntas para este examen."]);
                    }
                } else {
                    echo json_encode(["success" => false, "message" => "ID de examen no proporcionado."]);
                }
                break;
            case 'getRemainingQuestions':
                if (isset($_GET['student_id']) && isset($_GET['exam_id'])) {
                    $studentId = $_GET['student_id'];
                    $examId = $_GET['exam_id'];
                    $remainingQuestions = getRemainingQuestionsForStudent($studentId, $examId);
                    if (!empty($remainingQuestions)) {
                        echo json_encode(["success" => true, "status" => "resume", "questions" => $remainingQuestions]);
                    } else {
                        echo json_encode(["success" => true, "status" => "completed"]);
                    }
                } else {
                    echo json_encode(["success" => false, "message" => "student_id and exam_id are required."]);
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
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
        break;
}
?>