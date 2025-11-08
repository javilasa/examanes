<?php

$errors_file = 'descarga_errores.txt';

function download_file($url, $path, &$errors) {
    echo "Procesando archivo: " . $path . "\n";

    $arrContextOptions = [
        "ssl" => [
            "verify_peer" => false,
            "verify_peer_name" => false,
        ],
    ];
    $context = stream_context_create($arrContextOptions);

    if (@copy($url, $path, $context)) {
        echo "  Archivo descargado: " . basename($path) . "\n";
        return true;
    } else {
        $error_message = "  No se pudo descargar: " . basename($path) . "\n";
        echo $error_message;
        $errors[] = ['url' => $url, 'path' => $path];
        // Create empty file as placeholder
        touch($path);
        return false;
    }
}

function full_download($errors_file) {
    $json_file = 'laboratoriosCorte2.json';
    $base_dir = 'laboratorios/source/descargas' . date('Ymd');
    $errors = [];

    if (!file_exists($base_dir)) {
        mkdir($base_dir, 0777, true);
    }

    $data = json_decode(file_get_contents($json_file), true);

    foreach ($data as $laboratorio) {
        $lab_dir = $base_dir . '/' . $laboratorio['nombre'];
        if (!file_exists($lab_dir)) {
            mkdir($lab_dir, 0777, true);
        }

        foreach ($laboratorio['grupos'] as $grupo) {
            $group_dir = $lab_dir . '/' . $grupo['nombre'];
            if (!file_exists($group_dir)) {
                mkdir($group_dir, 0777, true);
            }

            foreach ($grupo['estudiantes'] as $estudiante) {
                $student_dir = $group_dir . '/' . $estudiante['nombre'];
                if (!file_exists($student_dir)) {
                    mkdir($student_dir, 0777, true);
                }

                foreach ($estudiante['archivos'] as $archivo) {
                    $file_path = $student_dir . '/' . $archivo['nombre'];
                    download_file($archivo['url'], $file_path, $errors);
                }
            }
        }
    }

    file_put_contents($errors_file, json_encode($errors, JSON_PRETTY_PRINT));
    echo "Proceso de descarga completa finalizado.\n";
}

function retry_failed_downloads($errors_file) {
    if (!file_exists($errors_file) || filesize($errors_file) == 0) {
        echo "No hay errores de descarga para reintentar.\n";
        return;
    }

    $errors = json_decode(file_get_contents($errors_file), true);
    $remaining_errors = [];

    foreach ($errors as $error) {
        if (!download_file($error['url'], $error['path'], $remaining_errors)) {
            // If download fails again, it's already added to $remaining_errors inside download_file
        }
    }

    file_put_contents($errors_file, json_encode($remaining_errors, JSON_PRETTY_PRINT));
    echo "Proceso de reintento finalizado.\n";
}

echo "Seleccione una opción:\n";
echo "1. Descarga completa de laboratorios\n";
echo "2. Reintentar descargas fallidas\n";
$choice = readline("Opción: ");

switch ($choice) {
    case '1':
        full_download($errors_file);
        break;
    case '2':
        retry_failed_downloads($errors_file);
        break;
    default:
        echo "Opción no válida.\n";
        break;
}

?>
