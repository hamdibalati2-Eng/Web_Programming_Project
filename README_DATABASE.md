# Database Setup Instructions for MealPlanner

## Step 1: Start XAMPP Services

1. Open XAMPP Control Panel
2. Start **Apache** (if not already running)
3. Start **MySQL** (if not already running)

## Step 2: Create the Database

### Option A: Using phpMyAdmin (Recommended)

1. Open your browser and go to: `http://localhost/phpmyadmin`
2. Click on the **SQL** tab
3. Copy and paste the contents of `database_schema.sql`
4. Click **Go** to execute
5. The database `mealplanner_db` and tables will be created

### Option B: Using Command Line

1. Open Command Prompt (Windows) or Terminal
2. Navigate to XAMPP MySQL bin directory:
   ```bash
   cd C:\xampp\mysql\bin
   ```
3. Run MySQL:
   ```bash
   mysql.exe -u root
   ```
4. Execute the SQL file:
   ```sql
   source C:\xampp2\htdocs\mealplanner\database_schema.sql
   ```
   (Adjust the path to match your project location)

## Step 3: Import Recipe Data

1. Make sure you're in the project directory: `C:\xampp2\htdocs\mealplanner\`
2. Open Command Prompt or Terminal in this directory
3. Run the PHP import script:
   ```bash
   php import_recipes.php
   ```

   Or if PHP is not in your PATH:
   ```bash
   C:\xampp\php\php.exe import_recipes.php
   ```

4. The script will:
   - Connect to the database
   - Read all JSON files from `recipe_data/` folder
   - Import recipes and ingredients into the database
   - Show progress and summary

## Step 4: Verify the Import

1. Go to `http://localhost/phpmyadmin`
2. Select `mealplanner_db` database
3. Check the `recipes` table - you should see all imported recipes
4. Check the `ingredients` table - you should see all ingredients

## Database Structure

### `recipes` Table
- `id` - Recipe ID (Primary Key)
- `name` - Recipe name
- `category` - Recipe category (Beef, Chicken, etc.)
- `area` - Cuisine area
- `instructions` - Cooking instructions
- `image` - Local image path
- `image_url` - External image URL
- `youtube` - YouTube video URL
- `source` - Recipe source URL
- `tags` - JSON array of tags
- `created_at` - Timestamp
- `updated_at` - Timestamp

### `ingredients` Table
- `id` - Auto-increment ID
- `recipe_id` - Foreign key to recipes table
- `ingredient` - Ingredient name
- `measure` - Measurement/quantity

## Troubleshooting

### Error: "Access denied for user 'root'"
- Default XAMPP MySQL password is empty
- If you changed it, update `$password` in `import_recipes.php`

### Error: "Database 'mealplanner_db' doesn't exist"
- Run `database_schema.sql` first to create the database

### Error: "Table doesn't exist"
- Make sure you ran the complete `database_schema.sql` file

### Images Not Showing
- Images are stored in `recipe_images/` folder
- The database only stores the image path
- Make sure the `recipe_images` folder is accessible via web server

## Next Steps

After importing, you can:
1. Create PHP API endpoints to fetch recipes from database
2. Update `script.js` to fetch from PHP API instead of JSON files
3. Add search and filter functionality using SQL queries
4. Implement user favorites and meal planning features

## Example PHP API Endpoint

Create `api/get_recipes.php`:

```php
<?php
header('Content-Type: application/json');

$pdo = new PDO("mysql:host=localhost;dbname=mealplanner_db;charset=utf8mb4", "root", "");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$category = $_GET['category'] ?? null;
$search = $_GET['search'] ?? null;

$sql = "SELECT r.*, 
        GROUP_CONCAT(JSON_OBJECT('ingredient', i.ingredient, 'measure', i.measure)) as ingredients_json
        FROM recipes r
        LEFT JOIN ingredients i ON r.id = i.recipe_id";

$params = [];

if ($category) {
    $sql .= " WHERE r.category = :category";
    $params[':category'] = $category;
}

if ($search) {
    $sql .= ($category ? " AND" : " WHERE") . " r.name LIKE :search";
    $params[':search'] = "%$search%";
}

$sql .= " GROUP BY r.id";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$recipes = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Parse ingredients JSON
foreach ($recipes as &$recipe) {
    $recipe['ingredients'] = json_decode($recipe['ingredients_json'], true) ?? [];
    unset($recipe['ingredients_json']);
}

echo json_encode($recipes);
?>
```

