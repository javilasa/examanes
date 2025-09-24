// ExamenImplementation/frontend/js/config.js

function loadConfig() {
    $.ajax({
        url: window.common.configApiUrl(),
        type: 'GET',
        success: function(envConfig) {
            console.log("Loading config tab, current environment is:", envConfig.environment);
            $('#config').html(`<h2>Configuración</h2>
                <form id="config-form">
                    <div class="form-group">
                        <label for="environment-select">Ambiente</label>
                        <select class="form-control" id="environment-select">
                            <option value="development">Desarrollo</option>
                            <option value="production">Producción</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </form>`);
            $('#environment-select').val(envConfig.environment);
        },
        error: function(xhr, status, error) {
            console.error("Error loading environment:", status, error, xhr.responseText);
        }
    });
}

// Event listeners for config tab

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
