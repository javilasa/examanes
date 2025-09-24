<?php
require_once 'config.php';

function getAllExams() {
    $conn = connect();
    $sql = "SELECT id, nombre FROM exams";
    $result = $conn->query($sql);

    $exams = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $exams[] = $row;
        }
    }
    $conn->close();
    return $exams;
}

function getAllGroups() {
    $conn = connect();
    $sql = "SELECT id, nombre FROM groups";
    $result = $conn->query($sql);

    $groups = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $groups[] = $row;
        }
    }
    $conn->close();
    return $groups;
}

function getStudentScoresByExamAndGroup($examId, $groupId) {
    $conn = connect();
    $sql = "
        SELECT
            s.id AS id,
            s.nombre AS nombre,
            s.codigo AS codigo,
            SUM(CASE WHEN a.es_correcta = TRUE AND sa.answer_id = a.id THEN q.peso ELSE 0 END) AS score,
            (SELECT COUNT(*) FROM exam_incidents ei WHERE ei.student_id = s.id AND ei.exam_id = ?) as incident_count
        FROM
            students s
        JOIN
            student_groups sg ON s.id = sg.student_id
        JOIN
            groups g ON sg.group_id = g.id
        LEFT JOIN
            student_answers sa ON s.id = sa.student_id AND sa.examen_id = ?
        LEFT JOIN
            questions q ON sa.question_id = q.id
        LEFT JOIN
            answers a ON sa.answer_id = a.id
        WHERE
            g.id = ?
        GROUP BY
            s.id, s.nombre, s.codigo
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iii", $examId, $examId, $groupId);
    $stmt->execute();
    $result = $stmt->get_result();

    $scores = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $baseScore = $row['score'] ?? 0;
            $incidents = $row['incident_count'] ?? 0;
            $penalty = $baseScore * 0.20 * $incidents;
            $finalScore = $baseScore - $penalty;
            if ($finalScore < 0) {
                $finalScore = 0;
            }
            $row['score'] = $finalScore;
            $scores[] = $row;
        }
    }
    $stmt->close();
    $conn->close();
    return $scores;
}

function getStudentDetailedAnswers($studentId, $examId) {
    $conn = connect();
    $sql = "
        SELECT
            q.id AS question_id,
            q.pregunta,
            q.peso AS peso_pregunta,
            sa.answer_id AS student_answer_id,
            ans_student.respuesta AS respuesta_estudiante,
            ans_student.es_correcta AS es_correcta_estudiante,
            ans_correct.respuesta AS respuesta_correcta
        FROM
            questions q
        LEFT JOIN
            student_answers sa ON q.id = sa.question_id AND sa.student_id = ? AND sa.examen_id = ?
        LEFT JOIN
            answers ans_student ON sa.answer_id = ans_student.id
        LEFT JOIN
            answers ans_correct ON q.id = ans_correct.question_id AND ans_correct.es_correcta = TRUE
        WHERE
            q.examen_id = ?
        ORDER BY q.id
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iii", $studentId, $examId, $examId);
    $stmt->execute();
    $result = $stmt->get_result();

    $answers = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $answers[] = $row;
        }
    }
    $stmt->close();
    $conn->close();
    return $answers;
}

function getStudentInfo($studentId) {
    $conn = connect();
    $sql = "SELECT id, codigo, nombre FROM students WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $studentInfo = $result->fetch_assoc();
    $stmt->close();
    $conn->close();
    return $studentInfo;
}

function getExamName($examId) {
    $conn = connect();
    $sql = "SELECT nombre FROM exams WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $examId);
    $stmt->execute();
    $result = $stmt->get_result();
    $examName = $result->fetch_assoc();
    $stmt->close();
    $conn->close();
    return $examName ? $examName['nombre'] : null;
}

function saveStudentAnswer($studentId, $examId, $questionId, $answerId) {
    $conn = connect();
    error_log("Attempting to save student answer: student_id=$studentId, exam_id=$examId, question_id=$questionId, answer_id=$answerId, Timestamp=" . date("Y-m-d H:i:s"));

    // Check if an answer already exists for this student, exam, and question
    $checkStmt = $conn->prepare("SELECT id FROM student_answers WHERE student_id = ? AND examen_id = ? AND question_id = ?");
    if ($checkStmt === false) {
        error_log("saveStudentAnswer - checkStmt prepare failed: " . $conn->error);
        $conn->close();
        return false;
    }
    $checkStmt->bind_param("iii", $studentId, $examId, $questionId);
    if (!$checkStmt->execute()) {
        error_log("saveStudentAnswer - checkStmt execute failed: " . $checkStmt->error);
        $checkStmt->close();
        $conn->close();
        return false;
    }
    $result = $checkStmt->get_result();
    $existingAnswer = $result->fetch_assoc();
    $checkStmt->close();

    if ($existingAnswer) {
        // Update existing answer
        $updateStmt = $conn->prepare("UPDATE student_answers SET answer_id = ? WHERE id = ?");
        if ($updateStmt === false) {
            error_log("saveStudentAnswer - updateStmt prepare failed: " . $conn->error);
            $conn->close();
            return false;
        }
        $updateStmt->bind_param("ii", $answerId, $existingAnswer['id']);
        if (!$updateStmt->execute()) {
            error_log("saveStudentAnswer - updateStmt execute failed: " . $updateStmt->error);
            $updateStmt->close();
            $conn->close();
            return false;
        }
        $updateStmt->close();
    } else {
        // Insert new answer
        $insertStmt = $conn->prepare("INSERT INTO student_answers (student_id, examen_id, question_id, answer_id) VALUES (?, ?, ?, ?)");
        if ($insertStmt === false) {
            error_log("saveStudentAnswer - insertStmt prepare failed: " . $conn->error);
            $conn->close();
            return false;
        }
        $insertStmt->bind_param("iiii", $studentId, $examId, $questionId, $answerId);
        if (!$insertStmt->execute()) {
            error_log("saveStudentAnswer - insertStmt execute failed: " . $insertStmt->error);
            $insertStmt->close();
            $conn->close();
            return false;
        }
        $insertStmt->close();
    }

    $conn->close();
    return true;
}

// Get questions for a given exam that a student has not yet answered
function getRemainingQuestionsForStudent($studentId, $examId) {
    $conn = connect();
    $questions = [];

    // Select questions from the exam that are NOT in student_answers for this student
    $sql = "
        SELECT
            q.id,
            q.pregunta,
            q.peso
        FROM
            questions q
        LEFT JOIN
            student_answers sa ON q.id = sa.question_id AND sa.student_id = ? AND sa.examen_id = ?
        WHERE
            q.examen_id = ? AND sa.question_id IS NULL
        ORDER BY RAND()
    ";

    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        error_log("getRemainingQuestionsForStudent - prepare failed: " . $conn->error);
        $conn->close();
        return [];
    }
    $stmt->bind_param("iii", $studentId, $examId, $examId);
    if (!$stmt->execute()) {
        error_log("getRemainingQuestionsForStudent - execute failed: " . $stmt->error);
        $stmt->close();
        $conn->close();
        return [];
    }
    $result = $stmt->get_result();

    while ($questionRow = $result->fetch_assoc()) {
        $question = [
            'id' => $questionRow['id'],
            'pregunta' => $questionRow['pregunta'],
            'peso' => $questionRow['peso'],
            'answers' => []
        ];

        // Get answers for each question
        $answerStmt = $conn->prepare("SELECT id, respuesta, es_correcta FROM answers WHERE question_id = ? ORDER BY RAND()");
        if ($answerStmt === false) {
            error_log("getRemainingQuestionsForStudent - answerStmt prepare failed: " . $conn->error);
            continue; // Skip this question if answers can't be fetched
        }
        $answerStmt->bind_param("i", $questionRow['id']);
        if (!$answerStmt->execute()) {
            error_log("getRemainingQuestionsForStudent - answerStmt execute failed: " . $answerStmt->error);
            $answerStmt->close();
            continue; // Skip this question if answers can't be fetched
        }
        $answersResult = $answerStmt->get_result();
        while ($answerRow = $answersResult->fetch_assoc()) {
            $question['answers'][] = $answerRow;
        }
        $answerStmt->close();
        $questions[] = $question;
    }
    $stmt->close();
    $conn->close();
    return $questions;
}

function getIncidentCount($studentId, $examId) {
    $conn = connect();
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM exam_incidents WHERE student_id = ? AND exam_id = ?");
    $stmt->bind_param("ii", $studentId, $examId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    $conn->close();
    return $row['count'] ?? 0;
}

function getExamResults($studentId, $examId) {
    $studentInfo = getStudentInfo($studentId);
    $detailedAnswers = getStudentDetailedAnswers($studentId, $examId);
    $examName = getExamName($examId);
    $incidentCount = getIncidentCount($studentId, $examId);

    $totalScore = 0;
    foreach ($detailedAnswers as $answer) {
        if (isset($answer['es_correcta_estudiante']) && $answer['es_correcta_estudiante'] == 1) {
            $totalScore += $answer['peso_pregunta'];
        }
    }

    return [
        "student" => $studentInfo,
        "exam_name" => $examName,
        "results" => $detailedAnswers,
        "total_score" => $totalScore,
        "incident_count" => $incidentCount
    ];
}

?>