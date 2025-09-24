<?php
require_once 'config.php';

// Create a new question
function createQuestion($examen_id, $pregunta, $peso) {
    $conn = connect();
    // Log the data before insertion
    error_log("Attempting to create question: examen_id=$examen_id, pregunta=$pregunta, peso=$peso, Timestamp=" . date("Y-m-d H:i:s"));
    $stmt = $conn->prepare("INSERT INTO questions (examen_id, pregunta, peso) VALUES (?, ?, ?)");
    $stmt->bind_param("isd", $examen_id, $pregunta, $peso);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}

// Read all questions for an exam
function getQuestions($examen_id) {
    $conn = connect();
    $stmt = $conn->prepare("SELECT * FROM questions WHERE examen_id = ?");
    $stmt->bind_param("i", $examen_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $questions = [];
    while ($row = $result->fetch_assoc()) {
        $questions[] = $row;
    }
    $stmt->close();
    $conn->close();
    return $questions;
}

// Update a question
function updateQuestion($id, $pregunta, $peso) {
    $conn = connect();
    $stmt = $conn->prepare("UPDATE questions SET pregunta = ?, peso = ? WHERE id = ?");
    $stmt->bind_param("sdi", $pregunta, $peso, $id);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}

// Delete a question
function deleteQuestion($id) {
    $conn = connect();
    $stmt = $conn->prepare("DELETE FROM questions WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}
?>