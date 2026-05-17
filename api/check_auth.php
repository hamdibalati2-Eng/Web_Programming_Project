<?php
/**
 * Check Authentication Status
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'authenticated' => true,
        'user_id' => $_SESSION['user_id'],
        'email' => $_SESSION['user_email'] ?? '',
        'first_name' => $_SESSION['user_name'] ?? '',
        'last_name' => $_SESSION['user_surname'] ?? ''
    ]);
} else {
    echo json_encode(['authenticated' => false]);
}

?>

