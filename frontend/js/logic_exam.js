$(document).ready(function () {
    window.examActive = false; // Initialize exam state
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('exam_id');
    const studentCode = urlParams.get('student_code');

    let questions = [];
    let currentQuestionIndex = 0;
    let studentId = null;
    let selectedAnswerId = null;

    const questionTextElem = $('#question-text');
    const answersContainerElem = $('#answers-container');
    const nextQuestionBtn = $('#next-question');
    const finishExamBtn = $('#finish-exam');
    const examContentElem = $('#exam-content');
    const startExamBtn = $('#start-exam');
    const examTitleElem = $('#exam-title');
    const studentNameElem = $('#student-name');

    if (!examId || !studentCode) {
        alert('Error: Exam ID or Student Code not provided.');
        window.close(); // Close the window if essential parameters are missing
        return;
    }

    // Initial setup: Hide exam content, show start button
    examContentElem.hide();
    startExamBtn.show();

    // Fetch student details and exam title
    fetchStudentDetails(studentCode);

    startExamBtn.on('click', function() {
        startExamBtn.hide();
        // examContentElem.show(); // Removed: will be shown conditionally in fetchExamQuestions
        fetchExamQuestions(examId);
    });

    function fetchStudentDetails(code) {
        const apiUrl = `../backend/api/public_exam_api.php?action=getStudentByCode&code=${encodeURIComponent(code)}`;
        $.ajax({
            url: apiUrl,
            method: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response.success && response.student) {
                    studentId = response.student.id;
                    studentNameElem.text(`Estudiante: ${response.student.nombre}`);
                } else {
                    alert('Error fetching student details: ' + (response.message || 'Unknown error'));
                    window.close();
                }
            },
            error: function (xhr, status, error) {
                alert('AJAX Error fetching student details: ' + status + ' ' + error);
                window.close();
            }
        });
    }

    function fetchExamQuestions(id) {
        const apiUrl = `/backend/api/public_exam_api.php?action=getRemainingQuestions&student_id=${encodeURIComponent(studentId)}&exam_id=${encodeURIComponent(id)}`;
        console.log(apiUrl);
        $.ajax({
            url: apiUrl,
            method: 'GET',
            dataType: 'json',
            success: function (response) {
                console.log(response);
                if (response.success) {
                    console.log('1');
                    if (response.questions && response.questions.length > 0) {
                        console.log('pre')
                        examContentElem.show(); // Show exam content only if questions are available
                        questions = shuffleArray(response.questions);
                        console.log('questions');
                        console.log(questions);

                        examTitleElem.text(questions[0].exam_name); // Assuming exam_name is part of the question object
                        displayQuestion(); // displayQuestion will set window.examActive
                    } else {
                        alert('No questions found for this exam or error fetching questions: ' + (response.message || 'Unknown error'));
                        //window.close();
                    }
                } else {
                    alert('Error al obtener las preguntas: ' + (response.message || 'Unknown error'));
                    //window.close();
                }
            },
            error: function (xhr, status, error) {
                alert('AJAX Error fetching exam questions: ' + status + ' ' + error);
                window.close();
            }
        });
    }

    function displayQuestion() {
        if (currentQuestionIndex < questions.length) {
            window.examActive = true; // Exam is active while displaying questions
            const question = questions[currentQuestionIndex];
            console.log('Current Question:', question); // Added console log
            questionTextElem.text(question.pregunta);
            answersContainerElem.empty();
            selectedAnswerId = null; // Reset selected answer for new question
            nextQuestionBtn.prop('disabled', true); // Disable next button until an answer is selected

            question.answers.forEach(answer => {
                console.log('Current Answer:', answer); // Added console log
                const answerDiv = $('<div>');
                const radioBtn = $('<input type="radio" name="answer" id="answer-' + answer.id + '" value="' + answer.id + '">');
                const label = $('<label for="answer-' + answer.id + '">').text(answer.respuesta);

                radioBtn.on('change', function() {
                    selectedAnswerId = $(this).val();
                    nextQuestionBtn.prop('disabled', false); // Enable next button
                });

                answerDiv.append(radioBtn, label);
                answersContainerElem.append(answerDiv);
            });

            // Adjust button visibility for the last question
            if (currentQuestionIndex === questions.length - 1) {
                nextQuestionBtn.text('Terminar Examen');
            } else {
                nextQuestionBtn.text('Siguiente');
            }
            finishExamBtn.hide(); // Ensure finish button is hidden until all questions are answered
        } else {
            // All questions answered
            window.examActive = false; // Exam is no longer active
            questionTextElem.text('Has completado el examen.');
            answersContainerElem.empty();
            nextQuestionBtn.hide();
            finishExamBtn.show();
        }
    }

    function saveAnswer() {
        if (!selectedAnswerId) {
            alert('Por favor, selecciona una respuesta antes de continuar.');
            return;
        }

        const currentQuestion = questions[currentQuestionIndex];
        const apiUrl = '../backend/api/public_exam_api.php';

        $.ajax({
            url: apiUrl,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                action: 'saveStudentAnswer',
                student_id: studentId,
                exam_id: examId,
                question_id: currentQuestion.id,
                answer_id: selectedAnswerId
            }),
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    currentQuestionIndex++;
                    displayQuestion();
                } else {
                    alert('Error saving answer: ' + (response.message || 'Unknown error'));
                }
            },
            error: function (xhr, status, error) {
                alert('AJAX Error saving answer: ' + status + ' ' + error + ' - ' + xhr.responseText);
            }
        });
    }

    nextQuestionBtn.on('click', saveAnswer);

    finishExamBtn.on('click', function() {
        window.examActive = false; // Exam is no longer active
        // Redirect to results page, passing exam_id and student_id
        window.location.href = `results.html?exam_id=${examId}&student_id=${studentId}`;
    });

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }
});
