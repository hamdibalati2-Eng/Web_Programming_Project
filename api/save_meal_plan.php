<?php
/**
 * Save Meal Plan API
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
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['week_start']) || !isset($data['meals'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Week start and meals are required']);
        exit;
    }
    
    $weekStart = $data['week_start'];
    $meals = $data['meals'];
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Delete existing meals for this week
    $stmt = $pdo->prepare("DELETE FROM meal_plans WHERE user_id = :user_id AND week_start = :week_start");
    $stmt->bindValue(':user_id', $userId);
    $stmt->bindValue(':week_start', $weekStart);
    $stmt->execute();
    
    // Insert new meals
    $stmt = $pdo->prepare("INSERT INTO meal_plans (user_id, week_start, day_of_week, meal_time, recipe_id) VALUES (:user_id, :week_start, :day_of_week, :meal_time, :recipe_id)");
    
    foreach ($meals as $meal) {
        $stmt->bindValue(':user_id', $userId);
        $stmt->bindValue(':week_start', $weekStart);
        $stmt->bindValue(':day_of_week', $meal['day']);
        $stmt->bindValue(':meal_time', $meal['time']);
        $stmt->bindValue(':recipe_id', $meal['recipe_id']);
        $stmt->execute();
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Meal plan saved successfully'
    ]);
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}

?>

