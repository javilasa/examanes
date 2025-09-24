// ExamenImplementation/frontend/js/exams.js

function loadExams() {
    $.ajax({
        url: window.common.examApiUrl(),
        type: 'GET',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
        },
        success: function(exams) {
            console.log("Exam data:", exams);
            let tableContent = '';
            exams.forEach(exam => {
                const groupNames = exam.groups.map(group => group.nombre).join(', ');
                tableContent += `<tr>
                    <td>${exam.id}</td>
                    <td>${exam.nombre}</td>
                    <td>${exam.code}</td>
                    <td>${exam.vigente == '0' ? 'NO' : 'SI'}</td>
                    <td>${groupNames}</td>
                    <td>
                        <button class="btn btn-sm btn-info edit-exam" 
                            data-id="${exam.id}" 
                            data-nombre="${exam.nombre}" 
                            data-code="${exam.code}" 
                            data-vigente="${exam.vigente}"
                            data-groups='${JSON.stringify(exam.groups.map(g => g.id))}'>Editar</button>
                        <button class="btn btn-sm btn-danger delete-exam" data-id="${exam.id}">Eliminar</button>
                    </td>
                </tr>`;
            });
            $('#examsTableBody').html(tableContent);
            loadGroupsIntoDropdown(); // Load groups into the dropdown after exams are loaded
        },
        error: function(xhr, status, error) {
            console.error("Error loading exams:", status, error, xhr.responseText);
            $('#exams').html('<div class="alert alert-danger">Error al cargar los exámenes. Verifique la consola del navegador.</div>');
        }
    });
}

function loadGroupsIntoDropdown() {
    $.ajax({
        url: window.common.groupApiUrl(),
        type: 'GET',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
        },
        success: function(groups) {
            let options = '';
            groups.forEach(group => {
                options += `<option value="${group.id}">${group.nombre}</option>`;
            });
            $('#examGroups').html(options);
        },
        error: function(xhr, status, error) {
            console.error("Error loading groups:", status, error, xhr.responseText);
        }
    });
}

// Event listeners for exams tab

$('#adminTabs a[href="#exams"]').on('shown.bs.tab', function (e) {
    loadExams();
});

$('#exams').on('click', '.edit-exam', function() {
    const examId = $(this).data('id');
    const examNombre = $(this).data('nombre');
    const examCode = $(this).data('code');
    const examVigente = $(this).data('vigente');
    const examGroups = $(this).data('groups'); // This will be an array of group IDs

    $('#examId').val(examId);
    $('#examName').val(examNombre);
    $('#examCode').val(examCode);
    $('#examVigente').prop('checked', Boolean(parseInt(examVigente)));

    // Pre-select groups in the dropdown
    $('#examGroups option').each(function() {
        if (examGroups.includes(parseInt($(this).val()))) {
            $(this).prop('selected', true);
        } else {
            $(this).prop('selected', false);
        }
    });

    $('#cancelEditExamBtn').show();
});

$('#exams').on('click', '#cancelEditExamBtn', function() {
    $('#examForm')[0].reset();
    $('#examId').val('');
    $('#examVigente').prop('checked', false); // Ensure checkbox is unchecked
    $('#examGroups option').prop('selected', false); // Deselect all groups
    $(this).hide();
});

$('#exams').on('submit', '#examForm', function(e) {
    e.preventDefault();
    const id = $('#examId').val();
    const nombre = $('#examName').val();
    const code = $('#examCode').val();
    const vigente = $('#examVigente').is(':checked') ? 1 : 0;
    const selectedGroupIds = $('#examGroups').val().map(id => parseInt(id)); // Get selected group IDs as integers

    const type = id ? 'PUT' : 'POST';
    const data = {
        nombre: nombre,
        code: code,
        vigente: vigente,
        groups: selectedGroupIds // Include selected group IDs
    };

    if (id) {
        data.id = id;
    }

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
            $('#cancelEditExamBtn').click(); // Reset form and hide cancel button
        },
        error: function(xhr, status, error) {
            console.error("Error saving exam:", status, error, xhr.responseText);
            alert("Error saving exam: " + xhr.responseText);
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
            alert("Error deleting exam: " + xhr.responseText);
        }
    });
});
