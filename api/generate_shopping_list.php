<?php
/**
 * Generate Shopping List API
 * Extracts ingredients from user's meal plan and saves to shopping_list table
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

// Category keywords for ingredient classification
$categoryKeywords = [
    'Produce' => ['vegetable', 'fruit', 'lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'potato', 'apple', 'banana', 'orange', 'lemon', 'lime', 'herb', 'spinach', 'broccoli', 'cucumber', 'celery', 'mushroom', 'avocado', 'zucchini', 'squash', 'cabbage', 'kale'],
    'Meat' => ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'bacon', 'sausage', 'meat', 'fish', 'salmon', 'tuna', 'shrimp', 'seafood', 'steak', 'ground'],
    'Dairy' => ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream', 'egg', 'eggs', 'parmesan', 'mozzarella', 'cheddar'],
    'Pantry' => ['flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'spice', 'rice', 'pasta', 'noodle', 'bean', 'lentil', 'canned', 'sauce', 'stock', 'broth', 'honey', 'syrup', 'soy'],
    'Bakery' => ['bread', 'roll', 'bun', 'bagel', 'croissant', 'tortilla', 'pita'],
    'Frozen' => ['frozen', 'ice'],
    'Beverages' => ['juice', 'water', 'soda', 'wine', 'beer', 'drink', 'tea', 'coffee']
];

function categorizeIngredient($ingredientName, $categoryKeywords) {
    $name = strtolower($ingredientName);
    
    foreach ($categoryKeywords as $category => $keywords) {
        foreach ($keywords as $keyword) {
            if (strpos($name, $keyword) !== false) {
                return $category;
            }
        }
    }
    
    return 'Other';
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $userId = $_SESSION['user_id'];
    $data = json_decode(file_get_contents('php://input'), true);
    
    $weekStart = $data['week_start'] ?? date('Y-m-d', strtotime('monday this week'));
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Get all meals for this week from meal_plans
    $stmt = $pdo->prepare("
        SELECT mp.recipe_id, r.name as recipe_name
        FROM meal_plans mp
        JOIN recipes r ON mp.recipe_id = r.id
        WHERE mp.user_id = :user_id AND mp.week_start = :week_start
    ");
    $stmt->bindValue(':user_id', $userId);
    $stmt->bindValue(':week_start', $weekStart);
    $stmt->execute();
    $meals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($meals)) {
        $pdo->rollBack();
        echo json_encode([
            'success' => false,
            'message' => 'No meals found for this week'
        ]);
        exit;
    }
    
    // Get unique recipe IDs
    $recipeIds = array_unique(array_column($meals, 'recipe_id'));
    
    // Get all ingredients for these recipes
    $placeholders = implode(',', array_fill(0, count($recipeIds), '?'));
    $stmt = $pdo->prepare("
        SELECT recipe_id, ingredient, measure
        FROM ingredients
        WHERE recipe_id IN ($placeholders)
    ");
    $stmt->execute($recipeIds);
    $ingredients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Delete existing shopping list for this week
    $stmt = $pdo->prepare("DELETE FROM shopping_list WHERE user_id = :user_id AND week_start = :week_start");
    $stmt->bindValue(':user_id', $userId);
    $stmt->bindValue(':week_start', $weekStart);
    $stmt->execute();
    
    // Aggregate ingredients (combine duplicates)
    $aggregatedIngredients = [];
    foreach ($ingredients as $ing) {
        $key = strtolower(trim($ing['ingredient']));
        if (!isset($aggregatedIngredients[$key])) {
            $aggregatedIngredients[$key] = [
                'name' => $ing['ingredient'],
                'measures' => [],
                'recipe_id' => $ing['recipe_id']
            ];
        }
        if (!empty($ing['measure'])) {
            $aggregatedIngredients[$key]['measures'][] = $ing['measure'];
        }
    }
    
    // Insert aggregated ingredients into shopping_list
    $stmt = $pdo->prepare("
        INSERT INTO shopping_list (user_id, week_start, ingredient_name, measure, category, recipe_id)
        VALUES (:user_id, :week_start, :ingredient_name, :measure, :category, :recipe_id)
    ");
    
    $insertedCount = 0;
    foreach ($aggregatedIngredients as $ing) {
        // Combine measures
        $measure = implode(', ', array_unique($ing['measures']));
        $category = categorizeIngredient($ing['name'], $categoryKeywords);
        
        $stmt->bindValue(':user_id', $userId);
        $stmt->bindValue(':week_start', $weekStart);
        $stmt->bindValue(':ingredient_name', $ing['name']);
        $stmt->bindValue(':measure', $measure);
        $stmt->bindValue(':category', $category);
        $stmt->bindValue(':recipe_id', $ing['recipe_id']);
        $stmt->execute();
        $insertedCount++;
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Shopping list generated successfully',
        'ingredient_count' => $insertedCount,
        'meal_count' => count($meals)
    ]);
    
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
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
