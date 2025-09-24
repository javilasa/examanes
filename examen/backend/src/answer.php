<?php
require_once 'config.php';

// Create a new answer
function createAnswer($question_id, $respuesta, $es_correcta) {
    $conn = connect();
    // Log the data before insertion
    error_log("Attempting to create answer: question_id=$question_id, respuesta=$respuesta, es_correcta=$es_correcta, Timestamp=" . date("Y-m-d H:i:s"));
    $stmt = $conn->prepare("INSERT INTO answers (question_id, respuesta, es_correcta) VALUES (?, ?, ?)");
    $stmt->bind_param("isi", $question_id, $respuesta, $es_correcta);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}

// Read all answers for a question
function getAnswers($question_id) {
    $conn = connect();
    $stmt = $conn->prepare("SELECT * FROM answers WHERE question_id = ?");
    $stmt->bind_param("i", $question_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $answers = [];
    while ($row = $result->fetch_assoc()) {
        $answers[] = $row;
    }
    $stmt->close();
    $conn->close();
    return $answers;
}

// Update an answer
function updateAnswer($id, $respuesta, $es_correcta) {
    $conn = connect();
    $stmt = $conn->prepare("UPDATE answers SET respuesta = ?, es_correcta = ? WHERE id = ?");
    $stmt->bind_param("sii", $respuesta, $es_correcta, $id);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}

// Delete an answer
function deleteAnswer($id) {
    $conn = connect();
    $stmt = $conn->prepare("DELETE FROM answers WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}
?>