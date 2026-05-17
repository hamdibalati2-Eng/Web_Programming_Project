<?php
/**
 * Forgot Password API
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
    
    $email = $_POST['email'] ?? '';
    
    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email is required']);
        exit;
    }
    
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // For security, don't reveal if user exists. 
        // But for development/UX we can be specific or use a generic message.
        echo json_encode(['success' => true, 'message' => 'If this email is registered, you will receive a reset link.']);
        exit;
    }
    
    $user_id = $user['id'];
    $token = bin2hex(random_bytes(32));
    
    // Clear old tokens for this user
    $stmt = $pdo->prepare("DELETE FROM password_resets WHERE user_id = :user_id");
    $stmt->execute(['user_id' => $user_id]);
    
    // Insert new token - use MySQL DATE_ADD to calculate expires_at as 1 day from now
    $stmt = $pdo->prepare("INSERT INTO password_resets (user_id, token, expires_at, created_at) VALUES (:user_id, :token, DATE_ADD(NOW(), INTERVAL 1 DAY), NOW())");
    $stmt->execute([
        'user_id' => $user_id,
        'token' => $token
    ]);
    
    // MAILTRAP API INTEGRATION
    $reset_link = "http://localhost/mealplanner/login.html?token=" . $token;
    
    // Mailtrap API
    $mailtrap_api_url = "https://send.api.mailtrap.io/api/send";
    $mailtrap_api_token = "34b827d93eba3e7ce87a8da716d06b66";
    
    $email_data = [
        "from" => [
            "email" => "hello@demomailtrap.co",
            "name" => "MealPlanner"
        ],
        "to" => [
            ["email" => $email]
        ],
        "subject" => "Password Reset - MealPlanner",
        "html" => "
            <div style=\"font-family: 'Inter', sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;\">
                <div style=\"text-align: center; margin-bottom: 20px;\">
                    <h1 style=\"color: #14b8a6;\">MealPlanner</h1>
                </div>
                <p>Hello,</p>
                <p>We received a request to reset your password for your MealPlanner account. Click the button below to choose a new password:</p>
                <div style=\"text-align: center; margin: 30px 0;\">
                    <a href=\"$reset_link\" style=\"display: inline-block; padding: 12px 24px; background-color: #14b8a6; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600;\">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href=\"$reset_link\" style=\"color: #14b8a6;\">$reset_link</a></p>
                <p>If you didn't request this, you can safely ignore this email. The link will expire in 24 hours.</p>
                <div style=\"margin-top: 30px; font-size: 0.875rem; color: #64748b; text-align: center;\">
                    &copy; 2025 MealPlanner. All rights reserved.
                </div>
            </div>
        ",
        "category" => "Password Reset"
    ];

    $ch = curl_init($mailtrap_api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer " . $mailtrap_api_token,
        "Content-Type: application/json"
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Regardless of success, we tell the user the same thing for security/privacy
    echo json_encode([
        'success' => true, 
        'message' => 'If this email is registered, you will receive a password reset link shortly.'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error', 'error' => $e->getMessage()]);
}
?>
