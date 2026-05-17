<?php
/**
 * Get Reviews for a Recipe
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$host = 'localhost';
$dbname = 'mealplanner_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $recipeId = $_GET['recipe_id'] ?? '';
    
    if (empty($recipeId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Recipe ID is required']);
        exit;
    }
    
    // Get all reviews for this recipe with user information
    $stmt = $pdo->prepare("
        SELECT r.id, r.user_id, r.rating, r.comment, r.created_at, r.updated_at,
               u.first_name, u.last_name, u.email
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.recipe_id = :recipe_id
        ORDER BY r.created_at DESC
    ");
    $stmt->bindValue(':recipe_id', $recipeId);
    $stmt->execute();
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate average rating
    $avgRating = 0;
    if (count($reviews) > 0) {
        $totalRating = array_sum(array_column($reviews, 'rating'));
        $avgRating = round($totalRating / count($reviews), 1);
    }
    
    echo json_encode([
        'reviews' => $reviews,
        'average_rating' => $avgRating,
        'total_reviews' => count($reviews)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}

?>

