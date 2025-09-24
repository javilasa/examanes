$(document).ready(function() {
    const API_URL = '/backend/api/public_laboratorio_api.php';

    let labData = null;
    let studentData = null;

    // Check for credentials in sessionStorage
    const savedLabCode = sessionStorage.getItem('labCode');
    const savedStudentCode = sessionStorage.getItem('studentCode');
    if (savedLabCode && savedStudentCode) {
        validateAndLoad(savedLabCode, savedStudentCode);
    }

    $('#student-login').on('submit', function(e) {
        e.preventDefault();
        const labCode = $('#lab-code').val();
        const studentCode = $('#student-code').val();
        validateAndLoad(labCode, studentCode);
    });

    function validateAndLoad(labCode, studentCode) {
        $.ajax({
            url: API_URL,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: 'get_lab_for_student', lab_code: labCode, student_code: studentCode }),
            success: function(response) {
                if (response.error) {
                    $('#login-error').text(response.error).show();
                    return;
                }

                labData = response.lab;
                studentData = response.student;
                labData.items = response.items; // Store items in labData

                sessionStorage.setItem('labCode', labCode);
                sessionStorage.setItem('studentCode', studentCode);

                $('#login-form').hide();

                if (labData.activo == 1) {
                    $('#submission-form').show();
                    $('#lab-name').text(labData.nombre);
                    $('#student-name').text(studentData.nombre);
                    renderFileItems(labData.items);
                } else {
                    $('#submission-status').show();
                    $('#lab-name-status').text(labData.nombre);
                    $('#student-name-status').text(studentData.nombre);
                    renderFileItemsStatus(labData.items);
                }
            },
            error: function(xhr, status, error) {
                const response = xhr.responseJSON;
                if (response && response.error) {
                    $('#login-error').text(response.error).show();
                } else {
                    $('#login-error').text('Ocurrió un error al contactar el servidor.').show();
                }
            }
        });
    }

    function renderFileItems(items) {
        const $container = $('#file-items').empty();
        items.forEach(item => {
            const uploadedHtml = item.relative_path
                ? `<p class="card-text">Archivo subido: <a href="${item.relative_path}" target="_blank">${item.nombre_archivo}</a> (Subido: ${new Date(item.upload_timestamp).toLocaleString()})</p>`
                : '';
            const itemHtml = `
                <div class="card mt-3" id="item-${item.id_item}">
                    <div class="card-body">
                        <h5 class="card-title">${item.nombre_archivo}</h5>
                        <div class="mb-2">
                            <input type="file" class="form-control-file file-input" data-item-id="${item.id_item}" data-expected-name="${item.nombre_archivo}">
                        </div>
                        <div class="upload-status"></div>
                        ${uploadedHtml}
                    </div>
                </div>
            `;
            $container.append(itemHtml);
        });
    }
    
    function renderFileItemsStatus(items) {
        const $container = $('#file-items-status').empty();
        items.forEach(item => {
            const uploadedHtml = item.relative_path
                ? `<p class="card-text"><a href="${item.relative_path}" target="_blank">${item.nombre_archivo}</a> (Subido: ${new Date(item.upload_timestamp).toLocaleString()})</p>`
                : '<p class="card-text">No subido</p>';
            const itemHtml = `
                <div class="card mt-3">
                    <div class="card-body">
                        <h5 class="card-title">${item.nombre_archivo}</h5>
                        ${uploadedHtml}
                    </div>
                </div>
            `;
            $container.append(itemHtml);
        });
    }

    $(document).on('change', '.file-input', function() {
        const file = this.files[0];
        const $input = $(this);
        const itemId = $input.data('item-id');
        const expectedName = $input.data('expected-name');
        const $status = $input.closest('.card-body').find('.upload-status');

        if (!file) return;

        if (file.name !== expectedName) {
            $status.html('<div class="alert alert-danger">El nombre del archivo debe ser exactamente: ' + expectedName + '</div>');
            $input.val('');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            $status.html('<div class="alert alert-danger">El tamaño del archivo no debe superar los 5MB.</div>');
            $input.val('');
            return;
        }

        const formData = new FormData();
        formData.append('action', 'upload_file');
        formData.append('student_id', studentData.id);
        formData.append('item_id', itemId);
        formData.append('file', file);

        $.ajax({
            url: API_URL,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.error) {
                    $status.html('<div class="alert alert-danger">' + response.error + '</div>');
                } else {
                    $status.html('<div class="alert alert-success">Archivo subido con éxito.</div>');
                    validateAndLoad(labData.codigo, studentData.codigo);
                }
            },
            error: function() {
                $status.html('<div class="alert alert-danger">Error al subir el archivo.</div>');
            }
        });
    });

    $('#complete-submission').on('click', function() {
        const allFilesUploaded = labData.items.every(item => item.relative_path);

        if (!allFilesUploaded) {
            alert('Debe subir todos los archivos solicitados antes de completar la entrega.');
            return;
        }

        alert('Proyecto subido. Gracias.');
        sessionStorage.removeItem('labCode');
        sessionStorage.removeItem('studentCode');
        location.reload();
    });

    // Handle "Salir" button click
    $('#logout-button, #logout-button-status').on('click', function() {
        sessionStorage.removeItem('labCode');
        sessionStorage.removeItem('studentCode');
        location.reload();
    });
});