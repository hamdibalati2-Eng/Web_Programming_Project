<?php
/**
 * Delete Review API
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE');
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
    $reviewId = $_POST['review_id'] ?? $_GET['review_id'] ?? '';
    
    if (empty($reviewId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Review ID is required']);
        exit;
    }
    
    // Check if review exists and belongs to user
    $stmt = $pdo->prepare("SELECT user_id FROM reviews WHERE id = :review_id");
    $stmt->bindValue(':review_id', $reviewId);
    $stmt->execute();
    $review = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$review) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Review not found']);
        exit;
    }
    
    // Check if user owns the review
    if ($review['user_id'] != $userId) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'You can only delete your own reviews']);
        exit;
    }
    
    // Delete the review
    $stmt = $pdo->prepare("DELETE FROM reviews WHERE id = :review_id");
    $stmt->bindValue(':review_id', $reviewId);
    $stmt->execute();
    
    echo json_encode([
        'success' => true,
        'message' => 'Review deleted successfully'
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

