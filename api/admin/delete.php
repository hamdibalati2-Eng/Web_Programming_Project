<?php
/**
 * Delete item (admin only)
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
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
    
    // Check if user is admin
    $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = :id");
    $stmt->bindValue(':id', $userId);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || $user['is_admin'] != 1) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit;
    }
    
    $type = $_POST['type'] ?? $_GET['type'] ?? '';
    $id = $_POST['id'] ?? $_GET['id'] ?? '';
    
    if (empty($type) || empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Type and ID are required']);
        exit;
    }
    
    $tableMap = [
        'users' => 'users',
        'recipes' => 'recipes',
        'reviews' => 'reviews',
        'meal_plans' => 'meal_plans',
        'ingredients' => 'ingredients',
        'favorites' => 'favorites'
    ];
    
    if (!isset($tableMap[$type])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid type']);
        exit;
    }
    
    $table = $tableMap[$type];
    $idField = ($type === 'users' || $type === 'ingredients' || $type === 'reviews' || $type === 'meal_plans' || $type === 'favorites') ? 'id' : 'id';
    
    $stmt = $pdo->prepare("DELETE FROM {$table} WHERE {$idField} = :id");
    $stmt->bindValue(':id', $id);
    $stmt->execute();
    
    echo json_encode(['success' => true, 'message' => 'Item deleted successfully']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}

?>

