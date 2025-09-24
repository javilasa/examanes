<?php
require_once 'config.php';

// Create a new group
function createGroup($nombre) {
    $conn = connect();
    $stmt = $conn->prepare("INSERT INTO groups (nombre) VALUES (?)");
    $stmt->bind_param("s", $nombre);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}

// Read all groups
function getGroups() {
    $conn = connect();
    $result = $conn->query("SELECT * FROM groups");
    $groups = [];
    while ($row = $result->fetch_assoc()) {
        $groups[] = $row;
    }
    $conn->close();
    return $groups;
}

// Update a group
function updateGroup($id, $nombre) {
    $conn = connect();
    $stmt = $conn->prepare("UPDATE groups SET nombre = ? WHERE id = ?");
    $stmt->bind_param("si", $nombre, $id);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}

// Delete a group
function deleteGroup($id) {
    $conn = connect();
    $stmt = $conn->prepare("DELETE FROM groups WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}

// Associate a student with groups
function setStudentGroups($student_id, $group_ids) {
    $conn = connect();
    // First, remove all existing associations for the student
    $stmt = $conn->prepare("DELETE FROM student_groups WHERE student_id = ?");
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $stmt->close();

    // Then, add new associations
    if (!empty($group_ids)) {
        $stmt = $conn->prepare("INSERT INTO student_groups (student_id, group_id) VALUES (?, ?)");
        foreach ($group_ids as $group_id) {
            $stmt->bind_param("ii", $student_id, $group_id);
            $stmt->execute();
        }
        $stmt->close();
    }
    $conn->close();
}

// Get groups for a specific student
function getStudentGroups($student_id) {
    $conn = connect();
    $stmt = $conn->prepare("SELECT g.id, g.nombre FROM groups g JOIN student_groups sg ON g.id = sg.group_id WHERE sg.student_id = ?");
    $stmt->bind_param("i", $student_id);
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

?>