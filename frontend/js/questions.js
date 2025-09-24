// ExamenImplementation/frontend/js/questions.js

function loadQuestions() {
    $('#questions').html(`<h2>Preguntas</h2>`);
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
            $('#questions').append(`<div class="form-group">
                    <label for="exam-select">Examen</label>
                    <select class="form-control" id="exam-select">${options}</select>
                </div>
                <div id="questions-container"></div>`);
        }
    });
}

// Event listeners for questions tab

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
                            <div class="col-md-6"><textarea id="question-pregunta" class="form-control" placeholder="Pregunta" required></textarea></div>
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
        const isUpdate = id ? true : false;
        const type = 'POST'; // Always use POST
        let data = { examen_id, pregunta, peso };

        if (isUpdate) {
            data.id = id;
            data._method = 'PUT'; // Spoof PUT method
            delete data.examen_id; // Not needed for update
        }

        const submitButton = $('#question-form button[type="submit"]');
        submitButton.prop('disabled', true);

        console.log("Sending AJAX request to create question...");

        $.ajax({
            url: window.common.questionApiUrl(),
            type: type,
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify(data),
            success: function() {
                console.log("AJAX request for question creation completed (success).");
                $('#exam-select').trigger('change');
                submitButton.prop('disabled', false);
            },
            error: function(xhr, status, error) {
                console.error("AJAX request for question creation completed (error):", status, error, xhr.responseText);
                submitButton.prop('disabled', false);
            }
        });
    });

    $('#questions').on('click', '.delete-question', function() {
        if (!confirm('¿Está seguro de que desea eliminar esta pregunta?')) return;
        const id = $(this).data('id');
        $.ajax({
            url: window.common.questionApiUrl(),
            type: 'POST',
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify({ id: id, _method: 'DELETE' }), // Spoof DELETE method
            success: function() {
                $('#exam-select').trigger('change');
            },
            error: function(xhr, status, error) {
                console.error("Error deleting question:", status, error, xhr.responseText);
            }
        });
    });
