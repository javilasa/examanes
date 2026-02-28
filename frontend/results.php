<?php
require_once '../backend/src/results.php';

// Get exam_id and student_id from POST request
$exam_id = isset($_POST['exam_id']) ? (int)$_POST['exam_id'] : 0;
$student_id = isset($_POST['student_id']) ? (int)$_POST['student_id'] : 0;

$error_message = '';
$studentInfo = null;
$examName = '';
$results = [];
$totalScore = 0;
$incidentCount = 0;
$finalScore = 0;

if ($exam_id > 0 && $student_id > 0) {
    $data = getExamResults($student_id, $exam_id);

    if ($data && !empty($data['student'])) {
        $studentInfo = $data['student'];
        $examName = $data['exam_name'];
        $displayExam = $data['display'];
        $results = ($displayExam == 1) ? $data['results'] : [];
        $totalScore = $data['total_score'];
        $incidentCount = $data['incident_count'];

        // Calculate penalty and final score
        $penalty = $totalScore * 0.20 * $incidentCount;
        $finalScore = $totalScore - $penalty;
        if ($finalScore < 0) {
            $finalScore = 0;
        }
    } else {
        $error_message = "No se pudieron encontrar los resultados para el estudiante y examen proporcionados.";
    }
} else {
    $error_message = "ID de examen o de estudiante no proporcionado.";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultados del Examen</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="./css/style.css">
    <style>
        body {
            height: auto;
            display: block;
            justify-content: left;
            align-items: start;
        }
        .correct-answer { color: green; font-weight: bold; }
        .incorrect-answer { color: red; font-weight: bold; }
        .question-card { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
    </style>
</head>
<body>
    <div class="container mt-5">
        <h1 class="mb-4">Resultados del Examen: <?php echo htmlspecialchars($examName); ?></h1>

        <?php if ($error_message): ?>
            <div class="alert alert-danger"><?php echo $error_message; ?></div>
        <?php elseif ($studentInfo): ?>
            <div id="student-info" class="alert alert-info">
                <strong>Estudiante:</strong> <?php echo htmlspecialchars($studentInfo['nombre']); ?><br>
                <strong>Código:</strong> <?php echo htmlspecialchars($studentInfo['codigo']); ?>
            </div>

            <div id="exam-results-container">
                <?php foreach ($results as $result): ?>
                    <div class="question-card">
                        <h5>Pregunta: <?php echo htmlspecialchars($result['pregunta']); ?> (Peso: <?php echo htmlspecialchars($result['peso_pregunta']); ?>)</h5>
                        <p>Tu respuesta:
                            <span class="<?php echo $result['es_correcta_estudiante'] ? 'correct-answer' : 'incorrect-answer'; ?>">
                                <?php echo htmlspecialchars($result['respuesta_estudiante'] ?? 'No respondida'); ?>
                            </span>
                        </p>
                        <?php if (!$result['es_correcta_estudiante'] && isset($result['respuesta_estudiante'])): ?>
                            <p>Respuesta correcta: <span class="correct-answer"><?php echo htmlspecialchars($result['respuesta_correcta']); ?></span></p>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>

            <div id="total-score" class="alert alert-success mt-4">
                <strong>Puntaje Base:</strong> <?php echo number_format($totalScore, 2); ?><br>
                <strong>Incidentes Registrados:</strong> <?php echo $incidentCount; ?><br>
                <strong>Penalización (20% por incidente):</strong> -<?php echo number_format($totalScore * 0.20 * $incidentCount, 2); ?><br>
                <strong>Puntaje Final:</strong> <?php echo number_format($finalScore, 2); ?>
            </div>
        <?php endif; ?>
        <a href="/frontend/admin/index.html" class="btn btn-primary">Volver al inicio</a>
    </div>

    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.4/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
</body>
</html>