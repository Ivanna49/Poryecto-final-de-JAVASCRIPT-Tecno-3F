document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    const API_KEY = 'b5553f5d7afdbc114d1e357238eceaed';
    const LIST_ID = '8537372';
    let currentPage = 1;
    let currentFilter = 'list';
    let currentSearch = '';
    
    // Elementos del DOM
    const header = document.getElementById('header');
    const menuToggle = document.getElementById('menu-toggle');
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const moviesContainer = document.getElementById('movies-container');
    const loadMoreBtn = document.getElementById('load-more');
    const loadingElement = document.getElementById('loading');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('movie-search');
    const searchBtn = document.getElementById('search-btn');
    const contactForm = document.getElementById('contact-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const formSuccess = document.getElementById('form-success');
    const backToTopBtn = document.getElementById('back-to-top');
    const themeToggle = document.getElementById('theme-toggle');

    // Inicialización
    initTheme();
    setupEventListeners();
    loadMovies();

    // Funciones principales
    function initTheme() {
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'light' || (!savedTheme && !prefersDarkScheme.matches)) {
            document.body.classList.add('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            themeToggle.title = 'Cambiar a modo oscuro';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggle.title = 'Cambiar a modo claro';
        }
    }

    function setupEventListeners() {
        // Navegación
        menuToggle.addEventListener('click', toggleMenu);
        window.addEventListener('scroll', handleScroll);
        
        // Películas
        loadMoreBtn.addEventListener('click', loadMoreMovies);
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') handleSearch();
        });
        
        // Formulario
        contactForm.addEventListener('submit', handleFormSubmit);
        emailInput.addEventListener('input', validateEmail);
        
        // Botones
        backToTopBtn.addEventListener('click', scrollToTop);
        themeToggle.addEventListener('click', toggleTheme);
        
        // Filtros
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                currentPage = 1;
                currentSearch = '';
                searchInput.value = '';
                loadMovies();
            });
        });

        // Navegación suave
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                navbar.querySelector('ul').classList.remove('show');
                targetSection.scrollIntoView({ behavior: 'smooth' });
                updateActiveLink(targetId);
            });
        });
        
        // Modal de películas
        document.querySelector('.close-modal').addEventListener('click', closeModal);
        document.getElementById('movie-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('movie-modal')) {
                closeModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('movie-modal').style.display === 'block') {
                closeModal();
            }
        });
    }

    function toggleMenu() {
        navbar.querySelector('ul').classList.toggle('show');
    }

    function handleScroll() {
        // Header efecto scroll
        const scrollClass = window.scrollY > 100 ? 'scrolled' : '';
        header.className = scrollClass ? 'scrolled' : '';
        
        if (document.body.classList.contains('light-theme')) {
            header.style.backgroundColor = scrollClass ? 'rgba(255, 255, 255, 0.95)' : 'var(--secondary-color)';
        } else {
            header.style.backgroundColor = scrollClass ? 'rgba(20, 20, 20, 0.9)' : 'var(--secondary-color)';
        }
        
        // Botón volver arriba
        backToTopBtn.classList.toggle('visible', window.pageYOffset > 300);
        
        // Actualizar enlace activo
        const sections = document.querySelectorAll('section');
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + section.offsetHeight) {
                currentSection = `#${section.id}`;
            }
        });
        
        updateActiveLink(currentSection);
    }

    function updateActiveLink(targetId) {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === targetId);
        });
    }

    async function loadMovies() {
        try {
            showLoading();
            let url;
            
            if (currentSearch) {
                url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${currentSearch}&page=${currentPage}&language=es-ES`;
            } else if (currentFilter === 'list') {
                url = `https://api.themoviedb.org/3/list/${LIST_ID}?api_key=${API_KEY}&language=es-ES`;
            } else {
                url = `https://api.themoviedb.org/3/movie/${currentFilter}?api_key=${API_KEY}&page=${currentPage}&language=es-ES`;
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            
            const data = await response.json();
            const movies = data.items || data.results || [];
            
            if (currentPage === 1) {
                moviesContainer.innerHTML = '';
            }
            
            if (movies.length === 0) {
                moviesContainer.innerHTML = '<p>No se encontraron películas.</p>';
                loadMoreBtn.style.display = 'none';
            } else {
                displayMovies(movies);
                loadMoreBtn.style.display = (currentFilter === 'list' || !data.total_pages || data.total_pages <= currentPage) ? 'none' : 'block';
            }
        } catch (error) {
            console.error('Error al cargar películas:', error);
            moviesContainer.innerHTML = `<p>Error: ${error.message}</p>`;
        } finally {
            hideLoading();
        }
    }

    function displayMovies(movies) {
        movies.forEach((movie, index) => {
            if (!movie.poster_path) return;
            
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.style.animationDelay = `${index * 0.1}s`;
            
            const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
            const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'Año desconocido';
            
            movieCard.innerHTML = `
                <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
                <div class="movie-info">
                    <h3 class="movie-title" title="${movie.title}">${movie.title}</h3>
                    <p class="movie-year">${releaseYear}</p>
                    <div class="movie-rating" data-rating="${movie.vote_average?.toFixed(1) || 'N/A'}">
                        <i class="fas fa-star"></i>
                        <span>${movie.vote_average?.toFixed(1) || 'N/A'}</span>
                    </div>
                </div>
            `;
            
            movieCard.addEventListener('click', () => {
                showMovieDetails(movie.id);
            });
            
            moviesContainer.appendChild(movieCard);
        });
    }

    async function showMovieDetails(movieId) {
        try {
            showLoading();
            const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=es-ES`);
            const movie = await response.json();
            
            // Obtener géneros
            const genres = movie.genres?.map(genre => genre.name) || ['Género no disponible'];
            
            // Formatear duración
            const runtime = movie.runtime ? `${Math.floor(movie.runtime/60)}h ${movie.runtime%60}m` : 'Duración no disponible';
            
            // Actualizar el modal
            document.getElementById('modal-title').textContent = movie.title || 'Título no disponible';
            document.getElementById('modal-year').textContent = movie.release_date ? movie.release_date.split('-')[0] : 'Año desconocido';
            document.getElementById('modal-runtime').textContent = runtime;
            document.getElementById('modal-rating').textContent = `${movie.vote_average?.toFixed(1) || 'N/A'} / 10`;
            document.getElementById('modal-overview').textContent = movie.overview || 'Descripción no disponible';
            
            // Actualizar poster (usar backdrop si existe, sino poster)
            const posterUrl = movie.backdrop_path 
                ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
                : movie.poster_path
                    ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
                    : 'https://via.placeholder.com/800x450?text=Poster+no+disponible';
            
            document.querySelector('.modal-poster').style.backgroundImage = `url(${posterUrl})`;
            
            // Actualizar géneros
            const genresContainer = document.querySelector('.modal-genres');
            genresContainer.innerHTML = genres.map(genre => 
                `<span class="genre-tag">${genre}</span>`
            ).join('');
            
            // Enlace a IMDB
            const imdbLink = document.getElementById('modal-imdb');
            if (movie.imdb_id) {
                imdbLink.href = `https://www.imdb.com/title/${movie.imdb_id}`;
                imdbLink.style.display = 'inline-block';
            } else {
                imdbLink.style.display = 'none';
            }
            
            // Mostrar modal
            document.getElementById('movie-modal').style.display = 'block';
            document.body.style.overflow = 'hidden'; // Bloquear scroll
        } catch (error) {
            console.error('Error al cargar detalles:', error);
            alert('Error al cargar los detalles de la película');
        } finally {
            hideLoading();
        }
    }

    function closeModal() {
        document.getElementById('movie-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function loadMoreMovies() {
        currentPage++;
        loadMovies();
    }

    function handleSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            currentSearch = searchTerm;
            currentPage = 1;
            currentFilter = '';
            loadMovies();
        } else {
            const activeFilter = document.querySelector('.filter-btn.active');
            if (activeFilter) activeFilter.click();
        }
    }

    function showLoading() {
        loadingElement.style.display = 'block';
        loadMoreBtn.style.display = 'none';
    }

    function hideLoading() {
        loadingElement.style.display = 'none';
    }

    function validateEmail() {
        const emailValue = emailInput.value.trim();
        if (emailValue) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailValue)) {
                emailError.textContent = 'Formato de email inválido. Debe ser usuario@dominio.com';
                emailError.classList.add('show');
                emailInput.classList.add('error');
            } else {
                emailError.classList.remove('show');
                emailInput.classList.remove('error');
            }
        } else {
            emailError.classList.remove('show');
            emailInput.classList.remove('error');
        }
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Resetear errores
        nameError.classList.remove('show');
        emailError.classList.remove('show');
        nameInput.classList.remove('error');
        emailInput.classList.remove('error');
        
        let isValid = true;
        
        if (!nameInput.value.trim()) {
            nameError.textContent = 'El nombre es obligatorio';
            nameError.classList.add('show');
            nameInput.classList.add('error');
            isValid = false;
        }
        
        const emailValue = emailInput.value.trim();
        if (!emailValue) {
            emailError.textContent = 'El email es obligatorio';
            emailError.classList.add('show');
            emailInput.classList.add('error');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            emailError.textContent = 'Formato de email inválido. Debe ser usuario@dominio.com';
            emailError.classList.add('show');
            emailInput.classList.add('error');
            isValid = false;
        }
        
        if (isValid) {
            contactForm.reset();
            formSuccess.style.display = 'block';
            setTimeout(() => formSuccess.style.display = 'none', 5000);
        }
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function toggleTheme() {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        
        // Actualizar ícono y tooltip
        if (isLight) {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            themeToggle.title = 'Cambiar a modo oscuro';
            header.style.backgroundColor = 'var(--secondary-color)';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggle.title = 'Cambiar a modo claro';
            header.style.backgroundColor = 'var(--secondary-color)';
        }
        
        // Forzar actualización del header
        handleScroll();
    }
});