// ExamenImplementation/frontend/js/groups.js

function loadGroups() {
    $.ajax({
        url: window.common.groupApiUrl(),
        type: 'GET',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + window.common.token);
        },
        success: function(groups) {
            let tableContent = '<table class="table"><thead><tr><th>ID</th><th>Nombre</th><th>Acciones</th></tr></thead><tbody>';
            groups.forEach(group => {
                tableContent += `<tr>
                    <td>${group.id}</td>
                    <td>${group.nombre}</td>
                    <td>
                        <button class="btn btn-sm btn-info edit-group" data-id="${group.id}" data-nombre="${group.nombre}">Editar</button>
                        <button class="btn btn-sm btn-danger delete-group" data-id="${group.id}">Eliminar</button>
                    </td>
                </tr>`;
            });
            tableContent += '</tbody></table>';
            $('#groups').html(`<h2>Grupos</h2>
                <form id="group-form">
                    <input type="hidden" id="group-id">
                    <div class="form-row">
                        <div class="col"><input type="text" id="group-nombre" class="form-control" placeholder="Nombre del Grupo" required></div>
                        <div class="col"><button type="submit" class="btn btn-primary">Guardar</button> <button type="button" class="btn btn-secondary" id="cancel-edit-group">Cancelar</button></div>
                    </div>
                </form><hr>${tableContent}`);
        },
        error: function(xhr, status, error) {
            console.error("Error loading groups:", status, error, xhr.responseText);
            $('#groups').html('<div class="alert alert-danger">Error al cargar los grupos. Verifique la consola del navegador.</div>');
        }
    });
}

// Event listeners for groups tab

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
