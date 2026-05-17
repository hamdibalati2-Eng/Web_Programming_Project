<?php
/**
 * Get Shopping List API
 * Retrieves the shopping list for a specific week
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

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
    $weekStart = $_GET['week_start'] ?? '';
    
    if (empty($weekStart)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Week start is required']);
        exit;
    }
    
    // Get shopping list for this week
    $stmt = $pdo->prepare("
        SELECT id, ingredient_name, measure, category, is_checked, recipe_id
        FROM shopping_list
        WHERE user_id = :user_id AND week_start = :week_start
        ORDER BY category, ingredient_name
    ");
    $stmt->bindValue(':user_id', $userId);
    $stmt->bindValue(':week_start', $weekStart);
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group by category
    $groupedItems = [];
    foreach ($items as $item) {
        $category = $item['category'];
        if (!isset($groupedItems[$category])) {
            $groupedItems[$category] = [];
        }
        $groupedItems[$category][] = [
            'id' => $item['id'],
            'name' => $item['ingredient_name'],
            'measure' => $item['measure'],
            'is_checked' => (bool)$item['is_checked'],
            'recipe_id' => $item['recipe_id']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'shopping_list' => $groupedItems,
        'total_items' => count($items)
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
