function loadAnswers() {
    $('#answers').html(`<h2>Respuestas</h2>`);
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
            $('#answers').append(`<div class="form-group">
                    <label for="exam-select-answers">Examen</label>
                    <select class="form-control" id="exam-select-answers">${options}</select>
                </div>
                <div id="questions-select-container"></div>
                <div id="answers-container"></div>`);
        }
    });
}

$(document).ready(function() {

    // Admin Login
    if (window.location.pathname.endsWith('login.html')) {
        $('#admin-login-form').on('submit', function(e) {
            e.preventDefault();
            const password = $('#password').val();
            $.ajax({
                url: window.common.configApiUrl(),
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ action: 'admin_login', password }),
                success: function(response) {
                    if (response.success) {
                        sessionStorage.setItem('admin_logged_in', 'true');
                        window.location.href = 'index.html';
                    } else {
                        alert('Invalid password');
                    }
                }
            });
        });
        return;
    }

    // Check if admin is logged in
    if (!sessionStorage.getItem('admin_logged_in')) {
        window.location.href = 'login.html';
        return;
    }

    // Logout
    $('#logout-btn').on('click', function() {
        sessionStorage.removeItem('admin_logged_in');
        window.location.href = 'login.html';
    });

    // Initialize the app and then load the default tab (students)
    $.ajax({
        url: window.common.configApiUrl(), // This needs to be a fixed path
        type: 'GET',
        success: function(envConfig) {
            window.common.initializeApp(envConfig.environment, function() {
                // Load the default tab content after app is initialized
                // Trigger the click on the active tab to load its content
                const activeTabHref = $('ul.nav-tabs li a.active').attr('href');
                if (activeTabHref) {
                    // Remove the leading '#'
                    const activeTabId = activeTabHref.substring(1);
                    // Call the specific load function based on the active tab
                    switch (activeTabId) {
                        case 'students':
                            loadStudents();
                            break;
                        case 'exams':
                            loadExams();
                            break;
                        case 'questions':
                            loadQuestions();
                            break;
                        case 'answers':
                            loadAnswers();
                            break;
                        case 'config':
                            loadConfig();
                            break;
                        case 'groups':
                            loadGroups();
                            break;
                        case 'results':
                            loadResults();
                            break;
                    }
                }
            });
        },
        error: function() {
            // Fallback to development if env.json is not available
            window.common.initializeApp('development', function() {
                const activeTabHref = $('ul.nav-tabs li a.active').attr('href');
                if (activeTabHref) {
                    const activeTabId = activeTabHref.substring(1);
                    switch (activeTabId) {
                        case 'students':
                            loadStudents();
                            break;
                        case 'exams':
                            loadExams();
                            break;
                        case 'questions':
                            loadQuestions();
                            break;
                        case 'answers':
                            loadAnswers();
                            break;
                        case 'config':
                            loadConfig();
                            break;
                        case 'groups':
                            loadGroups();
                            break;
                        case 'results':
                            loadResults();
                            break;
                    }
                }
            });
        }
    });

    // Tab change listener
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var target = $(e.target).attr("href") // activated tab
        if (target === '#students') {
            loadStudents();
        } else if (target === '#exams') {
            loadExams();
        } else if (target === '#questions') {
            loadQuestions();
        } else if (target === '#answers') {
            loadAnswers();
        } else if (target === '#config') {
            loadConfig();
        } else if (target === '#groups') {
            loadGroups();
        } else if (target === '#results') {
            loadResults();
        }
    });

    // All event listeners from individual tab files are now attached here
    // Students tab event listeners
    $('#students').on('click', '.edit-student', function() {
        $('#student-id').val($(this).data('id'));
        $('#student-codigo').val($(this).data('codigo'));
        $('#student-nombre').val($(this).data('nombre'));
        $('#student-grupo').val($(this).data('grupo'));
    });

    $('#students').on('click', '#cancel-edit-student', function() {
        $('#student-id').val('');
        $('#student-form')[0].reset();
    });

    $('#students').on('submit', '#student-form', function(e) {
        e.preventDefault();
        const id = $('#student-id').val();
        const codigo = $('#student-codigo').val();
        const nombre = $('#student-nombre').val();
        const grupo = $('#student-grupo').val();
        const type = id ? 'PUT' : 'POST';
        const data = id ? { id, codigo, nombre, grupo } : { codigo, nombre, grupo };

        $.ajax({
            url: window.common.studentApiUrl(),
            type: type,
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify(data),
            success: function() {
                loadStudents();
            },
            error: function(xhr, status, error) {
                console.error("Error saving student:", status, error, xhr.responseText);
            }
        });
    });

    $('#students').on('click', '.delete-student', function() {
        if (!confirm('¿Está seguro de que desea eliminar este estudiante?')) return;
        const id = $(this).data('id');
        $.ajax({
            url: window.common.studentApiUrl(),
            type: 'DELETE',
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify({ id }),
            success: function() {
                loadStudents();
            },
            error: function(xhr, status, error) {
                console.error("Error deleting student:", status, error, xhr.responseText);
            }
        });
    });

    // Exams tab event listeners
    $('#exams').on('click', '.edit-exam', function() {
        $('#exam-id').val($(this).data('id'));
        $('#exam-nombre').val($(this).data('nombre'));
        $('#exam-vigente').prop('checked', Boolean($(this).data('vigente')));
    });

    $('#exams').on('click', '#cancel-edit-exam', function() {
        $('#exam-id').val('');
        $('#exam-form')[0].reset();
    });

    $('#exams').on('submit', '#exam-form', function(e) {
        e.preventDefault();
        const id = $('#exam-id').val();
        const nombre = $('#exam-nombre').val();
        const vigente = $('#exam-vigente').is(':checked') ? 1 : 0;
        const type = id ? 'PUT' : 'POST';
        const data = id ? { id, nombre, vigente } : { nombre, vigente };

        $.ajax({
            url: window.common.examApiUrl(),
            type: type,
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify(data),
            success: function() {
                loadExams();
            },
            error: function(xhr, status, error) {
                console.error("Error saving exam:", status, error, xhr.responseText);
            }
        });
    });

    $('#exams').on('click', '.delete-exam', function() {
        if (!confirm('¿Está seguro de que desea eliminar este examen?')) return;
        const id = $(this).data('id');
        $.ajax({
            url: window.common.examApiUrl(),
            type: 'DELETE',
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify({ id }),
            success: function() {
                loadExams();
            },
            error: function(xhr, status, error) {
                console.error("Error deleting exam:", status, error, xhr.responseText);
            }
        });
    });

    // Questions tab event listeners
    $('#questions').on('change', '#exam-select', function() {
        const examen_id = $(this).val();
        if (!examen_id) {
            $('#questions-container').html('');
            return;
        }

        $.ajax({
            url: window.common.questionApiUrl() + `?examen_id=${examen_id}`,
            type: 'GET',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            success: function(questions) {
                let tableContent = '<table class="table"><thead><tr><th>ID</th><th>Pregunta</th><th>Peso</th><th>Acciones</th></tr></thead><tbody>';
                questions.forEach(question => {
                    tableContent += `<tr>
                        <td>${question.id}</td>
                        <td>${question.pregunta}</td>
                        <td>${question.peso}</td>
                        <td>
                            <button class="btn btn-sm btn-info edit-question" data-id="${question.id}" data-pregunta="${question.pregunta}" data-peso="${question.peso}">Editar</button>
                            <button class="btn btn-sm btn-danger delete-question" data-id="${question.id}">Eliminar</button>
                        </td>
                    </tr>`;
                });
                tableContent += '</tbody></table>';
                $('#questions-container').html(`
                    <form id="question-form">
                        <input type="hidden" id="question-id">
                        <div class="form-row">
                            <div class="col-md-6"><input type="text" id="question-pregunta" class="form-control" placeholder="Pregunta" required></div>
                            <div class="col-md-2"><input type="number" step="0.1" id="question-peso" class="form-control" placeholder="Peso" required></div>
                            <div class="col-md-4"><button type="submit" class="btn btn-primary">Guardar</button> <button type="button" class="btn btn-secondary" id="cancel-edit-question">Cancelar</button></div>
                        </div>
                    </form><hr>${tableContent}`);
            }
        });
    });

    $('#questions').on('click', '.edit-question', function() {
        $('#question-id').val($(this).data('id'));
        $('#question-pregunta').val($(this).data('pregunta'));
        $('#question-peso').val($(this).data('peso'));
    });

    $('#questions').on('click', '#cancel-edit-question', function() {
        $('#question-id').val('');
        $('#question-form')[0].reset();
    });

    $('#questions').on('submit', '#question-form', function(e) {
        e.preventDefault();
        const id = $('#question-id').val();
        const examen_id = $('#exam-select').val();
        const pregunta = $('#question-pregunta').val();
        const peso = $('#question-peso').val();
        const type = id ? 'PUT' : 'POST';
        const data = id ? { id, pregunta, peso } : { examen_id, pregunta, peso };

        $.ajax({
            url: window.common.questionApiUrl(),
            type: type,
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify(data),
            success: function() {
                $('#exam-select').trigger('change');
            },
            error: function(xhr, status, error) {
                console.error("Error saving question:", status, error, xhr.responseText);
            }
        });
    });

    $('#questions').on('click', '.delete-question', function() {
        if (!confirm('¿Está seguro de que desea eliminar esta pregunta?')) return;
        const id = $(this).data('id');
        $.ajax({
            url: window.common.questionApiUrl(),
            type: 'DELETE',
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify({ id }),
            success: function() {
                $('#exam-select').trigger('change');
            },
            error: function(xhr, status, error) {
                console.error("Error deleting question:", status, error, xhr.responseText);
            }
        });
    });

    // Answers tab event listeners
    $('#answers').on('change', '#exam-select-answers', function() {
        const examen_id = $(this).val();
        if (!examen_id) {
            $('#questions-select-container').html('');
            $('#answers-container').html('');
            return;
        }

        $.ajax({
            url: window.common.questionApiUrl() + `?examen_id=${examen_id}`,
            type: 'GET',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            success: function(questions) {
                let options = '<option value="">Seleccione una pregunta</option>';
                questions.forEach(question => {
                    options += `<option value="${question.id}">${question.pregunta}</option>`;
                });
                $('#questions-select-container').html(`<div class="form-group">
                        <label for="question-select">Pregunta</label>
                        <select class="form-control" id="question-select">${options}</select>
                    </div>`);
                $('#answers-container').html('');
            }
        });
    });

    $('#answers').on('change', '#question-select', function() {
        const question_id = $(this).val();
        if (!question_id) {
            $('#answers-container').html('');
            return;
        }

        $.ajax({
            url: window.common.answerApiUrl() + `?question_id=${question_id}`,
            type: 'GET',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            success: function(answers) {
                let tableContent = '<table class="table"><thead><tr><th>ID</th><th>Respuesta</th><th>Correcta</th><th>Acciones</th></tr></thead><tbody>';
                answers.forEach(answer => {
                    tableContent += `<tr>
                        <td>${answer.id}</td>
                        <td>${answer.respuesta}</td>
                        <td>${answer.es_correcta ? 'Sí' : 'No'}</td>
                        <td>
                            <button class="btn btn-sm btn-info edit-answer" data-id="${answer.id}" data-respuesta="${answer.respuesta}" data-es_correcta="${answer.es_correcta}">Editar</button>
                            <button class="btn btn-sm btn-danger delete-answer" data-id="${answer.id}">Eliminar</button>
                        </td>
                    </tr>`;
                });
                tableContent += '</tbody></table>';
                $('#answers-container').html(`
                    <form id="answer-form">
                        <input type="hidden" id="answer-id">
                        <div class="form-row">
                            <div class="col-md-6"><textarea id="answer-respuesta" class="form-control" placeholder="Respuesta" required></textarea></div>
                            <div class="col-md-2"><div class="form-check"><input class="form-check-input" type="checkbox" id="answer-es-correcta"><label class="form-check-label" for="answer-es-correcta">Es correcta</label></div></div>
                            <div class="col-md-4"><button type="submit" class="btn btn-primary">Guardar</button> <button type="button" class="btn btn-secondary" id="cancel-edit-answer">Cancelar</button></div>
                        </div>
                    </form><hr>${tableContent}`);
            }
        });
    });

    $('#answers').on('click', '.edit-answer', function() {
        $('#answer-id').val($(this).data('id'));
        $('#answer-respuesta').val($(this).data('respuesta'));
        $('#answer-es-correcta').prop('checked', $(this).data('es_correcta'));
    });

    $('#answers').on('click', '#cancel-edit-answer', function() {
        $('#answer-id').val('');
        $('#answer-form')[0].reset();
    });

    $('#answers').on('submit', '#answer-form', function(e) {
        e.preventDefault();
        const id = $('#answer-id').val();
        const question_id = $('#question-select').val();
        const respuesta = $('#answer-respuesta').val();
        const es_correcta = $('#answer-es-correcta').is(':checked') ? 1 : 0;
        const type = id ? 'PUT' : 'POST';
        const data = id ? { id, respuesta, es_correcta } : { question_id, respuesta, es_correcta };

        $.ajax({
            url: window.common.answerApiUrl(),
            type: type,
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify(data),
            success: function() {
                $('#question-select').trigger('change');
            },
            error: function(xhr, status, error) {
                console.error("Error saving answer:", status, error, xhr.responseText);
            }
        });
    });

    $('#answers').on('click', '.delete-answer', function() {
        if (!confirm('¿Está seguro de que desea eliminar esta respuesta?')) return;
        const id = $(this).data('id');
        $.ajax({
            url: window.common.answerApiUrl(),
            type: 'DELETE',
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify({ id }),
            success: function() {
                $('#question-select').trigger('change');
            },
            error: function(xhr, status, error) {
                console.error("Error deleting answer:", status, error, xhr.responseText);
            }
        });
    });

    // Config tab event listeners
    $('#config').on('submit', '#config-form', function(e) {
        e.preventDefault();
        const environment = $('#environment-select').val();
        $.ajax({
            url: window.common.configApiUrl(),
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: 'save_environment', environment }),
            success: function() {
                alert('Configuración guardada. La página se recargará.');
                location.reload();
            },
            error: function(xhr, status, error) {
                console.error("Error saving config:", status, error, xhr.responseText);
            }
        });
    });

    // Groups tab event listeners
    $('#groups').on('click', '.edit-group', function() {
        $('#group-id').val($(this).data('id'));
        $('#group-nombre').val($(this).data('nombre'));
    });

    $('#groups').on('click', '#cancel-edit-group', function() {
        $('#group-id').val('');
        $('#group-form')[0].reset();
    });

    $('#groups').on('submit', '#group-form', function(e) {
        e.preventDefault();
        const id = $('#group-id').val();
        const nombre = $('#group-nombre').val();
        const type = id ? 'PUT' : 'POST';
        const data = id ? { id, nombre } : { nombre };

        $.ajax({
            url: window.common.groupApiUrl(),
            type: type,
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify(data),
            success: function() {
                loadGroups();
            },
            error: function(xhr, status, error) {
                console.error("Error saving group:", status, error, xhr.responseText);
            }
        });
    });

    $('#groups').on('click', '.delete-group', function() {
        if (!confirm('¿Está seguro de que desea eliminar este grupo?')) return;
        const id = $(this).data('id');
        $.ajax({
            url: window.common.groupApiUrl(),
            type: 'DELETE',
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify({ id }),
            success: function() {
                loadGroups();
            },
            error: function(xhr, status, error) {
                console.error("Error deleting group:", status, error, xhr.responseText);
            }
        });
    });

    // Results tab event listeners
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
        window.open(`results.html?student_id=${studentId}&exam_id=${examId}`, '_blank');
    });
});