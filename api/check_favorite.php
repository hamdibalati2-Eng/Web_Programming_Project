<?php
/**
 * Check if Recipe is Favorite API
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['is_favorite' => false]);
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
    $recipeId = $_GET['recipe_id'] ?? '';
    
    if (empty($recipeId)) {
        echo json_encode(['is_favorite' => false]);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT id FROM favorites WHERE user_id = :user_id AND recipe_id = :recipe_id");
    $stmt->bindValue(':user_id', $userId);
    $stmt->bindValue(':recipe_id', $recipeId);
    $stmt->execute();
    $favorite = $stmt->fetch();
    
    echo json_encode([
        'is_favorite' => $favorite ? true : false
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['is_favorite' => false]);
} catch (Exception $e) {
    echo json_encode(['is_favorite' => false]);
}

?>

