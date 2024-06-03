// public/js/scripts.js

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Dummy check for username and password (replace with real authentication)
    if (username === 'user' && password === 'pass') {
        // Set the token in localStorage (replace 'valid-token' with a real token)
        localStorage.setItem('accessToken', 'valid-token');
        
        // Redirect to home page
        window.location.href = 'home.html';
    } else {
        alert('Invalid username or password');
    }
});
