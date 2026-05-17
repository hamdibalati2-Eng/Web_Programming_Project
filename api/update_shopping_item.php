<?php
/**
 * Update Shopping List Item API
 * Updates the checked status of a shopping list item
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
    
    $itemId = $data['item_id'] ?? null;
    $isChecked = isset($data['is_checked']) ? (int)$data['is_checked'] : null;
    
    if ($itemId === null || $isChecked === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Item ID and checked status are required']);
        exit;
    }
    
    // Update the item (only if it belongs to this user)
    $stmt = $pdo->prepare("
        UPDATE shopping_list 
        SET is_checked = :is_checked 
        WHERE id = :item_id AND user_id = :user_id
    ");
    $stmt->bindValue(':is_checked', $isChecked);
    $stmt->bindValue(':item_id', $itemId);
    $stmt->bindValue(':user_id', $userId);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Item updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Item not found or not authorized'
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
