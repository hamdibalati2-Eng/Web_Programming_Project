<?php
/**
 * Get all unique ingredients from database for autocomplete
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$dbname = 'mealplanner_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $search = $_GET['search'] ?? null;
    
    $sql = "SELECT DISTINCT ingredient, COUNT(*) as count 
            FROM ingredients 
            WHERE ingredient IS NOT NULL AND ingredient != ''";
    
    $params = [];
    if ($search) {
        $sql .= " AND ingredient LIKE :search";
        $params[':search'] = "%$search%";
    }
    
    $sql .= " GROUP BY ingredient ORDER BY count DESC, ingredient ASC LIMIT 100";
    
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    $ingredients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($ingredients, JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

?>

