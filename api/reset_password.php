<?php
/**
 * Reset Password API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$host = 'localhost';
$dbname = 'mealplanner_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }
    
    $token = $_POST['token'] ?? '';
    $new_password = $_POST['password'] ?? '';
    
    if (empty($token) || empty($new_password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Token and password are required']);
        exit;
    }
    
    // Check token validity
    $stmt = $pdo->prepare("SELECT user_id FROM password_resets WHERE token = :token AND expires_at > NOW()");
    $stmt->execute(['token' => $token]);
    $reset = $stmt->fetch();
    
    if (!$reset) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }
    
    $user_id = $reset['user_id'];
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Update password
    $stmt = $pdo->prepare("UPDATE users SET password = :password WHERE id = :id");
    $stmt->execute([
        'password' => $hashed_password,
        'id' => $user_id
    ]);
    
    // Delete the used token
    $stmt = $pdo->prepare("DELETE FROM password_resets WHERE user_id = :user_id");
    $stmt->execute(['user_id' => $user_id]);
    
    echo json_encode(['success' => true, 'message' => 'Password has been reset successfully']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error', 'error' => $e->getMessage()]);
}
?>
