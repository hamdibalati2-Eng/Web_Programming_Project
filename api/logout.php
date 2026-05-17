<?php
/**
 * User Logout API
 */

session_start();

// Destroy session
session_destroy();

// Clear session cookie
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Logged out successfully']);

?>

