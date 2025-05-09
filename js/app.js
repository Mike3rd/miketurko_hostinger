// app.js


let existingCategories = [];

async function fetchCategories() {
  const snapshot = await db.collection('entries').get();
  snapshot.forEach(doc => {
    const category = doc.data().category;
    if (category && !existingCategories.includes(category)) {
      existingCategories.push(category);
    }
  });
}

let fuse;

// Initialize after fetching data
async function initializeSearch() {
  const snapshot = await db.collection('entries').get();
  const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  fuse = new Fuse(entries, {
    keys: ['title', 'details', 'category'],
	includeScore: true,
    threshold: 0.3 // Adjust for fuzzy matching sensitivity
  });
}


async function searchEntries(query) {
  if (!fuse) {
    console.error('Search index not initialized');
    return '<div class="mb-bot-message">Search not ready</div>';
  }

  const results = fuse.search(query);
  
  if (results.length > 0) {
    const bestMatch = results[0].item;
    return `  // <-- Added backtick
      <div class="mb-message-container" data-id="${bestMatch.id}">
        <div class="mb-bot-message">
          <div class="mb-answer-content">
            ${bestMatch.title}: ${bestMatch.details}
          </div>
          <div class="mb-meta">
            <span class="mb-category">${bestMatch.category || 'General'}</span>
            <span class="mb-date">${bestMatch.date || ''}</span>
          </div>
          <div class="mb-message-actions">
            <button class="mb-edit-btn" onclick="toggleForm('edit', '${bestMatch.id}')">✏️</button>
            <button class="mb-delete-btn" data-entry-id="${bestMatch.id}">×</button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="mb-bot-message">
      <div class="mb-answer-content">
        🔍 No matches found for "${query}"
      </div>
      <div class="mb-help-text">
        Try searching for:
        <ul>
          <li>Specific terms (e.g., "tire size" instead of "size")</li>
          <li>Partial matches (e.g., "trek" instead of "trek bike")</li>
        </ul>
      </div>
    </div>
  `;
}


// Autocomplete logic
document.getElementById('entry-category').addEventListener('input', function(e) {
  const input = e.target.value.toLowerCase();
  const suggestions = existingCategories.filter(cat => 
    cat.toLowerCase().includes(input)
  );
  
  const suggestionsContainer = document.getElementById('category-suggestions');
  suggestionsContainer.innerHTML = '';
  
  if (input && suggestions.length > 0) {
    suggestions.forEach(cat => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.textContent = cat;
      div.onclick = () => {
        document.getElementById('entry-category').value = cat;
        suggestionsContainer.style.display = 'none';
      };
      suggestionsContainer.appendChild(div);
    });
    suggestionsContainer.style.display = 'block';
  } else {
    suggestionsContainer.style.display = 'none';
  }
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  const suggestionsContainer = document.getElementById('category-suggestions');
  
  // Only proceed if the element exists
  if (!suggestionsContainer) {
    console.warn('Category suggestions container not found');
    return;
  }

  // Hide suggestions if clicking outside the input container
  if (!e.target.closest('.input-container')) {
    suggestionsContainer.style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    window.db = firebase.firestore();

    // Initialize data
    await initializeSearch();
    await fetchCategories();

    // Add event listeners
    document.getElementById('toggle-form-btn').addEventListener('click', () => {
      toggleForm('add');
    });

    document.body.addEventListener('click', (e) => {
      // Edit button handler
      if (e.target.classList.contains('mb-edit-btn')) {
        const entryId = e.target.dataset.entryId;
        toggleForm('edit', entryId);
      }
      
      // Delete button handler (ADDED THIS BRACE)
      if (e.target.classList.contains('mb-delete-btn')) {
        const entryId = e.target.dataset.entryId;
        deleteEntry(entryId);
      }
    }); // <-- This closing ) was missing

    // Hide form
    const form = document.getElementById('entry-form');
    if (form) form.style.display = 'none';
    
  } catch (error) {
    console.error('Initialization error:', error);
  }
});



function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateString);
}


// Unified form handler
async function toggleForm(mode = 'add', entryId = null) {
  const form = document.getElementById('entry-form');
  form.style.display = 'block';
  
   // Reset form for new entries
  if (mode === 'add') {
    document.getElementById('entry-id').value = '';
    document.getElementById('entry-title').value = '';
    document.getElementById('entry-category').value = '';
    document.getElementById('entry-date').value = '';
    document.getElementById('entry-details').value = '';
  }

  if(mode === 'edit' && entryId) {
    // Fetch and populate existing data
    const doc = await db.collection('entries').doc(entryId).get();
    const data = doc.data();
    
    document.getElementById('entry-id').value = entryId;
    document.getElementById('entry-title').value = data.title;
    document.getElementById('entry-category').value = data.category || '';
    document.getElementById('entry-date').value = data.date || '';
    document.getElementById('entry-details').value = data.details;
    
    document.getElementById('form-title').textContent = 'Edit Entry';
    document.getElementById('form-submit-btn').textContent = 'Update';
  } else {
    document.getElementById('form-title').textContent = 'Add New Entry';
    document.getElementById('form-submit-btn').textContent = 'Save';
  }
}

// Modified saveEntry for add/update
async function handleFormSubmit() {
  const saveButton = document.querySelector('#form-submit-btn');
  saveButton.classList.add('mb-loading');

  try {
    if(document.getElementById('entry-id').value) {
      await updateEntry();
    } else {
      await saveEntry();
    }
  } catch (error) {
    alert("Operation failed: " + error.message);
  } finally {
    saveButton.classList.remove('mb-loading');
  }
}

async function saveEntry() {  
  const saveButton = document.querySelector('#form-submit-btn');
  saveButton.classList.add('mb-loading');

  try {
    // Validate form
    if (!validateForm()) return;

    // Get field values
    const newEntry = {
      title: document.getElementById('entry-title').value.trim(),
      category: document.getElementById('entry-category').value.trim() || "General",
      date: document.getElementById('entry-date').value || new Date().toISOString().split('T')[0],
      details: document.getElementById('entry-details').value.trim(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Add to Firestore
    const docRef = await db.collection('entries').add(newEntry);
    
    // Update UI
    await initializeSearch();
    const successMsg = document.createElement('div');
    successMsg.className = 'mb-success-message';
    successMsg.textContent = 'Entry saved!';
    document.getElementById('entry-form').appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);

    // Only clear fields on success
    document.getElementById('entry-title').value = '';
    document.getElementById('entry-category').value = '';
    document.getElementById('entry-date').value = '';
    document.getElementById('entry-details').value = '';

  } catch (error) {
    console.error('Save error:', error);
    showError(saveButton, `Save failed: ${error.message}`);
  } finally {
    saveButton.classList.remove('mb-loading');
    // Don't close form on error
    if (!document.querySelector('.mb-error-message')) {
      closeForm();
    }
  }
}

async function updateEntry() {
	if (!validateForm()) return; 
	const entryId = document.getElementById('entry-id').value;
	if (!entryId) return;
	const saveButton = document.querySelector('#form-submit-btn');
	saveButton.classList.add('mb-loading');

  const changedData = {
    title: document.getElementById('entry-title').value,
    category: document.getElementById('entry-category').value,
    date: document.getElementById('entry-date').value,
    details: document.getElementById('entry-details').value,
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Remove unchanged fields
  const docSnapshot = await db.collection('entries').doc(entryId).get();
  const originalData = docSnapshot.data();
  Object.keys(changedData).forEach(key => {
    if (changedData[key] === originalData[key]) {
      delete changedData[key];
    }
  });

  try {
    await db.collection('entries').doc(entryId).update(changedData);
    updateMessageInDOM(entryId, changedData); // Direct DOM update
    closeForm();
  } catch (error) {
    alert("Update failed: " + error.message);
  } finally {
    saveButton.classList.remove('mb-loading');
  }
}
function updateMessageInDOM(entryId, updatedData) {
  const messageDiv = document.querySelector(`[data-id="${entryId}"]`);
  if (!messageDiv) return;

  // Update specific elements
  const titleElement = messageDiv.querySelector('.mb-answer-content');
  if (titleElement && updatedData.title) {
    titleElement.innerHTML = `${updatedData.title}: ${updatedData.details || ''}`;
  }

  // Update other fields as needed
  if (updatedData.category) {
    const categoryElement = messageDiv.querySelector('.mb-category');
    if (categoryElement) categoryElement.textContent = updatedData.category;
  }
}

function validateForm() {
  let isValid = true;
  const titleInput = document.getElementById('entry-title');
  const detailsInput = document.getElementById('entry-details');

  // Clear existing errors
  document.querySelectorAll('.mb-input-error').forEach(el => 
    el.classList.remove('mb-input-error'));
  document.querySelectorAll('.mb-error-message').forEach(el => el.remove());

  // Title validation
  if (!titleInput.value.trim()) {
    showError(titleInput, "Title is required");
    isValid = false;
  }

  // Details validation
  if (!detailsInput.value.trim()) {
    showError(detailsInput, "Details are required");
    isValid = false;
  }

  return isValid;
}



function closeForm() {
  document.getElementById('entry-form').style.display = 'none';
  document.getElementById('entry-id').value = '';
  document.getElementById('entry-title').value = '';
  document.getElementById('entry-category').value = '';
  document.getElementById('entry-date').value = '';
  document.getElementById('entry-details').value = '';
  
  // Clear any existing errors
  document.querySelectorAll('.mb-input-error').forEach(el => el.classList.remove('mb-input-error'));
  document.querySelectorAll('.mb-error-message').forEach(el => el.remove());
}





async function deleteEntry(entryId) {
  if (!confirm("Delete this entry permanently?")) return;
  
  try {
    // Delete from Firestore
    await db.collection('entries').doc(entryId).delete();
    
    // Remove from DOM
    const container = document.querySelector(`.mb-message-container[data-id="${entryId}"]`);
    if (container) container.remove();
    
    // Refresh search index
    await initializeSearch();
  } catch (error) {
    alert(`Failed to delete entry: ${error.message}`);
  }
}


async function updateEntry() {
  // Validate form before proceeding
  if (!validateForm()) return;

  const entryId = document.getElementById('entry-id').value;
  if (!entryId) {
    alert("No entry selected for editing");
    return;
  }

  const saveButton = document.querySelector('#form-submit-btn');
  saveButton.classList.add('mb-loading');

  try {
    // Get changed data
    const changedData = {
      title: document.getElementById('entry-title').value,
      category: document.getElementById('entry-category').value,
      date: document.getElementById('entry-date').value,
      details: document.getElementById('entry-details').value,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Remove unchanged fields
    const doc = await db.collection('entries').doc(entryId).get();
    const originalData = doc.data();
    Object.keys(changedData).forEach(key => {
      if (changedData[key] === originalData[key]) {
        delete changedData[key];
      }
    });

    // Only update if changes exist
    if (Object.keys(changedData).length > 0) {
      await db.collection('entries').doc(entryId).update(changedData);
      
      // Update DOM
      updateMessageInDOM(entryId, changedData);
      
      // Refresh search index
      await initializeSearch();
    }

    closeForm();
  } catch (error) {
    alert(`Update failed: ${error.message}`);
  } finally {
    saveButton.classList.remove('mb-loading');
  }
}

// DOM update helper (ensure this exists)
function updateMessageInDOM(entryId, updatedData) {
  const container = document.querySelector(`.mb-message-container[data-id="${entryId}"]`);
  if (!container) return;

  // Update title/details
  const answerContent = container.querySelector('.mb-answer-content');
  if (answerContent) {
    answerContent.innerHTML = `${updatedData.title || ''}: ${updatedData.details || ''}`;
  }

  // Update category
  const categorySpan = container.querySelector('.mb-category');
  if (categorySpan && updatedData.category) {
    categorySpan.textContent = updatedData.category;
  }

  // Update date
  const dateSpan = container.querySelector('.mb-date');
  if (dateSpan && updatedData.date) {
    dateSpan.textContent = updatedData.date;
  }
}


// Function to handle user input
async function handleUserInput() {
  const userInput = document.getElementById('user-input').value;
  if (!userInput) return;

  // Display user's message
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML += `<div class="mb-user-message">${userInput}</div>`;

  // Fetch and display the answer
   const answer = await searchEntries(userInput);
  if (answer) {
    chatMessages.innerHTML += answer;
  }

  // Clear input and scroll to bottom
  document.getElementById('user-input').value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
}



function showError(inputElement, message) {
  inputElement.classList.add('mb-input-error');
  const errorMsg = document.createElement('div');
  errorMsg.className = 'mb-error-message';
  errorMsg.textContent = message;
  inputElement.parentNode.insertBefore(errorMsg, inputElement.nextSibling);
}


// Search function (simplified)
async function searchEntries(query) {
  const snapshot = await db.collection('entries').get();
  const keywords = query.toLowerCase().split(' ');
  let bestMatch = null;

  snapshot.forEach(doc => {
    const data = doc.data();
    const entryText = `${data.title} ${data.details} ${data.date}`.toLowerCase();
    const matchCount = keywords.filter(keyword => entryText.includes(keyword)).length;
    
    // Track best match WITH DOCUMENT ID
    if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.matchCount)) {
      bestMatch = {
        id: doc.id,
        data: data,
        matchCount: matchCount
      };
    }
  });

return bestMatch ? `
    <div class="mb-message-container" data-id="${bestMatch.id}">
      <div class="mb-bot-message">
        <div class="mb-answer-content">
          ${bestMatch.data.title}: ${bestMatch.data.details}
        </div>
        <div class="mb-meta">
          <span class="mb-category">${bestMatch.data.category || 'General'}</span>
          <span class="mb-date">${bestMatch.data.date || ''}</span>
        </div>
        <div class="mb-message-actions">
          <button class="mb-edit-btn" data-entry-id="${bestMatch.id}">✏️</button>
          <button class="mb-delete-btn" data-entry-id="${bestMatch.id}">❌</button>
        </div>
      </div>
    </div>
  ` : `
    <div class="mb-bot-message">
      <div class="mb-answer-content">
        🔍 No matches found for ${query}
      </div>
      <div class="mb-help-text">
        Try these tips:
        <ul>
          <li>Check your spelling</li>
          <li>Use specific terms (e.g., "tire size" instead of "size")</li>
          <li>Search partial matches (e.g., "trek" instead of "trek bike")</li>
        </ul>
      </div>
    </div>
  `; // No extra spaces before closing backtick
}