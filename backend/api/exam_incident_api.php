        $result = createExamIncident($studentId, $examId, $incidentType);

        if ($result === true) {
            echo json_encode(["success" => true, "message" => "Incident logged successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to log incident.", "error" => $result]);
        }