<?php
/**
 * Get User Favorites API
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

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
    
    $stmt = $pdo->prepare("
        SELECT r.*, f.created_at as favorited_at
        FROM favorites f
        JOIN recipes r ON f.recipe_id = r.id
        WHERE f.user_id = :user_id
        ORDER BY f.created_at DESC
    ");
    $stmt->bindValue(':user_id', $userId);
    $stmt->execute();
    $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get ingredients for each recipe
    foreach ($favorites as &$recipe) {
        $ingStmt = $pdo->prepare("SELECT ingredient, measure FROM ingredients WHERE recipe_id = :recipe_id");
        $ingStmt->bindValue(':recipe_id', $recipe['id']);
        $ingStmt->execute();
        $recipe['ingredients'] = $ingStmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode([
        'success' => true,
        'favorites' => $favorites
    ]);
    
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

