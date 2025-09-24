<?php
require_once '../src/results.php';
require_once '../src/jwt.php';

header("Content-Type: application/json");

// Removed JWT validation for public API

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
                    if (isset($_GET['exam_id']) && isset($_GET['group_id'])) {
                        $examId = (int)$_GET['exam_id'];
                        $groupId = (int)$_GET['group_id'];
                        echo json_encode(getStudentScoresByExamAndGroup($examId, $groupId));
                    } else {
                        http_response_code(400);
                        echo json_encode(["message" => "Missing exam_id or group_id for getStudentScores"]);
                    }
                    break;
                case 'detailed_results':
                    if (isset($_GET['student_id']) && isset($_GET['exam_id'])) {
                        $studentId = (int)$_GET['student_id'];
                        $examId = (int)$_GET['exam_id'];
                        $results = getExamResults($studentId, $examId);
                        echo json_encode(["success" => true, "data" => $results]);
                    } else {
                        http_response_code(400);
                        echo json_encode(["message" => "Missing student_id or exam_id for detailed_results"]);
                    }
                    break;
                case 'getStudentInfo':
                    if (isset($_GET['student_id'])) {
                        $studentId = (int)$_GET['student_id'];
                        echo json_encode(getStudentInfo($studentId));
                    } else {
                        http_response_code(400);
                        echo json_encode(["message" => "Missing student_id for getStudentInfo"]);
                    }
                    break;
                case 'getExamResults': // New case for public exam results
                    if (isset($_GET['student_id']) && isset($_GET['exam_id'])) {
                        $studentId = (int)$_GET['student_id'];
                        $examId = (int)$_GET['exam_id'];
                        $results = getExamResults($studentId, $examId);
                        echo json_encode(["success" => true, "data" => $results]); // Changed 'results' to 'data' for consistency
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
        } else if (isset($_GET['exam_id']) && isset($_GET['group_id'])) { // New condition for admin.js request
            $examId = (int)$_GET['exam_id'];
            $groupId = (int)$_GET['group_id'];
            echo json_encode(getStudentScoresByExamAndGroup($examId, $groupId));
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