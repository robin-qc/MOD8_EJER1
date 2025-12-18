// CLASE CALCULADORA MEJORADA CON MANEJO DE ERRORES
class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
        this.clear();
        this.updateHistory();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.waitingForOperand = false;
    }

    delete() {
        // Si es un mensaje de error, limpiar completamente
        if (this.isErrorState()) {
            this.clear();
            this.updateDisplay();
            return;
        }
        
        if (this.currentOperand === '0' || this.currentOperand.length === 1) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.toString().slice(0, -1);
        }
    }

    appendNumber(number) {
        // Si hay un error, limpiar antes de añadir número
        if (this.isErrorState()) {
            this.clear();
        }
        
        if (this.waitingForOperand) {
            this.currentOperand = number.toString();
            this.waitingForOperand = false;
        } else {
            if (number === '.' && this.currentOperand.includes('.')) return;
            if (this.currentOperand === '0' && number !== '.') {
                this.currentOperand = number.toString();
            } else {
                this.currentOperand = this.currentOperand.toString() + number.toString();
            }
        }
    }

    chooseOperation(operation) {
        // No permitir operaciones si hay error
        if (this.isErrorState()) return;
        if (this.currentOperand === '') return;
        
        if (this.previousOperand !== '' && this.operation && !this.waitingForOperand) {
            this.compute();
        }
        
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.waitingForOperand = true;
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        let errorMessage = '';
        let resultDisplay = '';
        
        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                // Manejo especial para división por cero
                if (current === 0) {
                    if (prev === 0) {
                        // 0 ÷ 0 = RESULTADO INDEFINIDO
                        errorMessage = 'RESULTADO INDEFINIDO';
                        resultDisplay = 'RESULTADO INDEFINIDO';
                    } else {
                        // n ÷ 0 = ∞ (donde n ≠ 0)
                        errorMessage = '∞';
                        resultDisplay = '∞';
                    }
                    
                    // Guardar en historial
                    const historyEntry = `${prev} ${this.operation} ${current} = ${errorMessage}`;
                    this.history.unshift(historyEntry);
                    if (this.history.length > 10) this.history.pop();
                    localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
                    this.updateHistory();
                    
                    this.currentOperand = resultDisplay;
                    this.operation = undefined;
                    this.previousOperand = '';
                    this.updateDisplay();
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }
        
        // Verificar si el resultado es indefinido (no infinito)
        if (!isFinite(computation) && computation !== Infinity && computation !== -Infinity) {
            errorMessage = 'RESULTADO INDEFINIDO';
            resultDisplay = 'RESULTADO INDEFINIDO';
            
            // Guardar en historial
            const historyEntry = `${prev} ${this.operation} ${current} = ${errorMessage}`;
            this.history.unshift(historyEntry);
            if (this.history.length > 10) this.history.pop();
            localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
            this.updateHistory();
            
            this.currentOperand = resultDisplay;
            this.operation = undefined;
            this.previousOperand = '';
            this.updateDisplay();
            return;
        }
        
        // Para infinito (casos muy raros que no sean división por cero)
        if (computation === Infinity || computation === -Infinity) {
            errorMessage = '∞';
            resultDisplay = '∞';
            
            // Guardar en historial
            const historyEntry = `${prev} ${this.operation} ${current} = ${errorMessage}`;
            this.history.unshift(historyEntry);
            if (this.history.length > 10) this.history.pop();
            localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
            this.updateHistory();
            
            this.currentOperand = resultDisplay;
            this.operation = undefined;
            this.previousOperand = '';
            this.updateDisplay();
            return;
        }
        
        // Guardar en historial (operación válida normal)
        const historyEntry = `${prev} ${this.operation} ${current} = ${computation}`;
        this.history.unshift(historyEntry);
        if (this.history.length > 10) this.history.pop();
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
        this.updateHistory();
        
        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = '';
        this.waitingForOperand = false;
    }

    getDisplayNumber(number) {
        // Si es un mensaje especial, devolverlo tal cual
        if (number === '∞' || number === 'RESULTADO INDEFINIDO') {
            return number;
        }
        
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('es', {
                maximumFractionDigits: 0
            });
        }
        
        if (decimalDigits != null) {
            // Limitar decimales a 10
            const limitedDecimals = decimalDigits.substring(0, 10);
            return `${integerDisplay}.${limitedDecimals}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        const displayNumber = this.getDisplayNumber(this.currentOperand);
        this.currentOperandElement.textContent = displayNumber;
        
        // Aplicar clases CSS según el tipo de resultado
        this.currentOperandElement.classList.remove('error', 'infinity', 'long-text');
        
        if (this.currentOperand === 'RESULTADO INDEFINIDO') {
            this.currentOperandElement.classList.add('error', 'long-text');
        } else if (this.currentOperand === '∞') {
            this.currentOperandElement.classList.add('infinity');
        } else if (displayNumber.length > 15) {
            this.currentOperandElement.classList.add('long-text');
        }
        
        if (this.operation != null) {
            this.previousOperandElement.textContent =
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.textContent = '';
        }
    }

    updateHistory() {
        const historyList = document.querySelector('.history-list');
        historyList.innerHTML = '';
        
        this.history.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('history-item');
            
            // Verificar si es un error para aplicar estilo diferente
            if (item.includes('= ∞') || item.includes('= RESULTADO INDEFINIDO')) {
                div.classList.add('history-error');
            }
            
            div.textContent = item;
            historyList.appendChild(div);
        });
        
        // Actualizar contador
        this.updateHistoryCount();
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('calculatorHistory');
        this.updateHistory();
    }

    // MÉTODOS AUXILIARES
    isErrorState() {
        return this.currentOperand === 'RESULTADO INDEFINIDO' || 
               this.currentOperand === '∞';
    }
    
    updateHistoryCount() {
        const countElement = document.getElementById('history-count');
        if (countElement) {
            countElement.textContent = `${this.history.length} operaciones`;
        }
    }

    // Funciones matemáticas adicionales
    percentage() {
        // No permitir porcentaje en estado de error
        if (this.isErrorState()) {
            this.clear();
            return;
        }
        
        const current = parseFloat(this.currentOperand);
        if (!isNaN(current)) {
            this.currentOperand = (current / 100).toString();
            this.updateDisplay();
        }
    }

    square() {
        // No permitir cuadrado en estado de error
        if (this.isErrorState()) {
            this.clear();
            return;
        }
        
        const current = parseFloat(this.currentOperand);
        if (!isNaN(current)) {
            const result = current * current;
            
            // Verificar si el resultado es infinito
            if (!isFinite(result)) {
                // Guardar en historial
                const historyEntry = `sqr(${current}) = RESULTADO INDEFINIDO`;
                this.history.unshift(historyEntry);
                if (this.history.length > 10) this.history.pop();
                localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
                this.updateHistory();
                
                this.currentOperand = 'RESULTADO INDEFINIDO';
            } else {
                this.currentOperand = result.toString();
            }
            this.updateDisplay();
        }
    }

    squareRoot() {
        // No permitir raíz en estado de error
        if (this.isErrorState()) {
            this.clear();
            return;
        }
        
        const current = parseFloat(this.currentOperand);
        if (current < 0) {
            // Guardar en historial
            const historyEntry = `√(${current}) = RESULTADO INDEFINIDO`;
            this.history.unshift(historyEntry);
            if (this.history.length > 10) this.history.pop();
            localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
            this.updateHistory();
            
            this.currentOperand = 'RESULTADO INDEFINIDO';
            this.updateDisplay();
            return;
        }
        if (!isNaN(current)) {
            this.currentOperand = Math.sqrt(current).toString();
            this.updateDisplay();
        }
    }

    changeSign() {
        // No permitir cambio de signo en estado de error
        if (this.isErrorState()) {
            this.clear();
            return;
        }
        
        if (this.currentOperand !== '0') {
            this.currentOperand = (-parseFloat(this.currentOperand)).toString();
            this.updateDisplay();
        }
    }

    // Sistema de memoria
    memory = 0;
    memoryIndicator = null;

    memoryClear() {
        this.memory = 0;
        this.updateMemoryIndicator();
    }

    memoryRecall() {
        // No permitir recall en estado de error
        if (this.isErrorState()) {
            this.clear();
        }
        
        this.currentOperand = this.memory.toString();
        this.updateDisplay();
    }

    memoryAdd() {
        const current = parseFloat(this.currentOperand);
        if (!isNaN(current)) {
            this.memory += current;
            this.updateMemoryIndicator();
        }
    }

    memorySubtract() {
        const current = parseFloat(this.currentOperand);
        if (!isNaN(current)) {
            this.memory -= current;
            this.updateMemoryIndicator();
        }
    }

    memoryStore() {
        // No permitir store en estado de error
        if (this.isErrorState()) {
            return;
        }
        
        const current = parseFloat(this.currentOperand);
        if (!isNaN(current)) {
            this.memory = current;
            this.updateMemoryIndicator();
        }
    }

    updateMemoryIndicator() {
        if (!this.memoryIndicator) {
            this.memoryIndicator = document.getElementById('memory-indicator');
        }
        
        if (this.memory !== 0) {
            this.memoryIndicator.classList.add('active');
        } else {
            this.memoryIndicator.classList.remove('active');
        }
    }

    // Sistema de notificaciones (sin mensajes)
    showNotification(message, type = 'success') {
        // Esta función ahora no hace nada, como solicitaste
        // Solo mantenemos la estructura por compatibilidad
        return;
    }

    // Exportar historial
    exportHistory() {
        if (this.history.length === 0) {
            return;
        }
        
        const historyText = this.history.join('\n');
        const blob = new Blob([historyText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'historial_calculadora.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Tema oscuro
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('calculatorDarkTheme', isDark);
        
        const icon = document.querySelector('#theme-toggle i');
        if (isDark) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    // Sonido
    soundEnabled = true;

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.querySelector('#sound-toggle i');
        
        if (this.soundEnabled) {
            icon.className = 'fas fa-volume-up';
        } else {
            icon.className = 'fas fa-volume-mute';
        }
        
        localStorage.setItem('calculatorSound', this.soundEnabled);
    }

    playSound(type = 'click') {
        if (!this.soundEnabled) return;
        
        // Sonidos simples usando el Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch(type) {
                case 'click':
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    break;
                case 'equals':
                    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
                    break;
                case 'clear':
                    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                    break;
            }
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Fallback silencioso si el audio no funciona
        }
    }

    // Inicialización extendida
    init() {
        this.updateHistoryCount();
        this.updateMemoryIndicator();
        
        // Cargar preferencias
        const savedTheme = localStorage.getItem('calculatorDarkTheme');
        if (savedTheme === 'true') {
            document.body.classList.add('dark-theme');
            const icon = document.querySelector('#theme-toggle i');
            icon.className = 'fas fa-sun';
        }
        
        const savedSound = localStorage.getItem('calculatorSound');
        if (savedSound === 'false') {
            this.soundEnabled = false;
            const icon = document.querySelector('#sound-toggle i');
            icon.className = 'fas fa-volume-mute';
        }
    }
}

// INICIALIZACIÓN
const previousOperandElement = document.querySelector('.previous-operand');
const currentOperandElement = document.querySelector('.current-operand');
const calculator = new Calculator(previousOperandElement, currentOperandElement);

// EVENT LISTENERS
document.querySelectorAll('.btn-number').forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.textContent);
        calculator.updateDisplay();
        calculator.playSound('click');
    });
});

document.querySelectorAll('.btn-operator').forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.textContent);
        calculator.updateDisplay();
        calculator.playSound('click');
    });
});

document.querySelector('.btn-equals').addEventListener('click', () => {
    calculator.compute();
    calculator.updateDisplay();
    calculator.playSound('equals');
});

document.querySelector('.btn-clear').addEventListener('click', () => {
    calculator.clear();
    calculator.updateDisplay();
    calculator.playSound('clear');
});

document.querySelector('.btn-delete').addEventListener('click', () => {
    calculator.delete();
    calculator.updateDisplay();
    calculator.playSound('click');
});

document.querySelector('.btn-clear-history').addEventListener('click', () => {
    calculator.clearHistory();
});

// NUEVOS EVENT LISTENERS AÑADIDOS

// Funciones extras
document.getElementById('btn-percent')?.addEventListener('click', () => {
    calculator.percentage();
    calculator.playSound('click');
});

document.getElementById('btn-square')?.addEventListener('click', () => {
    calculator.square();
    calculator.playSound('click');
});

document.getElementById('btn-sqrt')?.addEventListener('click', () => {
    calculator.squareRoot();
    calculator.playSound('click');
});

document.getElementById('btn-plusminus')?.addEventListener('click', () => {
    calculator.changeSign();
    calculator.updateDisplay();
    calculator.playSound('click');
});

// Memoria
document.getElementById('mc')?.addEventListener('click', () => {
    calculator.memoryClear();
    calculator.playSound('clear');
});

document.getElementById('mr')?.addEventListener('click', () => {
    calculator.memoryRecall();
    calculator.playSound('click');
});

document.getElementById('m-plus')?.addEventListener('click', () => {
    calculator.memoryAdd();
    calculator.playSound('click');
});

document.getElementById('m-minus')?.addEventListener('click', () => {
    calculator.memorySubtract();
    calculator.playSound('click');
});

document.getElementById('ms')?.addEventListener('click', () => {
    calculator.memoryStore();
    calculator.playSound('click');
});

// Controles de la aplicación
document.getElementById('theme-toggle')?.addEventListener('click', () => {
    calculator.toggleTheme();
    calculator.playSound('click');
});

document.getElementById('sound-toggle')?.addEventListener('click', () => {
    calculator.toggleSound();
    calculator.playSound('click');
});

// Controles del historial
document.getElementById('toggle-history')?.addEventListener('click', () => {
    const historyList = document.querySelector('.history-list');
    historyList.style.display = historyList.style.display === 'none' ? 'block' : 'none';
    calculator.playSound('click');
});

document.getElementById('export-history')?.addEventListener('click', () => {
    calculator.exportHistory();
    calculator.playSound('click');
});

// SOPORTE PARA TECLADO
document.addEventListener('keydown', (e) => {
    // Atajos originales
    if (e.key >= '0' && e.key <= '9') {
        calculator.appendNumber(e.key);
        calculator.updateDisplay();
        calculator.playSound('click');
    }
    if (e.key === '.') {
        calculator.appendNumber(e.key);
        calculator.updateDisplay();
        calculator.playSound('click');
    }
    if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        const operation = e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key;
        calculator.chooseOperation(operation);
        calculator.updateDisplay();
        calculator.playSound('click');
    }
    if (e.key === 'Enter' || e.key === '=') {
        calculator.compute();
        calculator.updateDisplay();
        calculator.playSound('equals');
    }
    if (e.key === 'Backspace') {
        calculator.delete();
        calculator.updateDisplay();
        calculator.playSound('click');
    }
    if (e.key === 'Escape') {
        calculator.clear();
        calculator.updateDisplay();
        calculator.playSound('clear');
    }
    
    // NUEVOS ATAJOS AÑADIDOS
    
    // Porcentaje
    if (e.key === '%') {
        calculator.percentage();
        e.preventDefault();
    }
    
    // Memoria
    if (e.ctrlKey) {
        switch(e.key.toLowerCase()) {
            case 'm':
                calculator.memoryStore();
                e.preventDefault();
                break;
            case 'r':
                calculator.memoryRecall();
                calculator.updateDisplay();
                e.preventDefault();
                break;
            case 'a':
                calculator.memoryAdd();
                e.preventDefault();
                break;
            case 's':
                calculator.memorySubtract();
                e.preventDefault();
                break;
            case 'c':
                calculator.memoryClear();
                e.preventDefault();
                break;
        }
    }
    
    // Funciones matemáticas
    if (e.altKey) {
        switch(e.key.toLowerCase()) {
            case 'q':
                calculator.square();
                e.preventDefault();
                break;
            case 'r':
                calculator.squareRoot();
                e.preventDefault();
                break;
            case 'p':
                calculator.percentage();
                e.preventDefault();
                break;
        }
    }
    
    // Cambio de signo
    if (e.key === 'F9') {
        calculator.changeSign();
        calculator.updateDisplay();
        e.preventDefault();
    }
    
    // Tema
    if (e.key === 'F2') {
        calculator.toggleTheme();
        e.preventDefault();
    }
});

// Inicializar características adicionales
calculator.init();