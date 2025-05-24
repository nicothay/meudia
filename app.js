// Estado global da aplicação
        let tasks = [
            { id: 1, name: 'Trabalho', color: '#3b82f6' },
            { id: 2, name: 'Lazer', color: '#10b981' },
            { id: 3, name: 'Dormir', color: '#8b5cf6' }
        ];

        let selectedTask = null;
        let isEraserMode = false;
        let isDragging = false;
        let currentDate = new Date();
        let dayData = {}; // Armazena dados de cada dia

        // Cores disponíveis para novas tarefas
        const availableColors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308',
            '#84cc16', '#22c55e', '#06b6d4', '#0ea5e9',
            '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
            '#ec4899', '#f43f5e'
        ];

        // Inicialização
        document.addEventListener('DOMContentLoaded', function() {
            loadFromStorage();
            initializeApp();
        });

        function initializeApp() {
            updateDateDisplay();
            createTimeGrid();
            renderTasks();
            loadDayData();
        }

        function updateDateDisplay() {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            document.getElementById('currentDate').textContent = 
                currentDate.toLocaleDateString('pt-BR', options);
        }

        function createTimeGrid() {
            const grid = document.getElementById('timeGrid');
            grid.innerHTML = '';

            for (let hour = 0; hour < 24; hour++) {
                // Label da hora
                const timeLabel = document.createElement('div');
                timeLabel.className = 'time-label';
                timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
                grid.appendChild(timeLabel);

                // Container dos blocos
                const blocksContainer = document.createElement('div');
                blocksContainer.className = 'time-blocks';

                // 6 blocos por hora (10 minutos cada)
                for (let block = 0; block < 6; block++) {
                    const timeBlock = document.createElement('div');
                    timeBlock.className = 'time-block';
                    timeBlock.dataset.hour = hour;
                    timeBlock.dataset.block = block;
                    timeBlock.dataset.id = `${hour}-${block}`;

                    // Event listeners para arrastar
                    timeBlock.addEventListener('mousedown', startDrag);
                    timeBlock.addEventListener('mouseenter', handleDrag);
                    timeBlock.addEventListener('mouseup', endDrag);

                    blocksContainer.appendChild(timeBlock);
                }

                grid.appendChild(blocksContainer);
            }

            // Event listeners globais
            document.addEventListener('mouseup', endDrag);
        }

        function startDrag(e) {
            e.preventDefault();
            isDragging = true;
            handleBlockClick(e.target);
        }

        function handleDrag(e) {
            if (isDragging) {
                handleBlockClick(e.target);
            }
        }

        function endDrag() {
            isDragging = false;
        }

        function handleBlockClick(block) {
            if (isEraserMode) {
                block.style.backgroundColor = '';
                block.dataset.taskId = '';
            } else if (selectedTask) {
                block.style.backgroundColor = selectedTask.color;
                block.dataset.taskId = selectedTask.id;
            }
            saveDayData();
        }

        function renderTasks() {
            const taskList = document.getElementById('taskList');
            taskList.innerHTML = '';

            tasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = `task-item ${selectedTask?.id === task.id ? 'active' : ''}`;
                
                taskItem.innerHTML = `
                    <div class="task-color" style="background-color: ${task.color}" 
                         onclick="selectTask(${task.id})"></div>
                    <input type="text" class="task-name" value="${task.name}" 
                           onchange="updateTaskName(${task.id}, this.value)">
                    <button class="delete-task" onclick="deleteTask(${task.id})">🗑️</button>
                `;

                taskList.appendChild(taskItem);
            });
        }

        function selectTask(taskId) {
            selectedTask = tasks.find(t => t.id === taskId);
            isEraserMode = false;
            document.getElementById('eraserBtn').classList.remove('active');
            renderTasks();
        }

        function addTask() {
            const usedColors = tasks.map(t => t.color);
            const availableColor = availableColors.find(c => !usedColors.includes(c)) || 
                                 availableColors[Math.floor(Math.random() * availableColors.length)];
            
            const newTask = {
                id: Date.now(),
                name: `Nova Tarefa ${tasks.length + 1}`,
                color: availableColor
            };

            tasks.push(newTask);
            renderTasks();
            saveToStorage();
        }

        function updateTaskName(taskId, newName) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.name = newName;
                saveToStorage();
            }
        }

        function deleteTask(taskId) {
            tasks = tasks.filter(t => t.id !== taskId);
            if (selectedTask?.id === taskId) {
                selectedTask = null;
            }
            
            // Remove blocos associados à tarefa deletada
            document.querySelectorAll(`[data-task-id="${taskId}"]`).forEach(block => {
                block.style.backgroundColor = '';
                block.dataset.taskId = '';
            });
            
            renderTasks();
            saveDayData();
            saveToStorage();
        }

        function toggleEraser() {
            isEraserMode = !isEraserMode;
            selectedTask = null;
            
            const eraserBtn = document.getElementById('eraserBtn');
            if (isEraserMode) {
                eraserBtn.classList.add('active');
            } else {
                eraserBtn.classList.remove('active');
            }
            
            renderTasks();
        }

        function resetBlocks() {
            if (confirm('Tem certeza que deseja resetar todos os blocos do dia atual?')) {
                document.querySelectorAll('.time-block').forEach(block => {
                    block.style.backgroundColor = '';
                    block.dataset.taskId = '';
                });
                saveDayData();
            }
        }

        function resetTasks() {
            if (confirm('Tem certeza que deseja resetar todas as tarefas?')) {
                tasks = [
                    { id: 1, name: 'Trabalho', color: '#3b82f6' },
                    { id: 2, name: 'Lazer', color: '#10b981' },
                    { id: 3, name: 'Dormir', color: '#8b5cf6' }
                ];
                selectedTask = null;
                isEraserMode = false;
                document.getElementById('eraserBtn').classList.remove('active');
                renderTasks();
                saveToStorage();
            }
        }

        function changeDate(direction) {
            saveDayData(); // Salva dados do dia atual antes de mudar
            currentDate.setDate(currentDate.getDate() + direction);
            updateDateDisplay();
            loadDayData(); // Carrega dados do novo dia
        }

        function saveDayData() {
            const dateKey = currentDate.toDateString();
            const blocks = {};
            
            document.querySelectorAll('.time-block[data-task-id]').forEach(block => {
                if (block.dataset.taskId) {
                    blocks[block.dataset.id] = {
                        taskId: parseInt(block.dataset.taskId),
                        color: block.style.backgroundColor
                    };
                }
            });
            
            dayData[dateKey] = blocks;
            localStorage.setItem('dayData', JSON.stringify(dayData));
        }

        function loadDayData() {
            const dateKey = currentDate.toDateString();
            const blocks = dayData[dateKey] || {};
            
            // Limpa todos os blocos primeiro
            document.querySelectorAll('.time-block').forEach(block => {
                block.style.backgroundColor = '';
                block.dataset.taskId = '';
            });
            
            // Aplica dados salvos
            Object.entries(blocks).forEach(([blockId, data]) => {
                const block = document.querySelector(`[data-id="${blockId}"]`);
                if (block) {
                    block.style.backgroundColor = data.color;
                    block.dataset.taskId = data.taskId;
                }
            });
        }

        function saveToStorage() {
            localStorage.setItem('tasks', JSON.stringify(tasks));
            localStorage.setItem('dayData', JSON.stringify(dayData));
        }

        function loadFromStorage() {
            const savedTasks = localStorage.getItem('tasks');
            const savedDayData = localStorage.getItem('dayData');
            
            if (savedTasks) {
                tasks = JSON.parse(savedTasks);
            }
            
            if (savedDayData) {
                dayData = JSON.parse(savedDayData);
            }
        }

        function toggleTheme() {
            document.body.classList.toggle('light-theme');
            const themeBtn = document.querySelector('.theme-toggle');
            themeBtn.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
            
            // Salva preferência do tema
            localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        }

        // Carrega tema salvo
        document.addEventListener('DOMContentLoaded', function() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                toggleTheme();
            }
        });

        async function exportToPNG() {
            try {
                // Cria um canvas temporário
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Define dimensões
                canvas.width = 1080;
                canvas.height = 800;
                
                // Background
                const isDarkTheme = !document.body.classList.contains('light-theme');
                ctx.fillStyle = isDarkTheme ? '#1a1a2e' : '#fef3c7';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Título e data
                ctx.fillStyle = isDarkTheme ? '#e2e8f0' : '#1f2937';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Meu Dia em Blocos', canvas.width / 2, 40);
                
                ctx.font = '18px Arial';
                ctx.fillText(document.getElementById('currentDate').textContent, canvas.width / 2, 70);
                
                // Grid de blocos
                const startX = 100;
                const startY = 100;
                const blockWidth = 12;
                const blockHeight = 25;
                const hourLabelWidth = 60;
                
                for (let hour = 0; hour < 24; hour++) {
                    // Label da hora
                    ctx.fillStyle = isDarkTheme ? '#94a3b8' : '#6b7280';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'right';
                    ctx.fillText(`${hour.toString().padStart(2, '0')}:00`, 
                                startX + hourLabelWidth - 10, 
                                startY + (hour * blockHeight) + 17);
                    
                    // Blocos da hora
                    for (let block = 0; block < 6; block++) {
                        const blockElement = document.querySelector(`[data-id="hour−{hour}-{block}"]`);
                        const x = startX + hourLabelWidth + (block * blockWidth);
                        const y = startY + (hour * blockHeight);
                        
                        if (blockElement && blockElement.dataset.taskId) {
                            ctx.fillStyle = blockElement.style.backgroundColor || '#ccc';
                        } else {
                            ctx.fillStyle = isDarkTheme ? '#334155' : '#e5e7eb';
                        }
                        
                        ctx.fillRect(x, y, blockWidth - 1, blockHeight - 1);
                    }
                }
                
                // Legenda
                let legendY = startY + (24 * blockHeight) + 50;
                ctx.fillStyle = isDarkTheme ? '#e2e8f0' : '#1f2937';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('Legenda:', startX, legendY);
                
                legendY += 30;
                tasks.forEach((task, index) => {
                    // Quadrado colorido
                    ctx.fillStyle = task.color;
                    ctx.fillRect(startX + 20, legendY - 12, 15, 15);
                    
                    // Nome da tarefa
                    ctx.fillStyle = isDarkTheme ? '#e2e8f0' : '#1f2937';
                    ctx.font = '14px Arial';
                    ctx.fillText(task.name, startX + 45, legendY);
                    
                    legendY += 25;
                });
                
                // Converte para blob e baixa
                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `meu-dia-${currentDate.toISOString().split('T')[0]}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
                
            } catch (error) {
                alert('Erro ao exportar imagem. Tente novamente.');
                console.error('Erro na exportação:', error);
            }
        }
