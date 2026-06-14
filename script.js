const SUPABASE_URL = 'https://xiznybqrdyzwjuiuvyhd.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpem55YnFyZHl6d2p1aXV2eWhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjQ1NjIsImV4cCI6MjA5NzAwMDU2Mn0.l5iS1OFGw6l1meZaP1WWkIHlPsNsWHADzN3feSxszUs';

let display = document.getElementById('display');
let currentInput = "";
let lastExpression = "";
let isLearning = false;
let memory = {}; // <--- ЭТОТ ОБЪЕКТ УСКОРИТ РАБОТУ В 100 РАЗ

window.append = (val) => {
    currentInput += val;
    display.innerText = currentInput;
};

window.clearDisplay = () => {
    currentInput = "";
    lastExpression = "";
    isLearning = false;
    display.innerText = "0";
    document.getElementById('status-bar').innerText = "Калькулятор готов";
};

window.calculate = async () => {
    const statusBar = document.getElementById('status-bar');
    const expr = currentInput;

    // 1. Режим обучения (запись ответа)
    if (isLearning) {
        const answer = currentInput;
        statusBar.innerText = "Запоминаю...";
        
        await fetch(`${SUPABASE_URL}/rest/v1/calculations`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ expression: lastExpression, result: answer })
        });
        
        memory[lastExpression] = answer; // Сохраняем в кэш
        statusBar.innerText = "Готово!";
        isLearning = false;
        return;
    }

    // 2. Валидация
    const hasOperator = /[+\-*/]/.test(expr);
    const endsWithDigit = /\d$/.test(expr);

    if (!hasOperator || !endsWithDigit) {
        statusBar.innerText = "Введите полный пример (например: 2+2).";
        return; 
    }

    // 3. ПРОВЕРКА В КЭШЕ (МГНОВЕННО)
    if (memory[expr]) {
        display.innerText = memory[expr];
        currentInput = memory[expr];
        statusBar.innerText = "Нашел в базе";
        return;
    }

    // 4. Запрос к базе, если в кэше нет
    lastExpression = expr;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/calculations?expression=eq.${encodeURIComponent(expr)}&select=result`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const data = await res.json();

    if (data && data.length > 0) {
        memory[expr] = data[0].result; // Сохраняем в кэш на будущее
        display.innerText = data[0].result;
        currentInput = data[0].result;
        statusBar.innerText = "Нашел в базе";
    } else {
        isLearning = true;
        display.innerText = "0";
        currentInput = "";
        statusBar.innerText = `Не знаю "${expr}". Введи ответ и нажми '='`;
    }
};


async function updateStats() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/calculations?select=count`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact' }
    });
    const count = res.headers.get('content-range').split('/')[1];
    document.getElementById('count').innerText = count;
}
updateStats();

