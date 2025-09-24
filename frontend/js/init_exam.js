$(document).ready(function () {
    const examEntryForm = $('#examEntryForm');
    const examCodeInput = $('#examCode');
    const studentCodeInput = $('#studentCode');
    const messageDiv = $('#exam-message');
    const startExamSection = $('#exam-details-section');
    const startExamBtn = $('#start-exam-btn');

    let examData = null; // To store exam details upon successful validation


    examEntryForm.on('click', function (e) {
        e.preventDefault(); // Prevent default form submission
        messageDiv.text('').removeClass('error success'); // Clear previous messages

        const examCode = examCodeInput.val().trim();
        const studentCode = studentCodeInput.val().trim();

        if (!examCode || !studentCode) {
            messageDiv.text('Por favor, ingresa el código del examen y del estudiante.').addClass('error');
            return;
        }

        // Construct the URL for the new action
        const apiUrl = common.publicExamApiUrl() + `?action=validateExamStudent&exam_code=${encodeURIComponent(examCode)}&student_code=${encodeURIComponent(studentCode)}`;
        
        $.ajax({
            url: apiUrl,
            method: 'GET',
            dataType: 'json',
            success: function (response) {
                console.log('Response:', response);

                if (response.success) {
                    examData = response.exam; // Store the exam data
                    messageDiv.text('Validación exitosa. Puedes iniciar el examen.').addClass('success');
                    examEntryForm.hide(); // Hide the form
                    startExamSection.show(); // Show the start exam button
                } else {
                    // Display error message based on error_code or general message
                    let errorMessage = response.message || 'Ocurrió un error desconocido durante la validación.';
                    if (response.error_code) {
                        switch (response.error_code) {
                            case 100:
                                errorMessage = 'Error 100: Examen no encontrado o no vigente.';
                                break;
                            case 110:
                                errorMessage = 'Error 110: El examen no está vigente.'; // Although backend handles this in 100, keeping for clarity
                                break;
                            case 300:
                                errorMessage = 'Error 300: Estudiante no encontrado.';
                                break;
                            case 400:
                                errorMessage = 'Error 400: El estudiante no pertenece a un grupo asociado con este examen.';
                                break;
                            default:
                                errorMessage = `Error ${response.error_code}: ${response.message || 'Error desconocido.'}`;
                                break;
                        }
                    }
                    messageDiv.text(errorMessage).addClass('error');
                }
            },
            error: function (xhr, status, error) {
                messageDiv.text('Error al conectar con el servidor. Inténtalo de nuevo más tarde.').addClass('error');
                console.error('AJAX Error:', status, error, xhr.responseText);
            }
        });
    });

    startExamBtn.on('click', function () {
        if (examData) {
            // Redirect to the exam page, passing necessary data
            // For example, you might redirect to exam.html with exam ID and student ID
            const examUrl = `exam.html?exam_id=${examData.id}&student_code=${studentCodeInput.val()}`;
            const windowFeatures = `width=${screen.width},height=${screen.height},top=0,left=0,fullscreen=yes,menubar=no,location=no,toolbar=no,status=no,resizable=no,scrollbars=no`;
            window.open(examUrl, '_blank', windowFeatures);        } else {
            messageDiv.text('No se pudo iniciar el examen. Por favor, valida los datos nuevamente.').addClass('error');
        }
    });
});