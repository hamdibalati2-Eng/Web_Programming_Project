<?php
/**
 * Get all recipe areas/cuisines from database
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
    
    $stmt = $pdo->query("SELECT DISTINCT area, COUNT(*) as count FROM recipes WHERE area IS NOT NULL AND area != '' GROUP BY area ORDER BY area");
    $areas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($areas, JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

?>

