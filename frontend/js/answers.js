// ExamenImplementation/frontend/js/answers.js

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

// Event listeners for answers tab

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
        const isUpdate = id ? true : false;
        const type = 'POST'; // Always use POST
        let data = { question_id, respuesta, es_correcta };

        if (isUpdate) {
            data.id = id;
            data._method = 'PUT'; // Spoof PUT method
            delete data.question_id; // Not needed for update
        }

        const submitButton = $('#answer-form button[type="submit"]');
        submitButton.prop('disabled', true);

        console.log("Sending AJAX request to create answer...");

        $.ajax({
            url: window.common.answerApiUrl(),
            type: type,
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify(data),
            success: function() {
                console.log("AJAX request for answer creation completed (success).");
                $('#question-select').trigger('change');
                submitButton.prop('disabled', false);
            },
            error: function(xhr, status, error) {
                console.error("AJAX request for answer creation completed (error):", status, error, xhr.responseText);
                submitButton.prop('disabled', false);
            }
        });
    });

    $('#answers').on('click', '.delete-answer', function() {
        if (!confirm('¿Está seguro de que desea eliminar esta respuesta?')) return;
        const id = $(this).data('id');
        $.ajax({
            url: window.common.answerApiUrl(),
            type: 'POST',
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify({ id: id, _method: 'DELETE' }), // Spoof DELETE method
            success: function() {
                $('#question-select').trigger('change');
            },
            error: function(xhr, status, error) {
                console.error("Error deleting answer:", status, error, xhr.responseText);
            }
        });
    });
