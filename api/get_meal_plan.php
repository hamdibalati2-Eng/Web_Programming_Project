<?php
/**
 * Get Meal Plan API
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
    $weekStart = $_GET['week_start'] ?? '';
    
    if (empty($weekStart)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Week start is required']);
        exit;
    }
    
    // Get meals for this week
    $stmt = $pdo->prepare("
        SELECT mp.day_of_week, mp.meal_time, mp.recipe_id, r.name as recipe_name, r.image, r.category
        FROM meal_plans mp
        JOIN recipes r ON mp.recipe_id = r.id
        WHERE mp.user_id = :user_id AND mp.week_start = :week_start
    ");
    $stmt->bindValue(':user_id', $userId);
    $stmt->bindValue(':week_start', $weekStart);
    $stmt->execute();
    $meals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Organize meals by day and time
    $organizedMeals = [];
    foreach ($meals as $meal) {
        $day = $meal['day_of_week'];
        $time = $meal['meal_time'];
        if (!isset($organizedMeals[$day])) {
            $organizedMeals[$day] = [];
        }
        $organizedMeals[$day][$time] = [
            'id' => $meal['recipe_id'],
            'name' => $meal['recipe_name'],
            'image' => $meal['image'],
            'category' => $meal['category']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'meals' => $organizedMeals
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

