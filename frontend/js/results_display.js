// ExamenImplementation/frontend/js/results_display.js

$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('student_id');
    const examId = urlParams.get('exam_id');

    console.log(`results.html - Student ID: ${studentId}, Exam ID: ${examId}`);

    let apiBaseUrl;

    // Fetch API base URL from config.json
    $.getJSON('./js/env.json', function (env) {
        const currentEnvironment = env.environment || 'development'; // Default a development

        // 2. Ahora leer config.json usando ese environment
        $.getJSON('./js/config.json', function (config) {
            apiBaseUrl = config.apiBaseUrl[currentEnvironment];
            console.log(`results.html - API Base URL: ${apiBaseUrl}`);

            if (studentId && examId) {
                loadDetailedResults(studentId, examId);
            } else {
                $('#exam-results-container').html('<div class="alert alert-danger">Faltan parámetros de estudiante o examen.</div>');
            }
        }).fail(function () {
            console.error("Error loading config.json");
            apiBaseUrl = '/backend/api/'; // fallback
            console.log(`results.html - Fallback API Base URL: ${apiBaseUrl}`);

            if (studentId && examId) {
                loadDetailedResults(studentId, examId);
            } else {
                $('#exam-results-container').html('<div class="alert alert-danger">Faltan parámetros de estudiante o examen.</div>');
            }
        });

    }).fail(function () {
        console.error("Error loading env.json");
        // Si falla env.json, puedes asumir development
        const currentEnvironment = 'development';
        $.getJSON('./js/config.json', function (config) {
            apiBaseUrl = config.apiBaseUrl[currentEnvironment];
            console.log(`results.html - API Base URL (fallback env): ${apiBaseUrl}`);

            if (studentId && examId) {
                loadDetailedResults(studentId, examId);
            } else {
                $('#exam-results-container').html('<div class="alert alert-danger">Faltan parámetros de estudiante o examen.</div>');
            }
        });
    });

    function loadDetailedResults(studentId, examId) {
        const apiUrl = apiBaseUrl + `results_api.php?action=detailed_results&student_id=${studentId}&exam_id=${examId}`;
        console.log(`results.html - Detailed Results API URL: ${apiUrl}`);
        $.ajax({
            url: apiUrl,
            type: 'GET',
            beforeSend: function (xhr) { // ADDED THIS BLOCK
                // Assuming window.common.token is available from common.js
                // However, results.html does not load common.js.
                // So, we need to get the token from sessionStorage or pass it.
                // For now, let's assume a simple token for testing, or retrieve it from sessionStorage.
                // Since admin.js sets 'admin_logged_in', we can assume the token is 'admin_token'
                // as defined in common.js. This is a temporary workaround for results.html.
                // A more robust solution would involve passing the token via URL or a shared storage.
                const adminToken = "admin_token"; // This should ideally come from a secure source
                xhr.setRequestHeader('Authorization', 'Bearer ' + adminToken);
            },
            success: function (response) {
                console.log("results.html - Detailed Results API Response:", response);
                if (response.success && response.data) {
                    const student = response.data.student;
                    const results = response.data.results;
                    const baseScore = response.data.total_score;
                    const incidents = response.data.incident_count;

                    $('#student-info').html(`
                        <strong>Estudiante:</strong> ${student.nombre} (${student.codigo})<br>
                        <strong>Examen:</strong> ${response.data.exam_name}
                    `);

                    const closeButton = document.createElement('button');
                closeButton.textContent = 'Cerrar Examen';
                closeButton.onclick = () => {
                    window.close();
                };
                $('#student-info').append(closeButton);

                    let resultsHtml = '';
                    results.forEach(item => {
                        const isCorrect = item.es_correcta_estudiante == 1;
                        const points = isCorrect ? item.peso_pregunta : 0;
                        resultsHtml += `
                            <div class="question-card">
                                <h5>${item.pregunta}</h5>
                                <p><strong>Tu respuesta:</strong> <span class="${isCorrect ? 'correct-answer' : 'incorrect-answer'}">${item.respuesta_estudiante || 'No respondido'}</span></p>
                                ${!isCorrect && item.respuesta_correcta ? `<p><strong>Respuesta correcta:</strong> ${item.respuesta_correcta}</p>` : ''}
                                <p><strong>Puntos obtenidos:</strong> ${points} / ${item.peso_pregunta}</p>
                            </div>
                        `;
                    });
                    $('#exam-results-container').html(resultsHtml);

                    const penalty = baseScore * 0.20 * incidents;
                    let finalScore = baseScore - penalty;
                    if (finalScore < 0) {
                        finalScore = 0;
                    }

                    $('#total-score').html(`
                        <p><strong>Puntaje:</strong> ${baseScore}</p>
                        <p><strong>Incidentes:</strong> ${incidents}</p>
                        <p><strong>PUNTAJE TOTAL:</strong> ${finalScore.toFixed(2)}</p>
                    `);

                } else {
                    $('#exam-results-container').html('<div class="alert alert-warning">' + (response.message || 'No se encontraron resultados detallados para este estudiante y examen.') + '</div>');
                }
            },
            error: function (xhr, status, error) {
                console.error("results.html - Error loading detailed results:", status, error, xhr.responseText);
                $('#exam-results-container').html('<div class="alert alert-danger">Error al cargar los resultados detallados.</div>');
            }
        });
    }
});