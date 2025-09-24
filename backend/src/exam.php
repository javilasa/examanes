<?php
require_once 'config.php';
require_once 'group.php'; // Include group functions
require_once 'question.php'; // Include question functions
require_once 'answer.php'; // Include answer functions

// Create a new exam
function createExam($nombre, $code, $groupIds) {
    $conn = connect();
    $stmt = $conn->prepare("INSERT INTO exams (nombre, code) VALUES (?, ?)");
    $stmt->bind_param("ss", $nombre, $code);
    $stmt->execute();
    $examId = $conn->insert_id; // Get the ID of the newly inserted exam
    $stmt->close();

    // Insert into exam_groups
    if (!empty($groupIds)) {
        $insertGroupStmt = $conn->prepare("INSERT INTO exam_groups (exam_id, group_id) VALUES (?, ?)");
        if ($insertGroupStmt === false) {
            error_log("createExam function - Prepare failed for insert exam_groups: " . $conn->error);
        } else {
            foreach ($groupIds as $groupId) {
                $insertGroupStmt->bind_param("ii", $examId, $groupId);
                if (!$insertGroupStmt->execute()) {
                    error_log("createExam function - Execute failed for insert exam_groups (exam_id: $examId, group_id: $groupId): " . $insertGroupStmt->error);
                }
            }
            $insertGroupStmt->close();
        }
    }
    $conn->close();
}

// Read all exams
function getExams() {
    $conn = connect();
    $result = $conn->query("SELECT id, nombre, code, vigente FROM exams"); // Explicitly select code
    $exams = [];
    while ($row = $result->fetch_assoc()) {
        $row['groups'] = getExamGroups($row['id']); // Get associated groups
        $exams[] = $row;
    }
    $conn->close();
    return $exams;
}

// Update an exam
function updateExam($id, $nombre, $code, $vigente, $groupIds) {
    $conn = connect();
    // Update exams table
    $stmt = $conn->prepare("UPDATE exams SET nombre = ?, code = ?, vigente = ? WHERE id = ?");
    $stmt->bind_param("ssii", $nombre, $code, $vigente, $id);
    $stmt->execute();
    $stmt->close();

    // Delete existing exam_groups for this exam
    $deleteGroupStmt = $conn->prepare("DELETE FROM exam_groups WHERE exam_id = ?");
    if ($deleteGroupStmt === false) {
        error_log("updateExam function - Prepare failed for delete exam_groups: " . $conn->error);
    } else {
        $deleteGroupStmt->bind_param("i", $id);
        if (!$deleteGroupStmt->execute()) {
            error_log("updateExam function - Execute failed for delete exam_groups (exam_id: $id): " . $deleteGroupStmt->error);
        }
        $deleteGroupStmt->close();
    }

    // Insert new exam_groups
    if (!empty($groupIds)) {
        $insertGroupStmt = $conn->prepare("INSERT INTO exam_groups (exam_id, group_id) VALUES (?, ?)");
        if ($insertGroupStmt === false) {
            error_log("updateExam function - Prepare failed for insert exam_groups: " . $conn->error);
        } else {
            foreach ($groupIds as $groupId) {
                $insertGroupStmt->bind_param("ii", $id, $groupId);
                if (!$insertGroupStmt->execute()) {
                    error_log("updateExam function - Execute failed for insert exam_groups (exam_id: $id, group_id: $groupId): " . $insertGroupStmt->error);
                }
            }
            $insertGroupStmt->close();
        }
    }
    $conn->close();
}

// Get groups associated with an exam
function getExamGroups($examId) {
    $conn = connect();
    $stmt = $conn->prepare("SELECT g.id, g.nombre FROM groups g JOIN exam_groups eg ON g.id = eg.group_id WHERE eg.exam_id = ?");
    $stmt->bind_param("i", $examId);
    $stmt->execute();
    $result = $stmt->get_result();
    $groups = [];
    while ($row = $result->fetch_assoc()) {
        $groups[] = $row;
    }
    $stmt->close();
    $conn->close();
    return $groups;
}

// Get exam by code
function getExamByCode($examCode) {
    $conn = connect();
    $stmt = $conn->prepare("SELECT * FROM exams WHERE code = ? AND vigente = 1"); // Use code column
    $stmt->bind_param("s", $examCode); // Bind as string
    $stmt->execute();
    $result = $stmt->get_result();
    $exam = $result->fetch_assoc();
    $stmt->close();

    if ($exam) {
        $exam['groups'] = getExamGroups($exam['id']); // Add associated groups
    }

    $conn->close();
    return $exam;
}

// Get exam details with questions and answers
function getExamDetailsWithQuestionsAndAnswers($examId) {
    $conn = connect();
    $examDetails = null;

    // Get exam basic details
    $stmt = $conn->prepare("SELECT id, nombre, vigente FROM exams WHERE id = ?");
    $stmt->bind_param("i", $examId);
    $stmt->execute();
    $result = $stmt->get_result();
    $exam = $result->fetch_assoc();
    $stmt->close();

    if ($exam) {
        $examDetails = [
            'id' => $exam['id'],
            'nombre' => $exam['nombre'],
            'vigente' => $exam['vigente'],
            'questions' => []
        ];

        // Get questions for the exam
        $stmt = $conn->prepare("SELECT q.id, q.pregunta, q.peso FROM questions q JOIN exam_questions eq ON q.id = eq.question_id WHERE eq.exam_id = ?");
        $stmt->bind_param("i", $examId);
        $stmt->execute();
        $questionsResult = $stmt->get_result();

        while ($questionRow = $questionsResult->fetch_assoc()) {
            $question = [
                'id' => $questionRow['id'],
                'pregunta' => $questionRow['pregunta'],
                'peso' => $questionRow['peso'],
                'answers' => []
            ];

            // Get answers for each question
            $answerStmt = $conn->prepare("SELECT id, respuesta, es_correcta FROM answers WHERE question_id = ?");
            $answerStmt->bind_param("i", $questionRow['id']);
            $answerStmt->execute();
            $answersResult = $answerStmt->get_result();
            while ($answerRow = $answersResult->fetch_assoc()) {
                $question['answers'][] = $answerRow;
            }
            $answerStmt->close();
            $examDetails['questions'][] = $question;
        }
        $stmt->close();
    }
    $conn->close();
    return $examDetails;
}

// Delete an exam
function deleteExam($id) {
    $conn = connect();
    $stmt = $conn->prepare("DELETE FROM exams WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}
?>