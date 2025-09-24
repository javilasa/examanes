// main.js

const examCodeInput = document.getElementById('exam-code');
const checkExamBtn = document.getElementById('check-exam-btn');
const examMessage = document.getElementById('exam-message');
const examCodeSection = document.getElementById('exam-code-section');

const studentCodeInput = document.getElementById('student-code');
const checkStudentBtn = document.getElementById('check-student-btn');
const studentMessage = document.getElementById('student-message');
const studentCodeSection = document.getElementById('student-code-section');

const examDetailsSection = document.getElementById('exam-details-section');
const examNameDisplay = document.getElementById('exam-name');
const startExamBtn = document.getElementById('start-exam-btn');

const examQuestionsSection = document.getElementById('exam-questions-section');
const questionNumberDisplay = document.getElementById('question-number');
const questionTextDisplay = document.getElementById('question-text');
const answersContainer = document.getElementById('answers-container');
const nextQuestionBtn = document.getElementById('next-question-btn');
const finishExamBtn = document.getElementById('finish-exam-btn');

const examResultsSection = document.getElementById('exam-results-section');
const resultsMessage = document.getElementById('results-message');

let examId = null;
let studentId = null;
let currentQuestionIndex = 0;
let examData = null;
let currentExam = null; // New global variable to store exam details

// Function to display messages
function displayMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
}

// Helper function to get URL query parameters
function getQueryParams() {
    const params = {};
    window.location.search.substring(1).split('&').forEach(param => {
        const parts = param.split('=');
        params[parts[0]] = decodeURIComponent(parts[1]);
    });
    return params;
}

// Function to start exam directly from URL parameters
async function startExamFromUrlParams(eId, sId) {
    examId = eId;
    studentId = sId;

    try {
        // Fetch exam details to get exam name and groups
        const examResponse = await fetch(`/backend/api/public_exam_api.php?action=getExamById&id=${examId}`);
        const examDataResponse = await examResponse.json();

        if (examDataResponse.success && examDataResponse.exam) {
            currentExam = examDataResponse.exam;
            examNameDisplay.textContent = `Examen: ${currentExam.nombre}`;

            // Fetch remaining questions for the student
            const response = await fetch(`/backend/api/public_exam_api.php?action=getRemainingQuestions&student_id=${studentId}&exam_id=${examId}`);
            const data = await response.json();

            if (data.success) {
                if (data.status === 'resume' && data.questions && data.questions.length > 0) {
                    examData = data.questions;
                    currentQuestionIndex = 0;
                    examCodeSection.style.display = 'none';
                    studentCodeSection.style.display = 'none';
                    examDetailsSection.style.display = 'none'; // Hide details section as well
                    examQuestionsSection.style.display = 'block';
                    displayQuestion();
                    applyExamRestrictions(); // Apply restrictions after content is loaded
                } else if (data.status === 'completed') {
                    displayMessage(examMessage, 'Ya has completado este examen. Mostrando resultados...', 'success');
                    examCodeSection.style.display = 'none';
                    studentCodeSection.style.display = 'none';
                    examDetailsSection.style.display = 'none';
                    finishExam(); // Directly show results
                } else {
                    displayMessage(examMessage, data.message || 'No se encontraron preguntas para este examen o el estado es desconocido.', 'error');
                }
            } else {
                displayMessage(examMessage, data.message || 'Error al obtener las preguntas restantes.', 'error');
            }
        } else {
            displayMessage(examMessage, examDataResponse.message || 'Error al obtener detalles del examen.', 'error');
        }
    } catch (error) {
        console.error('Error starting exam from URL params:', error);
        displayMessage(examMessage, 'Error al cargar el examen. Intente de nuevo.', 'error');
    }
}

// Apply exam restrictions (disable text selection/copying)
function applyExamRestrictions() {
    const style = document.createElement('style');
    style.innerHTML = `
        body {
            -webkit-user-select: none; /* Safari */
            -moz-user-select: none; /* Firefox */
            -ms-user-select: none; /* IE 10+ */
            user-select: none; /* Standard syntax */
        }
    `;
    document.head.appendChild(style);

    document.addEventListener('copy', (e) => {
        e.preventDefault();
        alert('Copiar texto está deshabilitado durante el examen.');
    });
    document.addEventListener('cut', (e) => {
        e.preventDefault();
        alert('Cortar texto está deshabilitado durante el examen.');
    });
    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
    });
}

// Initial check for URL parameters
const queryParams = getQueryParams();
if (queryParams.examId && queryParams.studentId && queryParams.start === 'true') {
    startExamFromUrlParams(queryParams.examId, queryParams.studentId);
} else {
    // Step 1: Check Exam Code
    checkExamBtn.addEventListener('click', async () => {
        const examCode = examCodeInput.value.trim();
        if (!examCode) {
            displayMessage(examMessage, 'Por favor, ingrese el código del examen.', 'error');
            return;
        }

        try {
            // Assuming the API endpoint for exam details is /backend/api/public_exam_api.php
            const response = await fetch(`/backend/api/public_exam_api.php?action=getExamByCode&code=${examCode}`);
            const data = await response.json();
            console.log(data);
            if (data.success && data.exam) {
                if (data.exam.vigente == '1') { // Assuming 'vigente' is a string '1' or '0'
                    examId = data.exam.id;
                    currentExam = data.exam; // Store the exam data
                    examNameDisplay.textContent = `Examen: ${data.exam.nombre}`;
                    displayMessage(examMessage, 'Examen encontrado y activo.', 'success');
                    examCodeSection.style.display = 'none';
                    studentCodeSection.style.display = 'block';
                } else {
                    displayMessage(examMessage, 'El examen no está activo.', 'error');
                }
            } else {
                displayMessage(examMessage, data.message || 'Examen no encontrado.', 'error');
            }
        } catch (error) {
            console.error('Error checking exam code:', error);
            displayMessage(examMessage, 'Error al verificar el código del examen. Intente de nuevo.', 'error');
        }
    });
}

// Step 2: Check Student Code
checkStudentBtn.addEventListener('click', async () => {
    const studentCode = studentCodeInput.value.trim();
    if (!studentCode) {
        displayMessage(studentMessage, 'Por favor, ingrese su código de estudiante.', 'error');
        return;
    }

    try {
        // Assuming the API endpoint for student details is /backend/api/public_exam_api.php
        const response = await fetch(`/backend/api/public_exam_api.php?action=getStudentByCode&code=${studentCode}`);
        const data = await response.json();

        if (data.success && data.student) {
            studentId = data.student.id;

            // Group validation
            const studentGroups = data.student.groups.map(g => g.id);
            const examGroups = currentExam.groups.map(g => g.id);

            console.log("Student Groups IDs:", studentGroups);
            console.log("Exam Groups IDs:", examGroups);

            const hasCommonGroup = studentGroups.some(sgId => examGroups.includes(sgId));

            if (hasCommonGroup) {
                displayMessage(studentMessage, `Bienvenido, ${data.student.nombre}!`, 'success');
                studentCodeSection.style.display = 'none';
                examDetailsSection.style.display = 'block';
            } else {
                displayMessage(studentMessage, 'El estudiante no pertenece a un grupo asignado a este examen.', 'error');
            }
        } else {
            displayMessage(studentMessage, data.message || 'Estudiante no encontrado.', 'error');
        }
    } catch (error) {
        console.error('Error checking student code:', error);
        displayMessage(studentMessage, 'Error al verificar el código del estudiante. Intente de nuevo.', 'error');
    }
});

startExamBtn.addEventListener('click', () => {
    const timestamp = new Date().getTime();
    const examUrl = `exam.html?examId=${examId}&studentId=${studentId}&start=true&timestamp=${timestamp}`;
    const features = 'fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,resizable=no';
    const newWindow = window.open(examUrl, '_blank', features);
    if (!newWindow) {
        alert('El navegador bloqueó la ventana emergente. Por favor, permita las ventanas emergentes para este sitio.');
    }
});

// Function to display current question
function displayQuestion() {
    if (currentQuestionIndex < examData.length) {
        const question = examData[currentQuestionIndex];
        questionNumberDisplay.textContent = `Pregunta ${currentQuestionIndex + 1} de ${examData.length}`;
        questionTextDisplay.textContent = question.pregunta; // Changed from question.question_text
        answersContainer.innerHTML = ''; // Clear previous answers

        question.answers.forEach(answer => {
            const answerDiv = document.createElement('div');
            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = 'answer';
            radioInput.value = answer.id;
            radioInput.id = `answer-${answer.id}`;

            const label = document.createElement('label');
            label.htmlFor = `answer-${answer.id}`;
            label.textContent = answer.respuesta; // Changed from answer.answer_text

            answerDiv.appendChild(radioInput);
            answerDiv.appendChild(label);
            answersContainer.appendChild(answerDiv);
        });

        // Show/hide next and finish buttons
        if (currentQuestionIndex === examData.length - 1) {
            nextQuestionBtn.style.display = 'none';
            finishExamBtn.style.display = 'block';
        } else {
            nextQuestionBtn.style.display = 'block';
            finishExamBtn.style.display = 'none';
        }
    } else {
        // This case should ideally not be reached if logic is correct
        console.warn('Attempted to display question beyond examData length.');
        finishExam();
    }
}

// Function to save answer
async function saveAnswer(questionId, answerId) {
    console.log("Sending AJAX request to save student answer...");
    try {
        const response = await fetch('/backend/api/answer_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'saveStudentAnswer',
                student_id: studentId,
                exam_id: examId,
                question_id: questionId,
                answer_id: answerId
            })
        });
        const data = await response.json();
        if (data.success) {
            console.log("AJAX request for student answer saving completed (success).");
        } else {
            console.error('Error saving answer:', data.message);
            // Optionally display an error to the user
        }
    } catch (error) {
        console.error("AJAX request for student answer saving completed (error):", error);
        // Optionally display an error to the user
    }
}

// Function to move to the next question
nextQuestionBtn.addEventListener('click', async () => {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (!selectedAnswer) {
        displayMessage(examMessage, 'Por favor, seleccione una respuesta antes de continuar.', 'error');
        return;
    }

    nextQuestionBtn.disabled = true; // Disable button
    const question = examData[currentQuestionIndex];
    await saveAnswer(question.id, selectedAnswer.value);
    nextQuestionBtn.disabled = false; // Re-enable button

    currentQuestionIndex++;
    if (currentQuestionIndex < examData.length) {
        displayQuestion();
    } else {
        finishExam();
    }
});

// Function to finish exam
finishExamBtn.addEventListener('click', async () => {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (!selectedAnswer) {
        displayMessage(examMessage, 'Por favor, seleccione una respuesta antes de finalizar.', 'error');
        return;
    }

    finishExamBtn.disabled = true; // Disable button
    const question = examData[currentQuestionIndex];
    await saveAnswer(question.id, selectedAnswer.value);
    finishExamBtn.disabled = false; // Re-enable button

    finishExam();
});

async function finishExam() {
    examQuestionsSection.style.display = 'none';
    examResultsSection.style.display = 'block';
    resultsMessage.textContent = 'Cargando resultados...'; // Update message while fetching

    try {
        const response = await fetch(`/backend/api/results_api.php?action=getExamResults&student_id=${studentId}&exam_id=${examId}`);
        const data = await response.json();
        console.log("results_api");
        console.log(data);

        if (data.success && data.data) {
            const resultsData = data.data;

            // Clear previous content in results section
            examResultsSection.innerHTML = '';

            // Add a title
            const title = document.createElement('h2');
            title.textContent = 'Resultados del Examen';
            examResultsSection.appendChild(title);

            // Display student and exam info
            const infoDiv = document.createElement('div');
            infoDiv.innerHTML = `
                <p><strong>Estudiante:</strong> ${resultsData.student.nombre} (${resultsData.student.codigo})</p>
                <p><strong>Examen:</strong> ${resultsData.exam_name}</p>
                <p><strong>Puntaje Total:</strong> ${resultsData.total_score}</p>
            `;
            examResultsSection.appendChild(infoDiv);

            // Display individual question results
            const questionsResultsDiv = document.createElement('div');
            questionsResultsDiv.className = 'questions-results';

            resultsData.results.forEach((result, index) => {
                const questionResultDiv = document.createElement('div');
                questionResultDiv.className = 'question-result-item';
                questionResultDiv.innerHTML = `
                    <h3>Pregunta ${index + 1}: ${result.pregunta}</h3>
                    <p><strong>Tu respuesta:</strong> ${result.respuesta_estudiante} ${result.es_correcta_estudiante ? '<span style="color: green;">(Correcta)</span>' : '<span style="color: red;">(Incorrecta)</span>'}</p>
                    <p><strong>Respuesta correcta:</strong> ${result.respuesta_correcta}</p>
                    <p><strong>Peso de la pregunta:</strong> ${result.peso_pregunta}</p>
                `;
                questionsResultsDiv.appendChild(questionResultDiv);
            });
            examResultsSection.appendChild(questionsResultsDiv);

        } else {
            resultsMessage.textContent = data.message || '¡Examen finalizado! No se pudieron cargar los resultados.';
            examResultsSection.appendChild(resultsMessage); // Append message if results not found
        }
    } catch (error) {
        console.error('Error fetching exam results:', error);
        resultsMessage.textContent = '¡Examen finalizado! Error al cargar los resultados.';
        examResultsSection.appendChild(resultsMessage); // Append message on error
    }
}
