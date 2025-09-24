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

$(document).ready(function() {

    // Admin Login
    if (window.location.pathname.endsWith('login.html')) {
        $('#admin-login-form').on('submit', function(e) {
            e.preventDefault();
            const password = $('#password').val();
            $.ajax({
                url: window.common.configApiUrl(),
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ action: 'admin_login', password }),
                success: function(response) {
                    if (response.success) {
                        sessionStorage.setItem('admin_logged_in', 'true');
                        window.location.href = 'index.html';
                    } else {
                        alert('Invalid password');
                    }
                }
            });
        });
        return;
    }

    // Check if admin is logged in
    if (!sessionStorage.getItem('admin_logged_in')) {
        window.location.href = 'login.html';
        return;
    }

    // Logout
    $('#logout-btn').on('click', function() {
        sessionStorage.removeItem('admin_logged_in');
        window.location.href = 'login.html';
    });

    // Initialize the app and then load the default tab (students)
    $.getJSON('/frontend/js/env.json', function(envConfig) {
        window.common.initializeApp(envConfig.environment, function() {
            // Load the default tab content after app is initialized
            const activeTabHref = $('ul.nav-tabs li a.active').attr('href');
            if (activeTabHref) {
                const activeTabId = activeTabHref.substring(1);
                switch (activeTabId) {
                    case 'students':
                        loadStudents();
                        break;
                    case 'exams':
                        loadExams();
                        break;
                    case 'questions':
                        loadQuestions();
                        break;
                    case 'answers':
                        loadAnswers();
                        break;
                    case 'config':
                        loadConfig();
                        break;
                    case 'groups':
                        loadGroups();
                        break;
                    case 'results':
                        loadResults();
                        break;
                }
            }
        });
    }).fail(function() {
        console.error("Error loading env.json. Falling back to development environment.");
        window.common.initializeApp('development', function() {
            const activeTabHref = $('ul.nav-tabs li a.active').attr('href');
            if (activeTabHref) {
                const activeTabId = activeTabHref.substring(1);
                switch (activeTabId) {
                    case 'students':
                        loadStudents();
                        break;
                    case 'exams':
                        loadExams();
                        break;
                    case 'questions':
                        loadQuestions();
                        break;
                    case 'answers':
                        loadAnswers();
                        break;
                    case 'config':
                        loadConfig();
                        break;
                    case 'groups':
                        loadGroups();
                        break;
                    case 'results':
                        loadResults();
                        break;
                }
            }
        });
    });

    // Tab change listener
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var target = $(e.target).attr("href") // activated tab
        if (target === '#students') {
            loadStudents();
        } else if (target === '#exams') {
            loadExams();
        } else if (target === '#questions') {
            loadQuestions();
        } else if (target === '#answers') {
            loadAnswers();
        } else if (target === '#config') {
            loadConfig();
        } else if (target === '#groups') {
            loadGroups();
        } else if (target === '#results') {
            loadResults();
        }
    });

});