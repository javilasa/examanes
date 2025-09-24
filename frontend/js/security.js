function showNotification(message, duration = 5000) {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '10px 20px';
    notification.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '10000';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('security.js: DOMContentLoaded - Initializing security features.');
    
    let apiBaseUrl;
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('studentId');
    const examId = urlParams.get('examId');

    function initializeSecurityFeatures() {
        //const debugMode = urlParams.get('debug') === 'true';
        const debugMode = true;
        // Prevent right-click
        if (!debugMode) {
            /*document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                console.log('security.js: Right-click detected.');
                logIncident('right_click');
                showNotification('ADVERTENCIA: El clic derecho está deshabilitado durante el examen. Esta acción ha sido registrada.');
            });*/
        } else {
            console.log('security.js: Debug mode is on. Right-click is enabled.');
        }

        // Log window focus/blur events
        window.addEventListener('blur', () => {
            console.log('security.js: Window blur detected.');
            logIncident('window_blur');
            showNotification('ADVERTENCIA: Has salido de la ventana del examen. Esta acción ha sido registrada.');
        });

        window.addEventListener('focus', () => {
            console.log('security.js: Window focus detected.');
            logIncident('window_focus');
        });

        // Log window close/refresh events
        window.addEventListener('beforeunload', (event) => {
            console.log('security.js: beforeunload event detected.');
            logIncident('page_refresh');
        });

        window.addEventListener('unload', () => {
            console.log('security.js: unload event detected.');
            logIncident('window_close');
        });

        console.log('security.js: Event listeners attached.');
    }

    async function logIncident(incidentType) {
        if (!studentId || !examId) {
            console.warn('security.js: Cannot log incident: studentId or examId is missing.');
            return;
        }
        if (!apiBaseUrl) {
            console.error('security.js: apiBaseUrl is not set. Cannot log incident.');
            return;
        }

        const incidentUrl =  '/backend/api/exam_incident_api.php';
        const incidentData = {
            student_id: studentId,
            exam_id: examId,
            incident_type: incidentType
        };

        try {
            if (incidentType === 'window_close' || incidentType === 'page_refresh') {
                const blob = new Blob([JSON.stringify(incidentData)], { type: 'application/json; charset=utf-8' });
                navigator.sendBeacon(incidentUrl, blob);
                console.log(`security.js: Incident logged via sendBeacon: ${incidentType}`);
            } else {
                const response = await fetch(incidentUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(incidentData)
                });
                const result = await response.json();
                if (result.success) {
                    console.log(`security.js: Incident logged: ${incidentType}`);
                } else {
                    console.error(`security.js: Failed to log incident ${incidentType}:`, result.message);
                }
            }
        } catch (error) {
            console.error('security.js: Error logging incident:', error);
        }
    }

    // Load configuration to set apiBaseUrl
    $.getJSON('./js/env.json', function (env) {
        const currentEnvironment = env.environment || 'development';
        $.getJSON('./js/config.json', function (config) {
            apiBaseUrl = config.apiBaseUrl[currentEnvironment];
            console.log(`security.js - API Base URL: ${apiBaseUrl}`);
            initializeSecurityFeatures();
        }).fail(function () {
            console.error("security.js: Error loading config.json. Falling back to relative path.");
            apiBaseUrl = '/backend/api/'; // fallback
            initializeSecurityFeatures();
        });
    }).fail(function () {
        console.error("security.js: Error loading env.json. Falling back to development.");
        const currentEnvironment = 'development';
        $.getJSON('./js/config.json', function (config) {
            apiBaseUrl = config.apiBaseUrl[currentEnvironment];
            console.log(`security.js - API Base URL (fallback env): ${apiBaseUrl}`);
            initializeSecurityFeatures();
        }).fail(function () {
            console.error("security.js: Error loading config.json. Falling back to relative path.");
            apiBaseUrl = '/backend/api/'; // fallback
            initializeSecurityFeatures();
        });
    });
});
