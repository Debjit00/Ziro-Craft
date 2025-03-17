window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    if (category) {
        document.getElementById('selected-category').innerText = `Selected Category: ${category}`;
        document.getElementById('category-input').value = category;
    }
    
    const email = localStorage.getItem('userEmail');
    if (email) {
        document.getElementById('email-input').value = email;
    } else {
        alert('Please log in to post an ad');
        window.location.href = '../../index.html';
    }
};

const photoInput = document.getElementById('photo-input');
const previewContainer = document.getElementById('image-preview-container');
const uploadFeedback = document.getElementById('upload-feedback');
const MAX_FILES = 12;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
let selectedFiles = [];

photoInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    if (selectedFiles.length + files.length > MAX_FILES) {
        uploadFeedback.textContent = `You can only upload up to ${MAX_FILES} images`;
        return;
    }
    
    files.forEach(file => {
        if (!file.type.startsWith('image/')) {
            uploadFeedback.textContent = 'Only image files are allowed';
            return;
        }
        
        if (file.size > MAX_SIZE) {
            uploadFeedback.textContent = 'Image size must be less than 5MB';
            return;
        }
        
        selectedFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'image-preview';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-image';
            removeBtn.textContent = 'X';
            removeBtn.onclick = function(evt) {
                evt.preventDefault(); // Prevent form submission
                const index = selectedFiles.indexOf(file);
                if (index > -1) {
                    selectedFiles.splice(index, 1);
                }
                previewContainer.removeChild(previewDiv);
            };
            
            previewDiv.appendChild(img);
            previewDiv.appendChild(removeBtn);
            previewContainer.appendChild(previewDiv);
        };
        reader.readAsDataURL(file);
    });
    
    uploadFeedback.textContent = '';
});

document.getElementById('ad-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
        uploadFeedback.textContent = 'Please upload at least one image';
        return;
    }
    
    const formData = new FormData(this);    
    for (let [key, value] of formData.entries()) {
        if (key === 'photos') {
            formData.delete(key);
        }
    }
    
    selectedFiles.forEach(file => {
        formData.append('photos', file);
    });
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';
    
    fetch('/api/offers', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert('Your ad has been posted successfully!');
        window.location.href = '/';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('There was a problem posting your ad. Please try again.');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post Your Ad';
    });
});