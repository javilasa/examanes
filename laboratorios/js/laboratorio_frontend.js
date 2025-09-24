$(document).ready(function() {
    // --- Password Protection ---
    function checkPassword() {
        const password = prompt("Please enter the password to access this page:", "");
        if (password === "admin123") {
            $('#main-content').show();
            initializeApp(); // Initialize after successful login
        } else {
            alert("Incorrect password!");
            $('body').html('<div class="container mt-5"><div class="alert alert-danger">Access Denied</div></div>');
        }
    }

    // Global state
    let allLabs = [];
    let allGroups = [];

    // --- Initialization ---
    function initializeApp() {
        const groupsPromise = getGroups();
        const labsPromise = getLaboratorios();

        $.when(groupsPromise, labsPromise).done(function(groupsResponse, labsResponse) {
            allGroups = groupsResponse[0].data || [];
            allLabs = labsResponse[0].data || [];

            populateGroupSelectors(allGroups);
            populateLabSelectors(allLabs);
            renderLaboratoriosTable(allLabs);
        }).fail(function() {
            alert("Failed to initialize application data.");
        });
    }

    function populateGroupSelectors(groups) {
        const groupSelects = [$('#laboratorioGrupos'), $('#revisarGroupSelector')];
        groupSelects.forEach($select => {
            $select.empty();
            groups.forEach(group => {
                $select.append(`<option value="${group.id}">${group.nombre}</option>`);
            });
        });
    }

    function populateLabSelectors(labs) {
        const labSelects = [$('#itemLabSelector'), $('#revisarLabSelector')];
        labSelects.forEach($select => {
            $select.empty().append('<option value="">Select a lab...</option>');
            labs.forEach(lab => {
                $select.append(`<option value="${lab.id_laboratorio}">${lab.nombre}</option>`);
            });
        });
    }

    // --- Laboratorios Tab Logic ---
    function renderLaboratoriosTable(labs) {
        const $tableBody = $('#laboratoriosTableBody').empty();
        (labs || []).forEach(lab => {
            const groupsHtml = (lab.groups || []).map(g => `<span class="badge badge-secondary mr-1">${g.nombre}</span>`).join('') || 'None';
            const activoHtml = lab.activo == 1 ? '<span class="badge badge-success">Sí</span>' : '<span class="badge badge-danger">No</span>';
            const row = `
                <tr data-id="${lab.id_laboratorio}">
                    <td>${lab.id_laboratorio}</td>
                    <td>${lab.nombre}</td>
                    <td>${lab.codigo}</td>
                    <td>${groupsHtml}</td>
                    <td>${activoHtml}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-edit-lab">Edit</button>
                        <button class="btn btn-sm btn-danger btn-delete-lab">Delete</button>
                    </td>
                </tr>`;
            $tableBody.append(row);
        });
    }

    $('#laboratorioForm').on('submit', function(e) {
        e.preventDefault();
        const id = $('#laboratorioId').val();
        const nombre = $('#laboratorioNombre').val();
        const codigo = $('#laboratorioCodigo').val();
        const groupIds = $('#laboratorioGrupos').val();
        const activo = $('#laboratorioActivo').is(':checked') ? 1 : 0;

        const promise = id ? updateLaboratorio(id, nombre, codigo, activo, groupIds) : createLaboratorio(nombre, codigo, activo, groupIds);
        promise.done(() => { 
            resetLabForm();
            initializeApp(); // Re-init to get fresh data
        });
    });

    $('#laboratoriosTableBody').on('click', '.btn-edit-lab', function() {
        const labId = $(this).closest('tr').data('id');
        const lab = allLabs.find(l => l.id_laboratorio == labId);
        if (lab) {
            $('#laboratorioId').val(lab.id_laboratorio);
            $('#laboratorioNombre').val(lab.nombre);
            $('#laboratorioCodigo').val(lab.codigo);
            $('#laboratorioActivo').prop('checked', lab.activo == 1);
            const groupIds = (lab.groups || []).map(g => g.id);
            $('#laboratorioGrupos').val(groupIds);
            $('#cancelEditLabBtn').show();
        }
    });

    $('#laboratoriosTableBody').on('click', '.btn-delete-lab', function() {
        if (!confirm('Are you sure?')) return;
        const labId = $(this).closest('tr').data('id');
        deleteLaboratorio(labId).done(() => initializeApp());
    });
    
    $('#cancelEditLabBtn').on('click', resetLabForm);

    function resetLabForm() {
        $('#laboratorioForm')[0].reset();
        $('#laboratorioId').val('');
        $('#laboratorioGrupos').val([]);
        $('#laboratorioActivo').prop('checked', true);
        $('#cancelEditLabBtn').hide();
    }

    // --- Items Tab Logic ---
    $('#itemLabSelector').on('change', function() {
        const labId = $(this).val();
        if (labId) {
            renderItemsTable(labId);
            $('#itemForm').show();
        } else {
            $('#itemsTableBody').empty();
            $('#itemForm').hide();
        }
    });

    function renderItemsTable(labId) {
        getItemsForLaboratorio(labId).done(response => {
            const $tableBody = $('#itemsTableBody').empty();
            (response.data || []).forEach(item => {
                const row = `
                    <tr data-id="${item.id_item}">
                        <td>${item.id_item}</td>
                        <td>${item.nombre_archivo}</td>
                        <td>
                            <button class="btn btn-sm btn-primary btn-edit-item">Edit</button>
                            <button class="btn btn-sm btn-danger btn-delete-item">Delete</button>
                        </td>
                    </tr>`;
                $tableBody.append(row);
            });
        });
    }
    
    $('#itemForm').on('submit', function(e) {
        e.preventDefault();
        const labId = $('#itemLabSelector').val();
        const itemId = $('#itemId').val();
        const nombre = $('#itemNombre').val();
        
        const promise = itemId ? updateItemLaboratorio(itemId, nombre) : createItemLaboratorio(labId, nombre);
        promise.done(() => {
            resetItemForm();
            renderItemsTable(labId);
        });
    });

    $('#itemsTableBody').on('click', '.btn-edit-item', function() {
        const $row = $(this).closest('tr');
        const itemId = $row.data('id');
        const nombre = $row.find('td:eq(1)').text();
        $('#itemId').val(itemId);
        $('#itemNombre').val(nombre);
        $('#cancelEditItemBtn').show();
    });

    $('#itemsTableBody').on('click', '.btn-delete-item', function() {
        if (!confirm('Are you sure?')) return;
        const itemId = $(this).closest('tr').data('id');
        const labId = $('#itemLabSelector').val();
        deleteItemLaboratorio(itemId).done(() => renderItemsTable(labId));
    });

    $('#cancelEditItemBtn').on('click', resetItemForm);

    function resetItemForm() {
        $('#itemForm')[0].reset();
        $('#itemId').val('');
        $('#cancelEditItemBtn').hide();
    }

    // --- Revisar Tab Logic ---
    $('#revisarLabSelector, #revisarGroupSelector').on('change', function() {
        const labId = $('#revisarLabSelector').val();
        const groupId = $('#revisarGroupSelector').val();
        if (labId && groupId) {
            renderReviewTable(labId, groupId);
        }
    });

    function renderReviewTable(labId, groupId) {
        getReviewData(labId, groupId).done(response => {
            const $tableBody = $('#revisarTableBody').empty();
            (response.data || []).forEach(student => {
                const nota = student.nota !== null ? student.nota : '';
                const files = student.submitted_files ? student.submitted_files.split(', ').map(f => `<a href="${f}" target="_blank">${f}</a>`).join('<br>') : 'No files';
                const row = `
                    <tr data-student-id="${student.student_id}">
                        <td>${student.student_name}</td>
                        <td>${student.student_code}</td>
                        <td>${files}</td>
                        <td><input type="number" class="form-control form-control-sm nota-input" value="${nota}" step="0.1"></td>
                        <td><button class="btn btn-sm btn-success btn-save-nota">Save</button></td>
                    </tr>`;
                $tableBody.append(row);
            });
        });
    }

    $('#revisarTableBody').on('click', '.btn-save-nota', function() {
        const $row = $(this).closest('tr');
        const labId = $('#revisarLabSelector').val();
        const studentId = $row.data('student-id');
        const nota = $row.find('.nota-input').val();
        
        if (nota === '') {
            alert('Grade cannot be empty.');
            return;
        }

        createOrUpdateNota(labId, studentId, parseFloat(nota)).done(response => {
            alert("Grade saved!");
            $(this).removeClass('btn-warning').addClass('btn-success');
        });
    });

    $('#revisarTableBody').on('input', '.nota-input', function() {
        $(this).closest('tr').find('.btn-save-nota').removeClass('btn-success').addClass('btn-warning');
    });

    // --- Initial Load ---
    checkPassword();
});