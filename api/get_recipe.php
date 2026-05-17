<?php
/**
 * Get a single recipe by ID
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
    
    $recipeId = $_GET['id'] ?? null;
    
    if (!$recipeId) {
        http_response_code(400);
        echo json_encode(['error' => 'Recipe ID is required']);
        exit;
    }
    
    // Get recipe with ingredients
    $sql = "SELECT r.*, 
            GROUP_CONCAT(
                JSON_OBJECT('ingredient', i.ingredient, 'measure', i.measure) 
                SEPARATOR '|||'
            ) as ingredients_json
            FROM recipes r
            LEFT JOIN ingredients i ON r.id = i.recipe_id
            WHERE r.id = :id
            GROUP BY r.id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':id', $recipeId);
    $stmt->execute();
    $recipe = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$recipe) {
        http_response_code(404);
        echo json_encode(['error' => 'Recipe not found']);
        exit;
    }
    
    // Parse ingredients JSON
    if (!empty($recipe['ingredients_json'])) {
        $ingredientsArray = [];
        $ingredientStrings = explode('|||', $recipe['ingredients_json']);
        foreach ($ingredientStrings as $ingredientJson) {
            $ingredient = json_decode($ingredientJson, true);
            if ($ingredient) {
                $ingredientsArray[] = $ingredient;
            }
        }
        $recipe['ingredients'] = $ingredientsArray;
    } else {
        $recipe['ingredients'] = [];
    }
    
    // Parse tags if exists
    if (!empty($recipe['tags'])) {
        $recipe['tags'] = json_decode($recipe['tags'], true) ?? [];
    } else {
        $recipe['tags'] = [];
    }
    
    unset($recipe['ingredients_json']);
    
    echo json_encode($recipe, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
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

