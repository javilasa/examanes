<?php
require_once 'cors.php';
// IMPORTANT: This endpoint should be protected in a real application.
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$base_path = $_SERVER['DOCUMENT_ROOT'];
$path = '/frontend/js/env.json';
if ($method === 'GET') {
    $env = file_get_contents($base_path . $path);
    echo $env;
} else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'admin_login') {
        // IMPORTANT: Hardcoded password for demonstration purposes.
        // In a real application, use a secure password hashing and storage mechanism.
        if (isset($data['password']) && $data['password'] === 'admin123') {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false]);
        }
    } else if ($action === 'save_environment') {
        if (isset($data['environment'])) {
            $env = ['environment' => $data['environment']];
            file_put_contents($base_path . $path, json_encode($env, JSON_PRETTY_PRINT));
            echo json_encode(["message" => "Environment updated"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Environment not provided"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Invalid action"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
?>