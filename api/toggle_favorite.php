<?php
/**
 * Toggle Favorite Recipe API
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
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
    $recipeId = $_POST['recipe_id'] ?? '';
    
    if (empty($recipeId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Recipe ID is required']);
        exit;
    }
    
    // Check if favorite already exists
    $stmt = $pdo->prepare("SELECT id FROM favorites WHERE user_id = :user_id AND recipe_id = :recipe_id");
    $stmt->bindValue(':user_id', $userId);
    $stmt->bindValue(':recipe_id', $recipeId);
    $stmt->execute();
    $existing = $stmt->fetch();
    
    if ($existing) {
        // Remove favorite
        $stmt = $pdo->prepare("DELETE FROM favorites WHERE user_id = :user_id AND recipe_id = :recipe_id");
        $stmt->bindValue(':user_id', $userId);
        $stmt->bindValue(':recipe_id', $recipeId);
        $stmt->execute();
        
        echo json_encode([
            'success' => true,
            'is_favorite' => false,
            'message' => 'Recipe removed from favorites'
        ]);
    } else {
        // Add favorite
        $stmt = $pdo->prepare("INSERT INTO favorites (user_id, recipe_id) VALUES (:user_id, :recipe_id)");
        $stmt->bindValue(':user_id', $userId);
        $stmt->bindValue(':recipe_id', $recipeId);
        $stmt->execute();
        
        echo json_encode([
            'success' => true,
            'is_favorite' => true,
            'message' => 'Recipe added to favorites'
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}

?>

