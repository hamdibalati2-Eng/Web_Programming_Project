// Recipe Detail Page JavaScript

const API_RECIPE = 'api/get_recipe.php';
const API_REVIEWS = 'api/get_reviews.php';
const API_SAVE_REVIEW = 'api/save_review.php';

// Get recipe ID from URL
const urlParams = new URLSearchParams(window.location.search);
const recipeId = urlParams.get('id');

// UI Elements
const recipeLoading = document.getElementById('recipeLoading');
const recipeError = document.getElementById('recipeError');
const recipeContent = document.getElementById('recipeContent');
const recipeName = document.getElementById('recipeName');
const recipeImage = document.getElementById('recipeImage');
const recipeCategory = document.getElementById('recipeCategory');
const recipeArea = document.getElementById('recipeArea');
const ingredientsList = document.getElementById('ingredientsList');
const instructionsContent = document.getElementById('instructionsContent');
const youtubeSection = document.getElementById('youtubeSection');
const youtubeVideo = document.getElementById('youtubeVideo');
const favoriteBtn = document.getElementById('favoriteBtn');
const shareBtn = document.getElementById('shareBtn');
const reviewFormContainer = document.getElementById('reviewFormContainer');
const reviewsList = document.getElementById('reviewsList');
const starRating = document.getElementById('starRating');
const ratingValue = document.getElementById('ratingValue');
const reviewComment = document.getElementById('reviewComment');
const submitReviewBtn = document.getElementById('submitReviewBtn');

let currentRating = 0;
let isLoggedIn = false;

// Set active navigation link
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav a[data-page]');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        // Check if this is the current page
        if (currentPage === 'index.html' || currentPage === '') {
            if (link.dataset.page === 'home') {
                link.classList.add('active');
            }
        } else if (currentPage === 'recipes.html') {
            if (link.dataset.page === 'recipes') {
                link.classList.add('active');
            }
        } else if (currentPage === 'recipe-detail.html') {
            if (link.dataset.page === 'recipes') {
                link.classList.add('active');
            }
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthForReviews();
    setActiveNavLink();
    initMobileMenu();
    initHeaderScroll();
    initReviewForm();
    
    if (recipeId) {
        loadRecipe(recipeId);
        loadReviews(recipeId);
    } else {
        showError();
    }
});

// Check authentication for reviews (separate from navbar auth which is handled by auth.js)
async function checkAuthForReviews() {
    try {
        const response = await fetch('api/check_auth.php');
        const data = await response.json();
        
        if (data.authenticated) {
            isLoggedIn = true;
            if (reviewFormContainer) {
                reviewFormContainer.style.display = 'block';
            }
        } else {
            // Check localStorage as fallback
            if (localStorage.getItem('is_logged_in') === 'true') {
                isLoggedIn = true;
                if (reviewFormContainer) {
                    reviewFormContainer.style.display = 'block';
                }
            } else {
                isLoggedIn = false;
                if (reviewFormContainer) {
                    reviewFormContainer.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
        isLoggedIn = false;
        if (reviewFormContainer) {
            reviewFormContainer.style.display = 'none';
        }
    }
}

// Load recipe data
async function loadRecipe(id) {
    try {
        recipeLoading.style.display = 'block';
        recipeError.style.display = 'none';
        recipeContent.style.display = 'none';
        
        const response = await fetch(`${API_RECIPE}?id=${encodeURIComponent(id)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const recipe = await response.json();
        
        if (recipe.error) {
            throw new Error(recipe.message || recipe.error);
        }
        
        // Update page title
        document.title = `${recipe.name} - MealPlanner`;
        
        // Display recipe data
        displayRecipe(recipe);
        
        recipeLoading.style.display = 'none';
        recipeContent.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading recipe:', error);
        showError();
    }
}

// Display recipe data
function displayRecipe(recipe) {
    // Recipe name
    recipeName.textContent = recipe.name;
    
    // Recipe image
    const imagePath = getImagePath(recipe);
    recipeImage.src = imagePath;
    recipeImage.alt = recipe.name;
    recipeImage.onerror = function() {
        this.src = 'https://via.placeholder.com/600x400?text=No+Image';
    };
    
    // Category and Area badges
    if (recipe.category) {
        recipeCategory.textContent = recipe.category;
        recipeCategory.style.display = 'inline-block';
    } else {
        recipeCategory.style.display = 'none';
    }
    
    if (recipe.area) {
        recipeArea.textContent = recipe.area;
        recipeArea.style.display = 'inline-block';
    } else {
        recipeArea.style.display = 'none';
    }
    
    // Ingredients
    ingredientsList.innerHTML = '';
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ing => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="ingredient-name">${ing.ingredient || 'Unknown'}</span>
                <span class="ingredient-measure">${ing.measure || ''}</span>
            `;
            ingredientsList.appendChild(li);
        });
    } else {
        ingredientsList.innerHTML = '<li style="color: #64748b;">No ingredients listed</li>';
    }
    
    // Instructions
    if (recipe.instructions) {
        // Format instructions - split by newlines or periods
        const formattedInstructions = recipe.instructions
            .split(/\n+|\.\s+/)
            .filter(step => step.trim().length > 0)
            .map((step, index) => {
                const trimmedStep = step.trim();
                if (trimmedStep.endsWith('.')) {
                    return `<p><strong>Step ${index + 1}:</strong> ${trimmedStep}</p>`;
                }
                return `<p><strong>Step ${index + 1}:</strong> ${trimmedStep}.</p>`;
            })
            .join('');
        
        instructionsContent.innerHTML = formattedInstructions || `<p>${recipe.instructions}</p>`;
    } else {
        instructionsContent.innerHTML = '<p style="color: #64748b;">No instructions available</p>';
    }
    
    // YouTube video
    if (recipe.youtube) {
        const youtubeId = extractYouTubeId(recipe.youtube);
        if (youtubeId) {
            youtubeVideo.src = `https://www.youtube.com/embed/${youtubeId}`;
            youtubeSection.style.display = 'block';
        } else {
            youtubeSection.style.display = 'none';
        }
    } else {
        youtubeSection.style.display = 'none';
    }
    
    // Load reviews after displaying recipe
    if (recipeId) {
        loadReviews(recipeId);
    }
}

// Load reviews
async function loadReviews(recipeId) {
    if (!reviewsList) return;
    
    try {
        const response = await fetch(`${API_REVIEWS}?recipe_id=${encodeURIComponent(recipeId)}`);
        const data = await response.json();
        
        if (data.reviews) {
            displayReviews(data.reviews, data.average_rating, data.total_reviews);
        } else {
            reviewsList.innerHTML = '<p style="color: #64748b;">No reviews yet. Be the first to review!</p>';
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsList.innerHTML = '<p style="color: #ef4444;">Error loading reviews</p>';
    }
}

// Review slider state
let currentReviewIndex = 0;
let reviewSliderInterval = null;
let reviewsData = [];

// Display reviews
async function displayReviews(reviews, avgRating, totalReviews) {
    if (!reviewsList) return;
    
    reviewsData = reviews; // Store for slider
    
    // Get current user ID
    let currentUserId = null;
    try {
        const authResponse = await fetch('api/check_auth.php');
        const authData = await authResponse.json();
        if (authData.authenticated) {
            currentUserId = authData.user_id;
        } else if (localStorage.getItem('is_logged_in') === 'true') {
            currentUserId = localStorage.getItem('user_id');
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
    
    const reviewsSummaryContainer = document.getElementById('reviewsSummaryContainer');
    const reviewsSliderContainer = document.getElementById('reviewsSliderContainer');
    
    // Display summary
    if (reviewsSummaryContainer) {
        if (totalReviews > 0) {
            reviewsSummaryContainer.innerHTML = `<div class="reviews-summary">
                <div class="avg-rating">
                    <span class="rating-number">${avgRating}</span>
                    <div class="stars">${generateStars(avgRating)}</div>
                    <span class="total-reviews">(${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})</span>
                </div>
            </div>`;
        } else {
            reviewsSummaryContainer.innerHTML = '';
        }
    }
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = '<p style="color: #64748b;">No reviews yet. Be the first to review!</p>';
        if (reviewsSliderContainer) {
            reviewsSliderContainer.style.display = 'none';
        }
        return;
    }
    
    if (reviewsSliderContainer) {
        reviewsSliderContainer.style.display = 'block';
    }
    
    // Build review items for slider
    let html = '';
    reviews.forEach((review, index) => {
        const userName = `${review.first_name || ''} ${review.last_name || ''}`.trim() || 'Anonymous';
        const date = new Date(review.created_at).toLocaleDateString();
        const isOwnReview = currentUserId && review.user_id && parseInt(review.user_id) === parseInt(currentUserId);
        
        html += `
            <div class="review-item" data-review-id="${review.id}" data-index="${index}">
                <div class="review-header">
                    <div>
                        <div class="review-author">${userName}</div>
                        <div class="review-date">${date}</div>
                    </div>
                    ${isOwnReview ? `<button class="btn-delete-review" onclick="deleteReview(${review.id})" title="Delete review">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
                </div>
                <div class="review-rating">${generateStars(review.rating)}</div>
                ${review.comment ? `<div class="review-comment">${review.comment}</div>` : ''}
            </div>
        `;
    });
    
    reviewsList.innerHTML = html;
    
    // Initialize slider after a brief delay to ensure DOM is ready
    setTimeout(() => {
        initReviewSlider(reviews.length);
    }, 100);
}

// Initialize review slider
function initReviewSlider(totalReviews) {
    if (totalReviews <= 1) {
        // Hide slider controls if only one or no reviews
        const sliderPrev = document.getElementById('sliderPrev');
        const sliderNext = document.getElementById('sliderNext');
        const sliderDots = document.getElementById('sliderDots');
        if (sliderPrev) sliderPrev.style.display = 'none';
        if (sliderNext) sliderNext.style.display = 'none';
        if (sliderDots) sliderDots.style.display = 'none';
        return;
    }
    
    // Show slider controls
    const sliderPrev = document.getElementById('sliderPrev');
    const sliderNext = document.getElementById('sliderNext');
    const sliderDots = document.getElementById('sliderDots');
    if (sliderPrev) sliderPrev.style.display = 'flex';
    if (sliderNext) sliderNext.style.display = 'flex';
    if (sliderDots) sliderDots.style.display = 'flex';
    
    currentReviewIndex = 0;
    updateSliderPosition();
    createSliderDots(totalReviews);
    setupSliderControls();
    startAutoSlide(totalReviews);
}

// Update slider position
function updateSliderPosition() {
    const reviewsSlider = document.getElementById('reviewsSlider');
    if (!reviewsSlider) return;
    
    // Calculate position based on current index (each item is 100% width)
    const translateX = currentReviewIndex * 100;
    reviewsSlider.style.transform = `translateX(-${translateX}%)`;
    
    // Update active dot
    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentReviewIndex);
    });
}

// Create slider dots
function createSliderDots(totalReviews) {
    const sliderDots = document.getElementById('sliderDots');
    if (!sliderDots) return;
    
    sliderDots.innerHTML = '';
    for (let i = 0; i < totalReviews; i++) {
        const dot = document.createElement('button');
        dot.className = 'slider-dot';
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            currentReviewIndex = i;
            updateSliderPosition();
            resetAutoSlide(totalReviews);
        });
        sliderDots.appendChild(dot);
    }
}

// Setup slider controls
function setupSliderControls() {
    const sliderPrev = document.getElementById('sliderPrev');
    const sliderNext = document.getElementById('sliderNext');
    const totalReviews = reviewsData.length;
    
    if (sliderPrev) {
        sliderPrev.onclick = () => {
            currentReviewIndex = (currentReviewIndex - 1 + totalReviews) % totalReviews;
            updateSliderPosition();
            resetAutoSlide(totalReviews);
        };
    }
    
    if (sliderNext) {
        sliderNext.onclick = () => {
            currentReviewIndex = (currentReviewIndex + 1) % totalReviews;
            updateSliderPosition();
            resetAutoSlide(totalReviews);
        };
    }
}

// Start auto slide
function startAutoSlide(totalReviews) {
    if (totalReviews <= 1) return;
    
    reviewSliderInterval = setInterval(() => {
        currentReviewIndex = (currentReviewIndex + 1) % totalReviews;
        updateSliderPosition();
    }, 5000); // Auto-slide every 5 seconds
}

// Reset auto slide timer
function resetAutoSlide(totalReviews) {
    if (reviewSliderInterval) {
        clearInterval(reviewSliderInterval);
    }
    startAutoSlide(totalReviews);
}

// Handle window resize
window.addEventListener('resize', () => {
    if (reviewsData.length > 0) {
        updateSliderPosition();
    }
});

// Delete review
async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) {
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('review_id', reviewId);
        
        const response = await fetch('api/delete_review.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Reload reviews
            if (recipeId) {
                loadReviews(recipeId);
            }
            // Clear slider interval
            if (reviewSliderInterval) {
                clearInterval(reviewSliderInterval);
            }
        } else {
            alert(data.message || 'Failed to delete review');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('An error occurred. Please try again.');
    }
}

// Make deleteReview available globally
window.deleteReview = deleteReview;

// Generate star HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let html = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    
    return html;
}

// Initialize review form
function initReviewForm() {
    if (!starRating || !submitReviewBtn) return;
    
    // Star rating interaction
    const stars = starRating.querySelectorAll('.fa-star');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            currentRating = index + 1;
            updateStarDisplay();
        });
        star.addEventListener('mouseenter', () => {
            highlightStars(index + 1);
        });
    });
    
    starRating.addEventListener('mouseleave', () => {
        updateStarDisplay();
    });
    
    // Submit review
    submitReviewBtn.addEventListener('click', async () => {
        if (!isLoggedIn) {
            alert('Please login to submit a review');
            window.location.href = 'login.html';
            return;
        }
        
        if (currentRating === 0) {
            alert('Please select a rating');
            return;
        }
        
        const comment = reviewComment.value.trim();
        
        try {
            const formData = new FormData();
            formData.append('recipe_id', recipeId);
            formData.append('rating', currentRating);
            formData.append('comment', comment);
            
            const response = await fetch(API_SAVE_REVIEW, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Review submitted successfully!');
                reviewComment.value = '';
                currentRating = 0;
                updateStarDisplay();
                loadReviews(recipeId);
            } else {
                alert(data.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('An error occurred. Please try again.');
        }
    });
}

// Update star display
function updateStarDisplay() {
    if (!starRating || !ratingValue) return;
    
    const stars = starRating.querySelectorAll('.fa-star');
    stars.forEach((star, index) => {
        if (index < currentRating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
    
    ratingValue.textContent = currentRating;
}

// Highlight stars on hover
function highlightStars(rating) {
    if (!starRating) return;
    
    const stars = starRating.querySelectorAll('.fa-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
    if (!url) return null;
    
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

// Get image path
function getImagePath(recipe) {
    if (recipe.image && recipe.image.startsWith('recipe_images/')) {
        return recipe.image;
    }
    if (recipe.id) {
        return `recipe_images/${recipe.id}.jpg`;
    }
    return recipe.image_url || 'https://via.placeholder.com/600x400?text=No+Image';
}

// Show error state
function showError() {
    recipeLoading.style.display = 'none';
    recipeContent.style.display = 'none';
    recipeError.style.display = 'block';
}

// Favorite button
favoriteBtn?.addEventListener('click', () => {
    favoriteBtn.classList.toggle('active');
    const icon = favoriteBtn.querySelector('i');
    if (favoriteBtn.classList.contains('active')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        favoriteBtn.querySelector('span').textContent = 'Favorited';
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        favoriteBtn.querySelector('span').textContent = 'Favorite';
    }
});

// Share button
shareBtn?.addEventListener('click', () => {
    const recipeUrl = window.location.href;
    const recipeNameText = recipeName?.textContent || 'Recipe';
    
    if (navigator.share) {
        navigator.share({
            title: recipeNameText,
            text: `Check out this recipe: ${recipeNameText}`,
            url: recipeUrl
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(recipeUrl).then(() => {
            alert('Recipe link copied to clipboard!');
        }).catch(err => {
            // Fallback: show URL
            prompt('Copy this link:', recipeUrl);
        });
    }
});

// Mobile Menu Toggle
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
            }
        });
    }
}

// Header Scroll Effect
function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

