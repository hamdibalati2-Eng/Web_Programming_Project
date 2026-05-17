# 🍽️ MealPlanner

A full-stack web application for planning weekly meals, discovering recipes, and generating shopping lists. Built with PHP, MySQL, and vanilla JavaScript.

![MealPlanner](https://img.shields.io/badge/Status-Active-success)
![PHP](https://img.shields.io/badge/PHP-7.4+-blue)
![MySQL](https://img.shields.io/badge/MySQL-5.7+-orange)

## ✨ Features

### 🍳 Recipe Management
- Browse hundreds of recipes from various categories (Chicken, Beef, Seafood, Vegetarian, etc.)
- Search recipes by name, category, area, or ingredients
- View detailed recipe information including ingredients, instructions, and cooking videos
- Filter recipes by dietary preferences and cuisine type

### 📅 Meal Planning
- Interactive weekly meal planner with drag-and-drop functionality
- Plan breakfast, lunch, dinner, and snacks for each day
- Navigate between weeks to plan ahead
- Auto-save functionality for logged-in users

### 🛒 Shopping List
- Automatically generate shopping lists from your meal plan
- Ingredients grouped by category (Produce, Meat, Dairy, Pantry, etc.)
- Check off items as you shop
- Print-friendly shopping list

### ❤️ Favorites
- Save your favorite recipes for quick access
- Manage your favorites collection

### ⭐ Reviews & Ratings
- Rate and review recipes
- View community ratings and reviews

### 👤 User Authentication
- Secure user registration and login
- Password reset via email (Resend API integration)
- User profile management
- Change password functionality

### 🔐 Admin Panel
- Manage users (view, delete)
- Manage recipes
- Admin-only access control

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** PHP 7.4+
- **Database:** MySQL 5.7+
- **Server:** Apache (XAMPP recommended)
- **Email Service:** Resend API

## 📁 Project Structure

```
mealplanner/
├── api/                    # PHP API endpoints
│   ├── admin/              # Admin-specific APIs
│   ├── check_auth.php      # Authentication check
│   ├── login.php           # User login
│   ├── register.php        # User registration
│   ├── forgot_password.php # Password reset
│   ├── get_recipes.php     # Fetch recipes
│   ├── get_meal_plan.php   # Fetch meal plan
│   ├── save_meal_plan.php  # Save meal plan
│   └── ...                 # Other API endpoints
├── recipe_data/            # JSON recipe data files
├── recipe_images/          # Recipe images storage
├── index.html              # Homepage
├── recipes.html            # Recipe browsing page
├── recipe-detail.html      # Individual recipe page
├── meal-planner.html       # Meal planning page
├── shopping-list.html      # Shopping list page
├── favorites.html          # Favorites page
├── login.html              # Login/Register page
├── profile.html            # User profile page
├── admin.html              # Admin dashboard
├── database_schema.sql     # Database schema
└── README.md               # This file
```

## 🚀 Installation

### Prerequisites
- XAMPP (or similar PHP/MySQL environment)
- PHP 7.4 or higher
- MySQL 5.7 or higher

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aabd2017/mealplanner.git
   ```

2. **Move to web server directory**
   ```bash
   # For XAMPP on Windows
   mv mealplanner C:/xampp/htdocs/
   
   # For XAMPP on Mac
   mv mealplanner /Applications/XAMPP/htdocs/
   ```

3. **Create the database**
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database named `mealplanner_db`
   - Import the `database_schema.sql` file

4. **Import recipe data**
   - Navigate to http://localhost/mealplanner/import_recipes.php
   - This will populate the database with recipes

5. **Configure email (optional)**
   - Sign up for [Resend](https://resend.com)
   - Update the API token in `api/forgot_password.php`

6. **Access the application**
   - Open http://localhost/mealplanner in your browser

## 📊 Database Schema

The application uses the following main tables:

- **users** - User accounts and authentication
- **recipes** - Recipe information
- **ingredients** - Recipe ingredients
- **meal_plans** - User meal planning data
- **shopping_list** - Generated shopping lists
- **favorites** - User favorite recipes
- **reviews** - Recipe reviews and ratings
- **password_resets** - Password reset tokens

## 🔑 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login.php` | POST | User login |
| `/api/register.php` | POST | User registration |
| `/api/check_auth.php` | GET | Check authentication status |
| `/api/get_recipes.php` | GET | Fetch recipes with filters |
| `/api/get_recipe.php` | GET | Fetch single recipe |
| `/api/get_meal_plan.php` | GET | Get user's meal plan |
| `/api/save_meal_plan.php` | POST | Save meal plan |
| `/api/get_shopping_list.php` | GET | Get shopping list |
| `/api/toggle_favorite.php` | POST | Add/remove favorite |
| `/api/save_review.php` | POST | Submit a review |

## 🎨 Screenshots

### Home Page
The landing page showcases featured recipes and quick access to main features.

### Meal Planner
Interactive weekly calendar for planning meals with drag-and-drop recipe cards.

### Shopping List
Auto-generated shopping list organized by category with checkboxes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👨‍💻 Authors

### Hamdi Balati
- GitHub: [@hamdibalati2-Eng](https://github.com/hamdibalati2-Eng)

### AbdAlrahman Abd Alfatah
- GitHub: [@AbdAlrahman-Sec](https://github.com/AbdAlrahman-Sec)

## 🙏 Acknowledgments

- Recipe data sourced from [TheMealDB](https://www.themealdb.com/)
- Icons by [Font Awesome](https://fontawesome.com/)
- Email service by [Resend](https://resend.com/)

---

⭐ Star this repository if you find it helpful!
