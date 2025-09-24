$(document).ready(function() {
    let apiBaseUrl;
    let currentEnvironment;

    function initializeApp(env) {
        currentEnvironment = env;
        $.getJSON('js/config.json', function(config) {
            apiBaseUrl = config.apiBaseUrl[currentEnvironment];
            const apiUrl = apiBaseUrl + 'exam_service.php';

            // Login
            $('#login-form').on('submit', function(e) {
                e.preventDefault();
                const codigo_acceso = $('#codigo_acceso').val();
                const codigo_estudiante = $('#codigo_estudiante').val();

                $.ajax({
                    url: apiUrl + '?endpoint=login',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ codigo_acceso, codigo_estudiante }),
                    success: function(response) {
                        localStorage.setItem('token', response.token);
                        localStorage.setItem('examen_nombre', response.examen_nombre);
                        localStorage.setItem('estudiante_nombre', response.estudiante_nombre);
                        window.location.href = 'exam.html';
                    },
                    error: function() {
                        alert('Código de acceso o de estudiante inválido.');
                    }
                });
            });

            // Exam page
            if (window.location.pathname.endsWith('exam.html')) {
                const token = localStorage.getItem('token');
                if (!token) {
                    window.location.href = 'index.html';
                    return;
                }

                $('#exam-title').text(localStorage.getItem('examen_nombre'));
                $('#student-name').text(localStorage.getItem('estudiante_nombre'));

                $('#start-exam').on('click', function() {
                    const elem = document.documentElement;
                    if (elem.requestFullscreen) {
                        elem.requestFullscreen();
                    } else if (elem.mozRequestFullScreen) { /* Firefox */
                        elem.mozRequestFullScreen();
                    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                        elem.webkitRequestFullscreen();
                    } else if (elem.msRequestFullscreen) { /* IE/Edge */
                        elem.msRequestFullscreen();
                    }

                    $(this).hide();
                    $('#exam-content').show();
                    // Add logic to fetch and display questions
                });

                $(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', function() {
                    if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
                        alert('Has salido de la pantalla completa. Esto quedará registrado.');
                    }
                });
            }
        });
    }

    $.ajax({
        url: 'backend/api/config_api.php', // This needs to be a fixed path
        type: 'GET',
        success: function(envConfig) {
            initializeApp(envConfig.environment);
        },
        error: function() {
            // Fallback to development if env.json is not available
            initializeApp('development');
        }
    });
});