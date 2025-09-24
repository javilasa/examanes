// ExamenImplementation/frontend/js/results_admin.js

function loadResults() {
    $('#results').html(`<h2>Resultados de Exámenes</h2>
        <div class="form-group">
            <label for="exam-select-results">Seleccionar Examen</label>
            <select class="form-control" id="exam-select-results">
                <option value="">Cargando exámenes...</option>
            </select>
        </div>
        <div class="form-group">
            <label for="group-select-results">Seleccionar Grupo</label>
            <select class="form-control" id="group-select-results" disabled>
                <option value="">Seleccione un examen primero</option>
            </select>
        </div>
        <div id="students-results-container"></div>
    `);

    // Load exams
    $.ajax({
        url: window.common.examApiUrl(),
        type: 'GET',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
        },
        success: function(exams) {
            let options = '<option value="">Seleccione un examen</option>';
            exams.forEach(exam => {
                options += `<option value="${exam.id}">${exam.nombre}</option>`;
            });
            $('#exam-select-results').html(options);
        },
        error: function(xhr, status, error) {
            console.error("Error loading exams for results:", status, error, xhr.responseText);
            $('#exam-select-results').html('<option value="">Error al cargar exámenes</option>');
        }
    });
}

function loadGroupsForResults(examId) {
    $.ajax({
        url: window.common.groupApiUrl(),
        type: 'GET',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
        },
        success: function(groups) {
            let options = '<option value="">Seleccione un grupo</option>';
            groups.forEach(group => {
                options += `<option value="${group.id}">${group.nombre}</option>`;
            });
            $('#group-select-results').html(options);
        },
        error: function(xhr, status, error) {
            console.error("Error loading groups for results:", status, error, xhr.responseText);
            $('#group-select-results').html('<option value="">Error al cargar grupos</option>');
        }
    });
}

function loadStudentsResults(examId, groupId) {
    console.log(`Fetching student results for Exam ID: ${examId}, Group ID: ${groupId}`);
    const apiUrl = window.common.resultsApiUrl() + `?exam_id=${examId}&group_id=${groupId}`;
    console.log(`API URL: ${apiUrl}`);
    $.ajax({
        url: apiUrl,
        type: 'GET',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
        },
        success: function(studentsResults) {
            console.log("Students Results received:", studentsResults);
            let tableContent = '<table class="table table-striped"><thead><tr><th>Código</th><th>Nombre</th><th>Calificación</th><th>Acciones</th></tr></thead><tbody>';
            if (studentsResults.length === 0) {
                tableContent += '<tr><td colspan="4">No hay estudiantes en este grupo que hayan tomado este examen.</td></tr>';
            } else {
                studentsResults.forEach(student => {
                    tableContent += `<tr>
                        <td>${student.codigo}</td>
                        <td>${student.nombre}</td>
                        <td>${student.score !== null ? student.score : 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-student-results" data-student-id="${student.id}" data-exam-id="${examId}">Ver</button>
                        </td>
                    </tr>`;
                });
            }
            tableContent += '</tbody></table>';
            $('#students-results-container').html(tableContent);
        },
        error: function(xhr, status, error) {
            console.error("Error loading students results:", status, error, xhr.responseText);
            $('#students-results-container').html('<div class="alert alert-danger">Error al cargar los resultados de los estudiantes.</div>');
        }
    });
}

// Event listeners for results tab

    $('#results').on('change', '#exam-select-results', function() {
        const selectedExamId = $(this).val();
        if (selectedExamId) {
            $('#group-select-results').prop('disabled', false);
            loadGroupsForResults(selectedExamId);
        } else {
            $('#group-select-results').prop('disabled', true).html('<option value="">Seleccione un examen primero</option>');
            $('#students-results-container').html('');
        }
    });

    $('#results').on('change', '#group-select-results', function() {
        const selectedExamId = $('#exam-select-results').val();
        const selectedGroupId = $(this).val();
        if (selectedExamId && selectedGroupId) {
            loadStudentsResults(selectedExamId, selectedGroupId);
        } else {
            $('#students-results-container').html('');
        }
    });

    $('#results').on('click', '.view-student-results', function() {
        const studentId = $(this).data('student-id');
        const examId = $(this).data('exam-id');
        // Open new tab with detailed results page
        window.open(`../results.html?student_id=${studentId}&exam_id=${examId}`, '_blank');
    });
