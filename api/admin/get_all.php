<?php
/**
 * Get all data for admin panel
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Check admin status
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
    
    $type = $_GET['type'] ?? '';
    
    switch ($type) {
        case 'users':
            $stmt = $pdo->query("SELECT id, email, first_name, last_name, is_admin, created_at FROM users ORDER BY created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
            
        case 'recipes':
            $stmt = $pdo->query("SELECT id, name, category, area, created_at FROM recipes ORDER BY created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
            
        case 'reviews':
            $stmt = $pdo->query("
                SELECT r.id, r.rating, r.comment, r.created_at,
                       u.email as user_email, u.first_name, u.last_name,
                       rec.name as recipe_name, rec.id as recipe_id
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN recipes rec ON r.recipe_id = rec.id
                ORDER BY r.created_at DESC
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
            
        case 'meal_plans':
            $stmt = $pdo->query("
                SELECT mp.id, mp.week_start, mp.day_of_week, mp.meal_time, mp.created_at,
                       u.email as user_email, u.first_name, u.last_name,
                       r.name as recipe_name, r.id as recipe_id
                FROM meal_plans mp
                JOIN users u ON mp.user_id = u.id
                JOIN recipes r ON mp.recipe_id = r.id
                ORDER BY mp.created_at DESC
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
            
        case 'ingredients':
            $stmt = $pdo->query("
                SELECT i.id, i.recipe_id, i.ingredient, i.measure,
                       r.name as recipe_name
                FROM ingredients i
                JOIN recipes r ON i.recipe_id = r.id
                ORDER BY i.id DESC
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
            
        case 'favorites':
            $stmt = $pdo->query("
                SELECT f.id, f.created_at,
                       u.email as user_email, u.first_name, u.last_name,
                       r.name as recipe_name, r.id as recipe_id
                FROM favorites f
                JOIN users u ON f.user_id = u.id
                JOIN recipes r ON f.recipe_id = r.id
                ORDER BY f.created_at DESC
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid type']);
            exit;
    }
    
    echo json_encode(['success' => true, 'data' => $data]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}

?>

