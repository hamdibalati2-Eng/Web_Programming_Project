<?php
/**
 * Save Review API
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
    $rating = intval($_POST['rating'] ?? 0);
    $comment = $_POST['comment'] ?? '';
    
    if (empty($recipeId) || $rating < 1 || $rating > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Recipe ID and rating (1-5) are required']);
        exit;
    }
    
    // Check if review already exists for this user and recipe
    $stmt = $pdo->prepare("SELECT id FROM reviews WHERE user_id = :user_id AND recipe_id = :recipe_id");
    $stmt->bindValue(':user_id', $userId);
    $stmt->bindValue(':recipe_id', $recipeId);
    $stmt->execute();
    $existingReview = $stmt->fetch();
    
    if ($existingReview) {
        // Update existing review
        $stmt = $pdo->prepare("UPDATE reviews SET rating = :rating, comment = :comment, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
        $stmt->bindValue(':id', $existingReview['id']);
        $stmt->bindValue(':rating', $rating);
        $stmt->bindValue(':comment', $comment);
        $stmt->execute();
        
        echo json_encode([
            'success' => true,
            'message' => 'Review updated successfully',
            'review_id' => $existingReview['id']
        ]);
    } else {
        // Insert new review
        $stmt = $pdo->prepare("INSERT INTO reviews (user_id, recipe_id, rating, comment) VALUES (:user_id, :recipe_id, :rating, :comment)");
        $stmt->bindValue(':user_id', $userId);
        $stmt->bindValue(':recipe_id', $recipeId);
        $stmt->bindValue(':rating', $rating);
        $stmt->bindValue(':comment', $comment);
        $stmt->execute();
        
        $reviewId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Review saved successfully',
            'review_id' => $reviewId
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

