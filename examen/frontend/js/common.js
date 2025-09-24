// ExamenImplementation/frontend/js/common.js

// IMPORTANT: This is a placeholder token. In a real application, you would have a login system for the admin.
const token = "admin_token";
let apiBaseUrl;
let currentEnvironment;

const studentApiUrl = () => apiBaseUrl + 'student_api.php';
const examApiUrl = () => apiBaseUrl + 'exam_api.php';
const questionApiUrl = () => apiBaseUrl + 'question_api.php';
const answerApiUrl = () => apiBaseUrl + 'answer_api.php';
const configApiUrl = () => '/backend/api/config_api.php';
const groupApiUrl = () => apiBaseUrl + 'group_api.php';
const resultsApiUrl = () => apiBaseUrl + 'results_api.php';
const studentGroupApiUrl = (studentId) => apiBaseUrl + `group_api.php?student_id=${studentId}`;

function initializeApp(env, callback) {
    currentEnvironment = env;
    $.getJSON('/frontend/js/config.json', function(config) {
        apiBaseUrl = config.apiBaseUrl[currentEnvironment];
        if (callback) {
            callback();
        }
    }).fail(function() {
        console.error("Error loading config.json. Falling back to development environment.");
        apiBaseUrl = '/backend/api/'; // Fallback if config.json is not available
        if (callback) {
            callback();
        }
    });
}

// Exporting variables and functions for use in other modules
// Note: In a real module system (ESM), you'd use 'export'.
// For jQuery context, we'll attach to window or pass as arguments.
window.common = {
    token,
    studentApiUrl,
    examApiUrl,
    questionApiUrl,
    answerApiUrl,
    configApiUrl,
    groupApiUrl,
    resultsApiUrl,
    studentGroupApiUrl,
    initializeApp
};