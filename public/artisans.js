document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/artisans')
        .then(res => res.json())
        .then(artisans => {
            const container = document.getElementById('artisans-container');
            artisans.forEach(artisan => {
                const artisanDiv = document.createElement('div');
                artisanDiv.innerHTML = `<h2>${artisan.name}</h2><p>${artisan.bio}</p>`;
                container.appendChild(artisanDiv);
            });
        });
});