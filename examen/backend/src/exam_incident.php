<?php
require_once 'config.php';

function createExamIncident($studentId, $examId, $incidentType) {
    $conn = connect();
    $stmt = $conn->prepare("INSERT INTO exam_incidents (student_id, exam_id, incident_type) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $studentId, $examId, $incidentType);
    $success = $stmt->execute();
    $stmt->close();
    $conn->close();
    return $success;
}
?>