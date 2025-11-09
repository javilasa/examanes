const laboratorioApiUrl = () => '/backend/api/laboratorio_api.php';

function getAuthHeaders() {
    const token = window.common ? window.common.token : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'; // Fallback
    return { 'Authorization': 'Bearer ' + token };
}

function handleAjaxError(jqXHR, textStatus, errorThrown) {
    console.error("AJAX Error:", textStatus, errorThrown, jqXHR.responseText);
    alert(`An API error occurred: ${errorThrown}. Check the console for more details.`);
}

// --- Laboratorios REST Calls ---
function getLaboratorios() {
    return $.ajax({
        url: laboratorioApiUrl(), type: 'POST', headers: getAuthHeaders(), contentType: 'application/json',
        data: JSON.stringify({ action: 'getLaboratorios' }), error: handleAjaxError
    });
}

function createLaboratorio(nombre, codigo, activo, groupIds) {
    return $.ajax({
        url: laboratorioApiUrl(), type: 'POST', headers: getAuthHeaders(), contentType: 'application/json',
        data: JSON.stringify({ action: 'createLaboratorio', nombre, codigo, activo, groups: groupIds }), error: handleAjaxError
    });
}

function updateLaboratorio(id, nombre, codigo, activo, groupIds) {
    return $.ajax({
        url: laboratorioApiUrl(), type: 'POST', headers: getAuthHeaders(), contentType: 'application/json',
        data: JSON.stringify({ action: 'updateLaboratorio', id, nombre, codigo, activo, groups: groupIds }), error: handleAjaxError
    });
}

function deleteLaboratorio(id) {
    return $.ajax({
        url: laboratorioApiUrl(), type: 'POST', headers: getAuthHeaders(), contentType: 'application/json',
        data: JSON.stringify({ action: 'deleteLaboratorio', id }), error: handleAjaxError
    });
}

// --- Groups REST Calls ---
function getGroups() {
    return $.ajax({
        url: laboratorioApiUrl(), type: 'POST', headers: getAuthHeaders(), contentType: 'application/json',
        data: JSON.stringify({ action: 'getGroups' }), error: handleAjaxError
    });
}

// --- Items REST Calls ---
function getItemsForLaboratorio(labId) {
    return $.ajax({
        url: laboratorioApiUrl(), type: 'POST', headers: getAuthHeaders(), contentType: 'application/json',
        data: JSON.stringify({ action: 'getItemsForLaboratorio', id_laboratorio: labId }), error: handleAjaxError
    });
}

function createItemLaboratorio(labId, nombreArchivo) {
    return $.ajax({
        url: laboratorioApiUrl(), type: 'POST', headers: getAuthHeaders(), contentType: 'application/json',
        data: JSON.stringify({ action: 'createItemLaboratorio', id_laboratorio: labId, nombre_archivo: nombreArchivo }), error: handleAjaxError
    });
}

function updateItemLaboratorio(itemId, nombreArchivo) {
    return $.ajax({
        url: laboratorioApiUrl(), type: 'POST', headers: getAuthHeaders(), contentType: 'application/json',
        data: JSON.stringify({ action: 'updateItemLaboratorio', id_item: itemId, nombre_archivo: nombreArchivo }), error: handleAjaxError
    });
}

function deleteItemLaboratorio(itemId) {
    return $.ajax({
        url: laboratorioApiUrl(), type: 'POST', headers: getAuthHeaders(), contentType: 'application/json',
        data: JSON.stringify({ action: 'deleteItemLaboratorio', id_item: itemId }), error: handleAjaxError
    });
}

// --- Review & Notas REST Calls ---
function getReviewData(labId, groupId) {
    return $.ajax({
        url: laboratorioApiUrl(), type: 'POST', headers: getAuthHeaders(), contentType: 'application/json',
        data: JSON.stringify({ action: 'getReviewData', id_laboratorio: labId, id_grupo: groupId }), error: handleAjaxError
    });
}

function createOrUpdateNota(labId, studentId, nota) {
    return $.ajax({
        url: laboratorioApiUrl(), type: 'POST', headers: getAuthHeaders(), contentType: 'application/json',
        data: JSON.stringify({ action: 'createOrUpdateNota', id_laboratorio: labId, id_student: studentId, nota: nota }), error: handleAjaxError
    });
}

function exportLaboratorios(labIds) {
    return $.ajax({
        url: laboratorioApiUrl(),
        type: 'POST',
        headers: getAuthHeaders(),
        contentType: 'application/json',
        data: JSON.stringify({ action: 'exportLaboratorios', labIds: labIds }),
        error: handleAjaxError
    });
}