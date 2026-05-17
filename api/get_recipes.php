<?php
/**
 * Recipe API Endpoint
 * Fetches recipes from MySQL database
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Database configuration
$host = 'localhost';
$dbname = 'mealplanner_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get parameters
    $category = $_GET['category'] ?? null;
    $area = $_GET['area'] ?? null;
    $search = $_GET['search'] ?? null;
    $ingredient = $_GET['ingredient'] ?? null;
    $ingredientExclude = $_GET['ingredient_exclude'] ?? null;
    $sort = $_GET['sort'] ?? 'name_asc';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Build SQL query
    $sql = "SELECT r.*, 
            GROUP_CONCAT(
                JSON_OBJECT('ingredient', i.ingredient, 'measure', i.measure) 
                SEPARATOR '|||'
            ) as ingredients_json
            FROM recipes r
            LEFT JOIN ingredients i ON r.id = i.recipe_id
            WHERE 1=1";
    
    $params = [];
    
    // Add category filter (supports multiple categories)
    if ($category && $category !== 'all') {
        $categories = is_array($category) ? $category : explode(',', $category);
        if (count($categories) > 0) {
            $placeholders = [];
            foreach ($categories as $idx => $cat) {
                $key = ':category' . $idx;
                $placeholders[] = $key;
                $params[$key] = trim($cat);
            }
            $sql .= " AND r.category IN (" . implode(',', $placeholders) . ")";
        }
    }
    
    // Add area filter (supports multiple areas)
    if ($area && $area !== 'all') {
        $areas = is_array($area) ? $area : explode(',', $area);
        if (count($areas) > 0) {
            $placeholders = [];
            foreach ($areas as $idx => $a) {
                $key = ':area' . $idx;
                $placeholders[] = $key;
                $params[$key] = trim($a);
            }
            $sql .= " AND r.area IN (" . implode(',', $placeholders) . ")";
        }
    }
    
    // Add search filter
    if ($search) {
        $sql .= " AND (r.name LIKE :search OR r.area LIKE :search OR r.instructions LIKE :search)";
        $params[':search'] = "%$search%";
    }
    
    // Add ingredient filter (include) - using subquery
    if ($ingredient) {
        $ingredients = is_array($ingredient) ? $ingredient : explode(',', $ingredient);
        if (count($ingredients) > 0) {
            $ingredientConditions = [];
            foreach ($ingredients as $idx => $ing) {
                $key = ':ingredient' . $idx;
                $params[$key] = '%' . trim($ing) . '%';
                $ingredientConditions[] = "EXISTS (
                    SELECT 1 FROM ingredients i2 
                    WHERE i2.recipe_id = r.id 
                    AND i2.ingredient LIKE " . $key . "
                )";
            }
            $sql .= " AND (" . implode(" OR ", $ingredientConditions) . ")";
        }
    }
    
    // Add ingredient exclude filter - using subquery
    if ($ingredientExclude) {
        $excludeIngredients = is_array($ingredientExclude) ? $ingredientExclude : explode(',', $ingredientExclude);
        if (count($excludeIngredients) > 0) {
            $excludeConditions = [];
            foreach ($excludeIngredients as $idx => $ing) {
                $key = ':exclude_ingredient' . $idx;
                $params[$key] = '%' . trim($ing) . '%';
                $excludeConditions[] = "NOT EXISTS (
                    SELECT 1 FROM ingredients i3 
                    WHERE i3.recipe_id = r.id 
                    AND i3.ingredient LIKE " . $key . "
                )";
            }
            $sql .= " AND (" . implode(" AND ", $excludeConditions) . ")";
        }
    }
    
    $sql .= " GROUP BY r.id";
    
    // Add sorting
    switch ($sort) {
        case 'name_asc':
            $sql .= " ORDER BY r.name ASC";
            break;
        case 'name_desc':
            $sql .= " ORDER BY r.name DESC";
            break;
        case 'newest':
            $sql .= " ORDER BY r.created_at DESC";
            break;
        case 'oldest':
            $sql .= " ORDER BY r.created_at ASC";
            break;
        default:
            $sql .= " ORDER BY r.name ASC";
    }
    
    // Add limit
    if ($limit) {
        $sql .= " LIMIT :limit OFFSET :offset";
        $params[':limit'] = $limit;
        $params[':offset'] = $offset;
    }
    
    $stmt = $pdo->prepare($sql);
    
    // Bind parameters
    foreach ($params as $key => $value) {
        if ($key === ':limit' || $key === ':offset') {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        } else {
            $stmt->bindValue($key, $value);
        }
    }
    
    $stmt->execute();
    $recipes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parse ingredients JSON
    foreach ($recipes as &$recipe) {
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
    }
    
    echo json_encode($recipes, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
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

