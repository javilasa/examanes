<?php
require_once 'config.php';

// --- CRUD for laboratorios ---

function createLaboratorio($nombre, $codigo, $activo, $groupIds = []) {
    $conn = connect();
    $stmt = $conn->prepare("INSERT INTO laboratorios (nombre, codigo, activo) VALUES (?, ?, ?)");
    $stmt->bind_param("ssi", $nombre, $codigo, $activo);
    $stmt->execute();
    $laboratorioId = $conn->insert_id;
    $stmt->close();

    if (!empty($groupIds)) {
        $stmt = $conn->prepare("INSERT INTO laboratorios_grupos (id_laboratorio, id_grupo) VALUES (?, ?)");
        foreach ($groupIds as $groupId) {
            $stmt->bind_param("ii", $laboratorioId, $groupId);
            $stmt->execute();
        }
        $stmt->close();
    }
    $conn->close();
    return $laboratorioId;
}

function getLaboratorios() {
    $conn = connect();
    $laboratorios = $conn->query("SELECT * FROM laboratorios")->fetch_all(MYSQLI_ASSOC);
    $labGroups = $conn->query("SELECT lg.id_laboratorio, g.id, g.nombre FROM laboratorios_grupos lg JOIN groups g ON lg.id_grupo = g.id")->fetch_all(MYSQLI_ASSOC);

    $groupMap = [];
    foreach ($labGroups as $labGroup) {
        $groupMap[$labGroup['id_laboratorio']][] = ['id' => $labGroup['id'], 'nombre' => $labGroup['nombre']];
    }

    foreach ($laboratorios as &$laboratorio) {
        $laboratorio['groups'] = $groupMap[$laboratorio['id_laboratorio']] ?? [];
    }

    $conn->close();
    return $laboratorios;
}

function getLaboratorioById($id) {
    $conn = connect();
    $stmt = $conn->prepare("SELECT * FROM laboratorios WHERE id_laboratorio = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $laboratorio = $result->fetch_assoc();
    $stmt->close();

    if ($laboratorio) {
        $laboratorio['groups'] = getGruposForLaboratorio($id);
    }

    $conn->close();
    return $laboratorio;
}

function updateLaboratorio($id, $nombre, $codigo, $activo, $groupIds = []) {
    $conn = connect();
    $stmt = $conn->prepare("UPDATE laboratorios SET nombre = ?, codigo = ?, activo = ? WHERE id_laboratorio = ?");
    $stmt->bind_param("ssii", $nombre, $codigo, $activo, $id);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("DELETE FROM laboratorios_grupos WHERE id_laboratorio = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();

    if (!empty($groupIds)) {
        $stmt = $conn->prepare("INSERT INTO laboratorios_grupos (id_laboratorio, id_grupo) VALUES (?, ?)");
        foreach ($groupIds as $groupId) {
            $stmt->bind_param("ii", $id, $groupId);
            $stmt->execute();
        }
        $stmt->close();
    }
    $conn->close();
    return true;
}

function deleteLaboratorio($id) {
    $conn = connect();
    $stmt = $conn->prepare("DELETE FROM laboratorios WHERE id_laboratorio = ?");
    $stmt->bind_param("i", $id);
    $success = $stmt->execute();
    $stmt->close();
    $conn->close();
    return $success;
}

// --- CRUD for laboratorios_grupos ---

function assignLaboratorioToGrupo($id_laboratorio, $id_grupo) {
    $conn = connect();
    $stmt = $conn->prepare("INSERT INTO laboratorios_grupos (id_laboratorio, id_grupo) VALUES (?, ?)");
    $stmt->bind_param("ii", $id_laboratorio, $id_grupo);
    $stmt->execute();
    $id = $conn->insert_id;
    $stmt->close();
    $conn->close();
    return $id;
}

function getGruposForLaboratorio($id_laboratorio) {
    $conn = connect();
    $stmt = $conn->prepare("SELECT g.* FROM groups g JOIN laboratorios_grupos lg ON g.id = lg.id_grupo WHERE lg.id_laboratorio = ?");
    $stmt->bind_param("i", $id_laboratorio);
    $stmt->execute();
    $result = $stmt->get_result();
    $grupos = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $conn->close();
    return $grupos;
}

function removeLaboratorioFromGrupo($id_laboratorio, $id_grupo) {
    $conn = connect();
    $stmt = $conn->prepare("DELETE FROM laboratorios_grupos WHERE id_laboratorio = ? AND id_grupo = ?");
    $stmt->bind_param("ii", $id_laboratorio, $id_grupo);
    $success = $stmt->execute();
    $stmt->close();
    $conn->close();
    return $success;
}

// --- CRUD for items_laboratorio ---

function createItemLaboratorio($id_laboratorio, $nombre_archivo) {
    $conn = connect();
    $stmt = $conn->prepare("INSERT INTO items_laboratorio (id_laboratorio, nombre_archivo) VALUES (?, ?)");
    $stmt->bind_param("is", $id_laboratorio, $nombre_archivo);
    $stmt->execute();
    $id = $conn->insert_id;
    $stmt->close();
    $conn->close();
    return $id;
}

function getItemsForLaboratorio($id_laboratorio) {
    $conn = connect();
    $stmt = $conn->prepare("SELECT * FROM items_laboratorio WHERE id_laboratorio = ?");
    $stmt->bind_param("i", $id_laboratorio);
    $stmt->execute();
    $result = $stmt->get_result();
    $items = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $conn->close();
    return $items;
}

function updateItemLaboratorio($id_item, $nombre_archivo) {
    $conn = connect();
    $stmt = $conn->prepare("UPDATE items_laboratorio SET nombre_archivo = ? WHERE id_item = ?");
    $stmt->bind_param("si", $nombre_archivo, $id_item);
    $success = $stmt->execute();
    $stmt->close();
    $conn->close();
    return $success;
}

function deleteItemLaboratorio($id_item) {
    $conn = connect();
    $stmt = $conn->prepare("DELETE FROM items_laboratorio WHERE id_item = ?");
    $stmt->bind_param("i", $id_item);
    $success = $stmt->execute();
    $stmt->close();
    $conn->close();
    return $success;
}

// --- CRUD for student_items ---

function assignItemToStudent($id_student, $id_item, $relative_path) {
    $conn = connect();
    $stmt = $conn->prepare("INSERT INTO student_items (id_student, id_item, relative_path) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $id_student, $id_item, $relative_path);
    $stmt->execute();
    $id = $conn->insert_id;
    $stmt->close();
    $conn->close();
    return $id;
}

function getItemsForStudent($id_student) {
    $conn = connect();
    $stmt = $conn->prepare("SELECT i.*, si.relative_path FROM items_laboratorio i JOIN student_items si ON i.id_item = si.id_item WHERE si.id_student = ?");
    $stmt->bind_param("i", $id_student);
    $stmt->execute();
    $result = $stmt->get_result();
    $items = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $conn->close();
    return $items;
}

function updateStudentItemPath($id, $relative_path) {
    $conn = connect();
    $stmt = $conn->prepare("UPDATE student_items SET relative_path = ? WHERE id = ?");
    $stmt->bind_param("si", $relative_path, $id);
    $success = $stmt->execute();
    $stmt->close();
    $conn->close();
    return $success;
}

function deleteStudentItem($id) {
    $conn = connect();
    $stmt = $conn->prepare("DELETE FROM student_items WHERE id = ?");
    $stmt->bind_param("i", $id);
    $success = $stmt->execute();
    $stmt->close();
    $conn->close();
    return $success;
}

// --- Laboratorio Notas (New Functionality) ---

function createOrUpdateNota($id_laboratorio, $id_student, $nota) {
    $conn = connect();
    $stmt = $conn->prepare("INSERT INTO laboratorio_nota (id_laboratorio, id_student, nota) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE nota = VALUES(nota)");
    $stmt->bind_param("iid", $id_laboratorio, $id_student, $nota);
    $success = $stmt->execute();
    $stmt->close();
    $conn->close();
    return $success;
}

function getReviewData($id_laboratorio, $id_grupo) {
    $conn = connect();
    $stmt = $conn->prepare("
        SELECT s.id as student_id, s.nombre as student_name, s.codigo as student_code,
               (SELECT GROUP_CONCAT(si.relative_path SEPARATOR ', ') 
                FROM student_items si JOIN items_laboratorio il ON si.id_item = il.id_item 
                WHERE si.id_student = s.id AND il.id_laboratorio = ?) as submitted_files,
               ln.nota
        FROM students s
        JOIN student_groups sg ON s.id = sg.student_id
        LEFT JOIN laboratorio_nota ln ON s.id = ln.id_student AND ln.id_laboratorio = ?
        WHERE sg.group_id = ?
    ");
    $stmt->bind_param("iii", $id_laboratorio, $id_laboratorio, $id_grupo);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $conn->close();
    return $data;
}

?>