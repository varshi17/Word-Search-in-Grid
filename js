document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const wordInput = document.getElementById('wordInput');
    const gridSizeInput = document.getElementById('gridSize');
    const generateBtn = document.getElementById('generateBtn');
    const wordList = document.getElementById('wordList');
    const puzzleGrid = document.getElementById('puzzleGrid');
    const statusDiv = document.getElementById('status');
    const timerDiv = document.getElementById('timer');
    
    // Game state
    let words = [];
    let grid = [];
    let selectedCells = [];
    let foundWords = [];
    let startTime = null;
    let timerInterval = null;
    
    // Initialize
    generateBtn.addEventListener('click', generatePuzzle);
    
    // Generate the puzzle
    function generatePuzzle() {
        // Clear previous state
        puzzleGrid.innerHTML = '';
        wordList.innerHTML = '';
        selectedCells = [];
        foundWords = [];
        statusDiv.textContent = '';
        statusDiv.className = 'status';
        stopTimer();
        
        // Get words and clean them up
        const inputText = wordInput.value.trim();
        if (!inputText) {
            showStatus('Please enter some words first!', 'error');
            return;
        }
        
        words = inputText.split('\n')
            .map(word => word.trim().toUpperCase())
            .filter(word => word.length > 0);
        
        if (words.length === 0) {
            showStatus('Please enter some valid words!', 'error');
            return;
        }
        
        // Check if any word is too long for the grid
        const gridSize = parseInt(gridSizeInput.value);
        const maxWordLength = Math.max(...words.map(word => word.length));
        
        if (maxWordLength > gridSize) {
            showStatus(`Some words are too long for a ${gridSize}x${gridSize} grid!`, 'error');
            return;
        }
        
        // Display word list
        words.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            li.dataset.word = word;
            wordList.appendChild(li);
        });
        
        // Generate the grid (in a real app, you might call a C++ backend here)
        grid = generateWordSearchGrid(words, gridSize);
        renderGrid();
        
        // Add event listeners for word selection
        setupGridEvents();
        
        startTimer();
        showStatus('Puzzle generated! Find the words by clicking and dragging.', 'info');
    }
    
    // Generate word search grid (simplified JavaScript version)
    function generateWordSearchGrid(words, size) {
        // This is a simplified version. In a real app, you'd call the C++ backend
        // For now, we'll create a mock grid with words placed randomly
        
        // Initialize empty grid
        const grid = Array(size).fill().map(() => Array(size).fill(''));
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        // Place words randomly
        for (const word of words) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!placed && attempts < maxAttempts) {
                attempts++;
                
                // Random direction
                const dir = [
                    { dr: 1, dc: 0 },   // Down
                    { dr: 0, dc: 1 },    // Right
                    { dr: 1, dc: 1 },    // Diagonal down-right
                    { dr: -1, dc: 1 }    // Diagonal up-right
                ][Math.floor(Math.random() * 4)];
                
                // Random start position that fits the word
                const startRow = dir.dr > 0 ? 
                    Math.floor(Math.random() * (size - word.length + 1)) :
                    Math.floor(Math.random() * (size - word.length + 1)) + word.length - 1;
                
                const startCol = dir.dc > 0 ? 
                    Math.floor(Math.random() * (size - word.length + 1)) :
                    Math.floor(Math.random() * (size - word.length + 1)) + word.length - 1;
                
                // Check if word can be placed
                let canPlace = true;
                let r = startRow, c = startCol;
                
                for (let i = 0; i < word.length; i++) {
                    if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
                        canPlace = false;
                        break;
                    }
                    r += dir.dr;
                    c += dir.dc;
                }
                
                // Place the word if possible
                if (canPlace) {
                    r = startRow;
                    c = startCol;
                    for (let i = 0; i < word.length; i++) {
                        grid[r][c] = word[i];
                        r += dir.dr;
                        c += dir.dc;
                    }
                    placed = true;
                }
            }
            
            if (!placed) {
                console.warn(`Could not place word: ${word}`);
            }
        }
        
        // Fill remaining spaces with random letters
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === '') {
                    grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
        
        return grid;
    }
    
    // Render the grid
    function renderGrid() {
        puzzleGrid.style.gridTemplateColumns = `repeat(${grid.length}, 1fr)`;
        
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid.length; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.textContent = grid[r][c];
                cell.dataset.row = r;
                cell.dataset.col = c;
                puzzleGrid.appendChild(cell);
            }
        }
    }
    
    // Set up grid event listeners
    function setupGridEvents() {
        let isMouseDown = false;
        
        puzzleGrid.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('cell')) {
                isMouseDown = true;
                clearSelection();
                addToSelection(e.target);
            }
        });
        
        puzzleGrid.addEventListener('mouseover', (e) => {
            if (isMouseDown && e.target.classList.contains('cell')) {
                addToSelection(e.target);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isMouseDown) {
                isMouseDown = false;
                checkSelection();
            }
        });
        
        // Touch support
        puzzleGrid.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const cell = document.elementFromPoint(touch.clientX, touch.clientY);
            if (cell && cell.classList.contains('cell')) {
                e.preventDefault();
                isMouseDown = true;
                clearSelection();
                addToSelection(cell);
            }
        });
        
        puzzleGrid.addEventListener('touchmove', (e) => {
            if (isMouseDown) {
                const touch = e.touches[0];
                const cell = document.elementFromPoint(touch.clientX, touch.clientY);
                if (cell && cell.classList.contains('cell')) {
                    e.preventDefault();
                    addToSelection(cell);
                }
            }
        });
        
        document.addEventListener('touchend', () => {
            if (isMouseDown) {
                isMouseDown = false;
                checkSelection();
            }
        });
    }
    
    // Add a cell to the current selection
    function addToSelection(cell) {
        if (!cell.classList.contains('selected') && !cell.classList.contains('found')) {
            // Check if the new cell is adjacent to the last selected cell
            if (selectedCells.length > 0) {
                const lastCell = selectedCells[selectedCells.length - 1];
                const lastRow = parseInt(lastCell.dataset.row);
                const lastCol = parseInt(lastCell.dataset.col);
                const newRow = parseInt(cell.dataset.row);
                const newCol = parseInt(cell.dataset.col);
                
                // Check if the new cell is adjacent (including diagonals)
                const rowDiff = Math.abs(newRow - lastRow);
                const colDiff = Math.abs(newCol - lastCol);
                
                if (rowDiff > 1 || colDiff > 1) {
                    return; // Not adjacent
                }
            }
            
            cell.classList.add('selected');
            selectedCells.push(cell);
        }
    }
    
    // Clear the current selection
    function clearSelection() {
        selectedCells.forEach(cell => {
            if (!cell.classList.contains('found')) {
                cell.classList.remove('selected');
                cell.classList.remove('highlight');
            }
        });
        selectedCells = [];
    }
    
    // Check if the current selection matches a word
    function checkSelection() {
        if (selectedCells.length < 2) {
            clearSelection();
            return;
        }
        
        // Get the selected letters
        const selectedWord = selectedCells.map(cell => cell.textContent).join('');
        
        // Check if it matches any word (forward or backward)
        const matchedWord = words.find(word => 
            word === selectedWord || word === selectedWord.split('').reverse().join('')
        );
        
        if (matchedWord && !foundWords.includes(matchedWord)) {
            // Mark as found
            foundWords.push(matchedWord);
            
            // Update UI
            selectedCells.forEach(cell => {
                cell.classList.remove('selected');
                cell.classList.add('found');
            });
            
            // Update word list
            const wordItems = wordList.querySelectorAll('li');
            wordItems.forEach(li => {
                if (li.dataset.word === matchedWord) {
                    li.classList.add('found');
                }
            });
            
            // Check if all words are found
            if (foundWords.length === words.length) {
                stopTimer();
                showStatus('Congratulations! You found all the words!', 'success');
            } else {
                showStatus(`Found: ${matchedWord}`, 'success');
            }
        } else {
            // Highlight briefly to show incorrect selection
            selectedCells.forEach(cell => {
                cell.classList.add('highlight');
            });
            setTimeout(clearSelection, 500);
        }
    }
    
    // Timer functions
    function startTimer() {
        startTime = new Date();
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    function stopTimer() {
        clearInterval(timerInterval);
    }
    
    function updateTimer() {
        const now = new Date();
        const elapsed = new Date(now - startTime);
        const minutes = elapsed.getUTCMinutes().toString().padStart(2, '0');
        const seconds = elapsed.getUTCSeconds().toString().padStart(2, '0');
        timerDiv.textContent = `Time: ${minutes}:${seconds}`;
    }
    
    // Show status message
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + (type || '');
    }
});
