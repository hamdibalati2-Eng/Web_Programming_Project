<?php
/**
 * Recipe Data Import Script for XAMPP
 * This script imports recipe data from JSON files into MySQL database
 */

// Database configuration
$host = 'localhost';
$dbname = 'mealplanner_db';
$username = 'root';
$password = ''; // Default XAMPP password is empty

try {
    // Connect to database
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✓ Connected to database successfully!\n\n";
    
    // Recipe categories to import
    $categories = [
        'all_recipes.json',
        'beef_recipes.json',
        'breakfast_recipes.json',
        'chicken_recipes.json',
        'pasta_recipes.json',
        'seafood_recipes.json',
        'sweet_recipes.json',
        'vegetarian_recipes.json'
    ];
    
    $totalImported = 0;
    $totalSkipped = 0;
    $totalErrors = 0;
    
    // Prepare statements for better performance
    $stmtRecipe = $pdo->prepare("
        INSERT INTO recipes (id, name, category, area, instructions, image, image_url, youtube, source, tags)
        VALUES (:id, :name, :category, :area, :instructions, :image, :image_url, :youtube, :source, :tags)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            category = VALUES(category),
            area = VALUES(area),
            instructions = VALUES(instructions),
            image = VALUES(image),
            image_url = VALUES(image_url),
            youtube = VALUES(youtube),
            source = VALUES(source),
            tags = VALUES(tags)
    ");
    
    $stmtIngredient = $pdo->prepare("
        INSERT INTO ingredients (recipe_id, ingredient, measure)
        VALUES (:recipe_id, :ingredient, :measure)
    ");
    
    // Delete existing ingredients for recipes we're updating (to avoid duplicates)
    $stmtDeleteIngredients = $pdo->prepare("DELETE FROM ingredients WHERE recipe_id = :recipe_id");
    
    // Process each category file
    foreach ($categories as $categoryFile) {
        $filePath = __DIR__ . '/recipe_data/' . $categoryFile;
        
        if (!file_exists($filePath)) {
            echo "⚠ File not found: $categoryFile\n";
            continue;
        }
        
        echo "Processing: $categoryFile\n";
        
        $jsonData = file_get_contents($filePath);
        $recipes = json_decode($jsonData, true);
        
        if (!is_array($recipes) || empty($recipes)) {
            echo "  ⚠ No recipes found or invalid JSON format\n\n";
            continue;
        }
        
        $imported = 0;
        $skipped = 0;
        
        foreach ($recipes as $recipe) {
            try {
                // Validate required fields
                if (empty($recipe['id']) || empty($recipe['name'])) {
                    $skipped++;
                    continue;
                }
                
                // Check if recipe already exists
                $checkStmt = $pdo->prepare("SELECT id FROM recipes WHERE id = :id");
                $checkStmt->execute(['id' => $recipe['id']]);
                $exists = $checkStmt->fetch();
                
                // Delete existing ingredients if updating
                if ($exists) {
                    $stmtDeleteIngredients->execute(['recipe_id' => $recipe['id']]);
                }
                
                // Insert or update recipe
                $stmtRecipe->execute([
                    ':id' => $recipe['id'],
                    ':name' => $recipe['name'] ?? '',
                    ':category' => $recipe['category'] ?? null,
                    ':area' => $recipe['area'] ?? null,
                    ':instructions' => $recipe['instructions'] ?? null,
                    ':image' => $recipe['image'] ?? null,
                    ':image_url' => $recipe['image_url'] ?? null,
                    ':youtube' => $recipe['youtube'] ?? null,
                    ':source' => $recipe['source'] ?? null,
                    ':tags' => !empty($recipe['tags']) ? json_encode($recipe['tags']) : null
                ]);
                
                // Insert ingredients
                if (!empty($recipe['ingredients']) && is_array($recipe['ingredients'])) {
                    foreach ($recipe['ingredients'] as $ingredient) {
                        if (!empty($ingredient['ingredient'])) {
                            $stmtIngredient->execute([
                                ':recipe_id' => $recipe['id'],
                                ':ingredient' => $ingredient['ingredient'],
                                ':measure' => $ingredient['measure'] ?? null
                            ]);
                        }
                    }
                }
                
                $imported++;
                
            } catch (PDOException $e) {
                echo "  ✗ Error importing recipe {$recipe['id']}: " . $e->getMessage() . "\n";
                $totalErrors++;
            }
        }
        
        echo "  ✓ Imported: $imported recipes\n";
        echo "  ⚠ Skipped: $skipped recipes\n\n";
        
        $totalImported += $imported;
        $totalSkipped += $skipped;
    }
    
    echo "\n" . str_repeat("=", 50) . "\n";
    echo "IMPORT SUMMARY\n";
    echo str_repeat("=", 50) . "\n";
    echo "Total Imported: $totalImported recipes\n";
    echo "Total Skipped: $totalSkipped recipes\n";
    echo "Total Errors: $totalErrors\n";
    echo "\n✓ Import completed successfully!\n";
    
} catch (PDOException $e) {
    echo "✗ Database Error: " . $e->getMessage() . "\n";
    echo "\nPlease make sure:\n";
    echo "1. XAMPP MySQL is running\n";
    echo "2. Database 'mealplanner_db' exists (run database_schema.sql first)\n";
    echo "3. Database credentials are correct\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

?>

