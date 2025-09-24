<?php
require_once 'config.php';

function createExamIncident($studentId, $examId, $incidentType) {
    $conn = null;
    $stmt = null;
    try {
        $conn = connect();
        $stmt = $conn->prepare("INSERT INTO exam_incidents (student_id, exam_id, incident_type) VALUES (?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        $stmt->bind_param("iis", $studentId, $examId, $incidentType);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        return true;
    } catch (Exception $e) {
        // Log error to a file or monitoring system
        error_log($e->getMessage());
        return $e->getMessage(); // Return error message on failure
    } finally {
        if ($stmt) {
            $stmt->close();
        }
        if ($conn) {
            $conn->close();
        }
    }
}
?>