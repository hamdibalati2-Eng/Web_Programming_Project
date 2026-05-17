<?php
/**
 * Check if user is admin
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['is_admin' => false, 'message' => 'Not authenticated']);
    exit;
}

$host = 'localhost';
$dbname = 'mealplanner_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $userId = $_SESSION['user_id'];
    
    $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = :id");
    $stmt->bindValue(':id', $userId);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $isAdmin = $user && $user['is_admin'] == 1;
    
    echo json_encode(['is_admin' => $isAdmin]);
    
} catch (PDOException $e) {
    echo json_encode(['is_admin' => false, 'error' => $e->getMessage()]);
}

?>

