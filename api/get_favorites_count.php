<?php
/**
 * Get Favorites Count API
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['count' => 0]);
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
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM favorites WHERE user_id = :user_id");
    $stmt->bindValue(':user_id', $userId);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'count' => intval($result['count'] ?? 0)
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['count' => 0]);
} catch (Exception $e) {
    echo json_encode(['count' => 0]);
}

?>

