<?php
require_once '../src/config.php';
require_once '../src/laboratorio.php';

header("Content-Type: application/json");

// CORS headers
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {" . $_SERVER['HTTP_ORIGIN'] . "}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: POST, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {" . $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] . "}");
    exit(0);
}

$conn = connect();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action']) && $_POST['action'] == 'upload_file') {
        handleFileUpload($conn);
    } else {
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['action']) && $data['action'] == 'get_lab_for_student') {
            getLabForStudent($conn, $data);
        }
        if (isset($data['action']) && $data['action'] == 'get_laboratorios_files') {
            $idLaboratorio = isset($data['idLaboratorio']) ? $data['idLaboratorio'] : null;
            $result = getLaboratoriosResult($idLaboratorio);
            echo json_encode($result);
            exit;
        }
    }
    
}

function getLabForStudent($conn, $data) {
    $labCode = $data['lab_code'];
    $studentCode = $data['student_code'];

    // 1. Find lab
    $stmt = $conn->prepare("SELECT * FROM laboratorios WHERE codigo = ?");
    $stmt->bind_param("s", $labCode);
    $stmt->execute();
    $lab = $stmt->get_result()->fetch_assoc();
    if (!$lab) {
        echo json_encode(['error' => 'Examen no Válido']);
        exit;
    }

    // 2. Find student
    $stmt = $conn->prepare("SELECT * FROM students WHERE codigo = ?");
    $stmt->bind_param("s", $studentCode);
    $stmt->execute();
    $student = $stmt->get_result()->fetch_assoc();
    if (!$student) {
        echo json_encode(['error' => 'Estudiante no válido']);
        exit;
    }

    // 3. Check if lab is active
    if ($lab['activo'] != 1) {
        // Lab is not active, but we still return data for read-only view
    }

    // 4. Check group membership
    $stmt = $conn->prepare("SELECT group_id FROM student_groups WHERE student_id = ?");
    $stmt->bind_param("i", $student['id']);
    $stmt->execute();
    $studentGroups = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $studentGroupIds = array_column($studentGroups, 'group_id');

    $stmt = $conn->prepare("SELECT id_grupo FROM laboratorios_grupos WHERE id_laboratorio = ?");
    $stmt->bind_param("i", $lab['id_laboratorio']);
    $stmt->execute();
    $labGroups = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $labGroupIds = array_column($labGroups, 'id_grupo');

    $intersection = array_intersect($studentGroupIds, $labGroupIds);
    if (empty($intersection)) {
        echo json_encode(['error' => 'Estudiante no pertenece al grupo del examen']);
        exit;
    }

    // 5. Get lab items and student submissions
    $stmt = $conn->prepare("
        SELECT i.*, si.relative_path, si.upload_timestamp 
        FROM items_laboratorio i
        LEFT JOIN student_items si ON i.id_item = si.id_item AND si.id_student = ?
        WHERE i.id_laboratorio = ?
    ");
    $stmt->bind_param("ii", $student['id'], $lab['id_laboratorio']);
    $stmt->execute();
    $items = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['lab' => $lab, 'student' => $student, 'items' => $items]);
}

function handleFileUpload($conn) {
    $studentId = $_POST['student_id'];
    $itemId = $_POST['item_id'];
    $file = $_FILES['file'];

    // Basic validation
    if (!isset($studentId) || !isset($itemId) || !isset($file)) {
        echo json_encode(['error' => 'Faltan parámetros.']);
        exit;
    }

    // Get lab and student codes
    $stmt = $conn->prepare("SELECT codigo FROM students WHERE id = ?");
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $student = $stmt->get_result()->fetch_assoc();
    if (!$student) {
        echo json_encode(['error' => 'Estudiante no válido.']);
        exit;
    }
    $studentCode = $student['codigo'];

    $stmt = $conn->prepare("SELECT l.codigo FROM laboratorios l JOIN items_laboratorio il ON l.id_laboratorio = il.id_laboratorio WHERE il.id_item = ?");
    $stmt->bind_param("i", $itemId);
    $stmt->execute();
    $lab = $stmt->get_result()->fetch_assoc();
    if (!$lab) {
        echo json_encode(['error' => 'Item no válido.']);
        exit;
    }
    $labCode = $lab['codigo'];

    $hash = hash('sha256', $labCode . $studentCode);
    $uploadDir = "../../laboratorios/source/{$hash}/";

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $filePath = $uploadDir . basename($file['name']);
    $relativePath = "/laboratorios/source/{$hash}/" . basename($file['name']);

    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        $stmt = $conn->prepare("INSERT INTO student_items (id_student, id_item, relative_path, upload_timestamp) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE relative_path = VALUES(relative_path), upload_timestamp = NOW()");
        $stmt->bind_param("iis", $studentId, $itemId, $relativePath);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'path' => $relativePath]);
        } else {
            echo json_encode(['error' => 'Error al guardar en la base de datos.']);
        }
    } else {
        echo json_encode(['error' => 'Error al subir el archivo.']);
    }
}

$conn->close();
?>