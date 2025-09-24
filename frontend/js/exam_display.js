// js/exam_display.js

document.addEventListener('DOMContentLoaded', () => {
    const questionNumberDisplay = document.getElementById('question-number');
    const questionTextDisplay = document.getElementById('question-text');
    const answersContainer = document.getElementById('answers-container');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const finishExamBtn = document.getElementById('finish-exam-btn');
    const examMessage = document.getElementById('exam-message');

    const examQuestionsSection = document.getElementById('exam-questions-section');
    const examResultsSection = document.getElementById('exam-results-section');
    const resultsMessage = document.getElementById('results-message');

    let examId = null;
    let studentId = null;
    let currentQuestionIndex = 0;
    let examData = null;
    let isLosingFocus = false;

    // --- Incident Handler Functions ---
    const handleFocusLoss = (incidentType) => {
        if (isLosingFocus) return;
        isLosingFocus = true;

        logIncident(incidentType);
        alert('ADVERTENCIA: Has salido de la ventana del examen. Esta acción ha sido registrada.');

        setTimeout(() => {
            isLosingFocus = false;
        }, 500);
    };

    const handleVisibilityChange = () => {
        if (document.hidden) {
            handleFocusLoss('visibility_change');
        }
    };

    const handleBlur = () => {
        if (!document.hasFocus()) {
            handleFocusLoss('blur');
        }
    };

    const handleUnload = () => {
        if (studentId && examId) {
            const data = {
                student_id: studentId,
                exam_id: examId,
                incident_type: 'window_close'
            };
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json; charset=utf-8' });
            navigator.sendBeacon('/backend/api/exam_incident_api.php', blob);
        }
    };

    function addIncidentListeners() {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('unload', handleUnload);
    }

    function removeIncidentListeners() {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('unload', handleUnload);
    }

    function displayMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;
    }

    function getQueryParams() {
        const params = {};
        window.location.search.substring(1).split('&').forEach(param => {
            const parts = param.split('=');
            params[parts[0]] = decodeURIComponent(parts[1]);
        });
        return params;
    }

    async function startExam() {
        const params = getQueryParams();
        examId = params.examId;
        studentId = params.studentId;

        if (!examId || !studentId) {
            displayMessage(examMessage, 'Faltan parámetros para iniciar el examen.', 'error');
            return;
        }

        try {
            const response = await fetch(`/backend/api/public_exam_api.php?action=getRemainingQuestions&student_id=${studentId}&exam_id=${examId}`);
            const data = await response.json();

            if (data.success) {
                if (data.status === 'resume' && data.questions && data.questions.length > 0) {
                    examData = data.questions;
                    currentQuestionIndex = 0;
                    examQuestionsSection.style.display = 'block';
                    displayQuestion();
                    applyExamRestrictions();
                    addIncidentListeners();
                } else if (data.status === 'completed') {
                    displayMessage(examMessage, 'Ya has completado este examen. Mostrando resultados...', 'success');
                    examQuestionsSection.style.display = 'none';
                    finishExam();
                } else {
                    displayMessage(examMessage, data.message || 'No se encontraron preguntas para este examen.', 'error');
                }
            } else {
                displayMessage(examMessage, data.message || 'Error al obtener las preguntas.', 'error');
            }
        } catch (error) {
            console.error('Error starting exam:', error);
            displayMessage(examMessage, 'Error al cargar el examen. Intente de nuevo.', 'error');
        }
    }

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

    function displayQuestion() {
        if (currentQuestionIndex < examData.length) {
            const question = examData[currentQuestionIndex];
            questionNumberDisplay.textContent = `Pregunta ${currentQuestionIndex + 1} de ${examData.length}`;
            questionTextDisplay.textContent = question.pregunta;
            answersContainer.innerHTML = '';

            question.answers.forEach(answer => {
                const answerDiv = document.createElement('div');
                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = 'answer';
                radioInput.value = answer.id;
                radioInput.id = `answer-${answer.id}`;

                const label = document.createElement('label');
                label.htmlFor = `answer-${answer.id}`;
                label.textContent = answer.respuesta;

                answerDiv.appendChild(radioInput);
                answerDiv.appendChild(label);
                answersContainer.appendChild(answerDiv);
            });

            if (currentQuestionIndex === examData.length - 1) {
                nextQuestionBtn.style.display = 'none';
                finishExamBtn.style.display = 'block';
            } else {
                nextQuestionBtn.style.display = 'block';
                finishExamBtn.style.display = 'none';
            }
        } else {
            finishExam();
        }
    }

    async function saveAnswer(questionId, answerId) {
        try {
            const response = await fetch('/backend/api/answer_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveStudentAnswer',
                    student_id: studentId,
                    exam_id: examId,
                    question_id: questionId,
                    answer_id: answerId
                })
            });
            const data = await response.json();
            if (!data.success) {
                console.error('Error saving answer:', data.message);
            }
        } catch (error) {
            console.error("Error saving answer:", error);
        }
    }

    async function logIncident(incidentType) {
        try {
            await fetch('/backend/api/exam_incident_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    exam_id: examId,
                    incident_type: incidentType
                })
            });
        } catch (error) {
            console.error('Failed to log incident:', error);
        }
    }

    nextQuestionBtn.addEventListener('click', async () => {
        const selectedAnswer = document.querySelector('input[name="answer"]:checked');
        if (!selectedAnswer) {
            displayMessage(examMessage, 'Por favor, seleccione una respuesta.', 'error');
            return;
        }

        nextQuestionBtn.disabled = true;
        const question = examData[currentQuestionIndex];
        await saveAnswer(question.id, selectedAnswer.value);
        nextQuestionBtn.disabled = false;

        currentQuestionIndex++;
        if (currentQuestionIndex < examData.length) {
            displayQuestion();
        } else {
            finishExam();
        }
    });

    finishExamBtn.addEventListener('click', async () => {
        const selectedAnswer = document.querySelector('input[name="answer"]:checked');
        if (!selectedAnswer) {
            displayMessage(examMessage, 'Por favor, seleccione una respuesta.', 'error');
            return;
        }

        finishExamBtn.disabled = true;
        const question = examData[currentQuestionIndex];
        await saveAnswer(question.id, selectedAnswer.value);
        finishExamBtn.disabled = false;

        finishExam();
    });

    async function finishExam() {
        removeIncidentListeners();

        examQuestionsSection.style.display = 'none';
        examResultsSection.style.display = 'block';
        resultsMessage.textContent = 'Cargando resultados...';

        try {
            const response = await fetch(`/backend/api/results_api.php?action=getExamResults&student_id=${studentId}&exam_id=${examId}`);
            const data = await response.json();

            if (data.success && data.data) {
                const resultsData = data.data;
                examResultsSection.innerHTML = '';

                const title = document.createElement('h2');
                title.textContent = 'Resultados del Examen1';
                examResultsSection.appendChild(title);

                const baseScore = resultsData.total_score;
                const incidents = resultsData.incident_count;
                const penalty = baseScore * 0.20 * incidents;
                let finalScore = baseScore - penalty;
                if (finalScore < 0) {
                    finalScore = 0;
                }

                const infoDiv = document.createElement('div');
                infoDiv.innerHTML = `
                    <p><strong>Estudiante:</strong> ${resultsData.student.nombre} (${resultsData.student.codigo})</p>
                    <p><strong>Examen:</strong> ${resultsData.exam_name}</p>
                    <p><strong>Puntaje:</strong> ${baseScore}</p>
                    <p><strong>Incidentes:</strong> ${incidents}</p>
                    <p><strong>PUNTAJE TOTAL:</strong> ${finalScore.toFixed(2)}</p>
                `;
                examResultsSection.appendChild(infoDiv);

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

                const closeButton = document.createElement('button');
                closeButton.textContent = 'Cerrar Examen';
                closeButton.onclick = () => {
                    window.close();
                };
                examResultsSection.appendChild(closeButton);

            } else {
                resultsMessage.textContent = data.message || '¡Examen finalizado! No se pudieron cargar los resultados.';
                examResultsSection.appendChild(resultsMessage);
            }
        } catch (error) {
            console.error('Error fetching exam results:', error);
            resultsMessage.textContent = '¡Examen finalizado! Error al cargar los resultados.';
            examResultsSection.appendChild(resultsMessage);
        }
    }

    startExam();
});
