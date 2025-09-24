// ExamenImplementation/frontend/js/students.js

function loadStudents() {
    let allGroups = [];

    // First, fetch all groups
    $.ajax({
        url: window.common.groupApiUrl(),
        type: 'GET',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
        },
        success: function(groups) {
            allGroups = groups;
            // Then, fetch students
            fetchStudents(allGroups);
        },
        error: function(xhr, status, error) {
            console.log("url" + window.common.groupApiUrl());
            console.error("Error loading groups for students tab:", status, error, xhr.responseText);
            $('#students').html('<div class="alert alert-danger">Error al cargar los grupos.</div>');
        }
    });
}

function fetchStudents(allGroups) {
    $.ajax({
        url: window.common.studentApiUrl(),
        type: 'GET',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
        },
        success: function(students) {
            console.log('Students API response:', students);
            let tableContent = '<table class="table"><thead><tr><th>ID</th><th>Código</th><th>Nombre</th><th>Grupos</th><th>Acciones</th></tr></thead><tbody>';
            students.forEach(student => {
                // Assuming student.groups is an array of group objects {id, nombre}
                const studentGroupNames = student.groups ? student.groups.map(g => g.nombre).join(', ') : 'N/A';
                tableContent += `<tr>
                    <td>${student.id}</td>
                    <td>${student.codigo}</td>
                    <td>${student.nombre}</td>
                    <td>${studentGroupNames}</td>
                    <td>
                        <button class="btn btn-sm btn-info edit-student" data-id="${student.id}" data-codigo="${student.codigo}" data-nombre="${student.nombre}" data-groups='${JSON.stringify(student.groups || [])}'>Editar</button>
                        <button class="btn btn-sm btn-danger delete-student" data-id="${student.id}">Eliminar</button>
                    </td>
                </tr>`;
            });
            tableContent += '</tbody></table>';

            let groupOptions = '';
            allGroups.forEach(group => {
                groupOptions += `<option value="${group.id}">${group.nombre}</option>`;
            });

            $('#students').html(`<h2>Estudiantes</h2>
                <form id="student-form">
                    <input type="hidden" id="student-id">
                    <div class="form-row">
                        <div class="col"><input type="text" id="student-codigo" class="form-control" placeholder="Código" required></div>
                        <div class="col"><input type="text" id="student-nombre" class="form-control" placeholder="Nombre" required></div>
                        <div class="col">
                            <label for="student-groups">Grupos:</label>
                            <select multiple class="form-control" id="student-groups">
                                ${groupOptions}
                            </select>
                        </div>
                        <div class="col"><button type="submit" class="btn btn-primary">Guardar</button> <button type="button" class="btn btn-secondary" id="cancel-edit-student">Cancelar</button></div>
                    </div>
                </form><hr>${tableContent}`);
        },
        error: function(xhr, status, error) {
            console.error("Error loading students:", status, error, xhr.responseText);
            $('#students').html('<div class="alert alert-danger">Error al cargar los estudiantes. Verifique la consola del navegador.</div>');
        }
    });
}

// Event listeners for students tab

    $('#students').on('click', '.edit-student', function() {
        const studentData = JSON.parse($(this).attr('data-groups')); // Read directly from attribute
        const studentId = $(this).data('id'); // Other data attributes can still use .data()
        const studentCodigo = $(this).data('codigo');
        const studentNombre = $(this).data('nombre');

        $('#student-id').val(studentId);
        $('#student-codigo').val(studentCodigo);
        $('#student-nombre').val(studentNombre);

        // Select the student's assigned groups in the multi-select
        $('#student-groups option').prop('selected', false); // Deselect all first
        if (studentData && studentData.length > 0) { // studentData is now the parsed array
            studentData.forEach(group => {
                $(`#student-groups option[value="${group.id}"]`).prop('selected', true);
            });
        }
    });

    $('#students').on('click', '#cancel-edit-student', function() {
        $('#student-id').val(''); // Ensure ID is cleared for new entries
        $('#student-form')[0].reset();
        $('#student-groups option').prop('selected', false); // Deselect all groups
    });

    $('#students').on('submit', '#student-form', function(e) {
        e.preventDefault();
        const id = $('#student-id').val();
        const codigo = $('#student-codigo').val();
        const nombre = $('#student-nombre').val();
        const selectedGroupIds = $('#student-groups').val(); // Get array of selected group IDs

        const isUpdate = id ? true : false;
        const type = 'POST'; // Always use POST
        const data = {
            codigo,
            nombre,
            groups: selectedGroupIds
        };

        if (isUpdate) {
            data.id = id;
            data._method = 'PUT'; // Spoof PUT method
        }

        $.ajax({
            url: window.common.studentApiUrl(),
            type: type,
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify(data),
            success: function() {
                loadStudents(); // Reload students after save
                $('#student-id').val(''); // Clear ID after successful save/create
                $('#student-form')[0].reset(); // Reset form
                $('#student-groups option').prop('selected', false); // Deselect all groups
            },
            error: function(xhr, status, error) {
                console.error("Error saving student:", status, error, xhr.responseText);
                // Attempt to parse error response for user-friendly message
                let errorMessage = "Error al guardar el estudiante.";
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    if (errorResponse.message) {
                        errorMessage = errorResponse.message;
                    } else if (xhr.responseText.includes("Duplicate entry")) {
                        errorMessage = "Error: El código de estudiante ya existe. Por favor, use un código único.";
                    }
                } catch (e) {
                    // If response is not JSON, it might be the PHP fatal error HTML
                    if (xhr.responseText.includes("Duplicate entry")) {
                        errorMessage = "Error: El código de estudiante ya existe. Por favor, use un código único.";
                    } else {
                        errorMessage += " Verifique la consola para más detalles.";
                    }
                }
                alert(errorMessage); // Display error to user
            }
        });
    });

    $('#students').on('click', '.delete-student', function() {
        if (!confirm('¿Está seguro de que desea eliminar este estudiante?')) return;
        const id = $(this).data('id');
        $.ajax({
            url: window.common.studentApiUrl(),
            type: 'POST', // Always use POST
            contentType: 'application/json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
            },
            data: JSON.stringify({ id: id, _method: 'DELETE' }), // Spoof DELETE method
            success: function() {
                loadStudents(); // Reload students after delete
            },
            error: function(xhr, status, error) {
                console.error("Error deleting student:", status, error, xhr.responseText);
                alert("Error al eliminar el estudiante. Verifique la consola para más detalles.");
            }
        });
    });