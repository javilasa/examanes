<?php
require_once 'config.php';
require_once 'group.php'; // Include group functions

// Create a new student
function createStudent($codigo, $nombre, $groupIds) {
    $conn = connect();
    // Remove 'grupo' column from students table insert
    $stmt = $conn->prepare("INSERT INTO students (codigo, nombre) VALUES (?, ?)");
    $stmt->bind_param("ss", $codigo, $nombre);
    $stmt->execute();
    $studentId = $conn->insert_id; // Get the ID of the newly inserted student
    $stmt->close();

    // Insert into student_groups
    if (!empty($groupIds)) {
        $insertGroupStmt = $conn->prepare("INSERT INTO student_groups (student_id, group_id) VALUES (?, ?)");
        foreach ($groupIds as $groupId) {
            $insertGroupStmt->bind_param("ii", $studentId, $groupId);
            $insertGroupStmt->execute();
        }
        $insertGroupStmt->close();
    }
    $conn->close();
}

// Read all students
function getStudents() {
    $conn = connect();
    $result = $conn->query("SELECT id, codigo, nombre FROM students"); // Removed 'grupo' from select
    $students = [];
    while ($row = $result->fetch_assoc()) {
        // Assuming getStudentGroups returns an array of group objects {id, nombre}
        $row['groups'] = getStudentGroups($row['id']);
        $students[] = $row;
    }
    $conn->close();
    return $students;
}

// Get student by code
function getStudentByCode($studentCode) {
    $conn = connect();
    $stmt = $conn->prepare("SELECT id, codigo, nombre FROM students WHERE codigo = ?");
    $stmt->bind_param("s", $studentCode);
    $stmt->execute();
    $result = $stmt->get_result();
    $student = $result->fetch_assoc();
    $stmt->close();

    if ($student) {
        $student['groups'] = getStudentGroups($student['id']); // Add associated groups
    }

    $conn->close();
    return $student;
}

// Update a student
function updateStudent($id, $codigo, $nombre, $groupIds) {
    error_log("updateStudent function - studentId: " . $id . ", groupIds: " . print_r($groupIds, true)); // Debugging
    $conn = connect();
    // Update students table (removed 'grupo' column)
    $stmt = $conn->prepare("UPDATE students SET codigo = ?, nombre = ? WHERE id = ?");
    $stmt->bind_param("ssi", $codigo, $nombre, $id);
    $stmt->execute();
    $stmt->close();

    // Delete existing student_groups for this student


    // Insert new student_groups
    error_log("updateStudent function - groupIds content before insertion: " . print_r($groupIds, true)); // More detailed debugging
    if (!empty($groupIds)) {
        $deleteGroupStmt = $conn->prepare("DELETE FROM student_groups WHERE student_id = ?"); // Delete existing student_groups for this student                    º
        $deleteGroupStmt->bind_param("i", $id);
        $deleteGroupStmt->execute();
        $deleteGroupStmt->close();

        $insertGroupStmt = $conn->prepare("INSERT INTO student_groups (student_id, group_id) VALUES (?, ?)");
        if ($insertGroupStmt === false) {
            error_log("updateStudent function - Prepare failed for insert student_groups: " . $conn->error);
        } else {
            foreach ($groupIds as $groupId) {
                $insertGroupStmt->bind_param("ii", $id, $groupId);
                if (!$insertGroupStmt->execute()) {
                    error_log("updateStudent function - Execute failed for insert student_groups (student_id: $id, group_id: $groupId): " . $insertGroupStmt->error);
                }
            }
            $insertGroupStmt->close();
        }
    } else {
        error_log("updateStudent function - groupIds is empty, no student_groups to insert.");
    }
    $conn->close();
}

// Delete a student
function deleteStudent($id) {
    $conn = connect();
    $stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}
?>