// 游戏配置
const config = {
  gridSize: 60,
  boardSize: 8,  // 改为 8x8 棋盘
  padding: 5
};

// 初始化舞台
const stage = new Konva.Stage({
  container: 'board',
  width: config.gridSize * config.boardSize,  // 9*9 格子，每格60px
  height: config.gridSize * config.boardSize
});

// 添加一个图层用于绘制网格和方块
const gridLayer = new Konva.Layer();
const blockLayer = new Konva.Layer();
stage.add(gridLayer);
stage.add(blockLayer);

// 游戏状态
const gameState = {
  board: Array(9).fill().map(() => Array(9).fill(0)),
  score: 0,
  currentBlocks: []
};

// 初始化棋盘
function initBoard() {
  // 绘制网格
  for (let i = 0; i <= config.boardSize; i++) {
    // 垂直线
    gridLayer.add(new Konva.Line({
      points: [i * config.gridSize, 0, i * config.gridSize, config.boardSize * config.gridSize],
      stroke: '#ddd',
      strokeWidth: 1
    }));
    // 水平线
    gridLayer.add(new Konva.Line({
      points: [0, i * config.gridSize, config.boardSize * config.gridSize, i * config.gridSize],
      stroke: '#ddd',
      strokeWidth: 1
    }));
  }
  gridLayer.draw();
  
  // 初始化方块面板
  initBlocksPanel();
}

// 初始化方块面板
function initBlocksPanel() {
  const blocksPanel = document.getElementById('blocks-panel');
  const blockStage = new Konva.Stage({
    container: 'blocks-panel',
    width: 400,  // 增加宽度以容纳3列
    height: 1000  // 增加高度以显示所有图形
  });
  const blocksPanelLayer = new Konva.Layer();
  blockStage.add(blocksPanelLayer);
  
  // 保存对右侧舞台和图层的引用
  window.blocksPanelStage = blockStage;
  window.blocksPanelLayer = blocksPanelLayer;
  
  // 显示所有13个方块，分3列显示
  predefinedShapes.forEach((shape, index) => {
    const block = createBlock(shape, blocksPanelLayer);
    const column = index % 3;  // 0, 1, 2 分别代表三列
    const row = Math.floor(index / 3);  // 计算行数
    
    block.position({
      x: 20 + column * (config.gridSize * 3 + 20),  // 每列之间留出足够空间
      y: 20 + row * (config.gridSize * 3 + 20)      // 每行之间留出足够空间
    });
    makeDraggable(block);
  });
  
  blocksPanelLayer.draw();
}

// 创建可拖动的方块
function createBlock(shape, layer) {
  const group = new Konva.Group({
    draggable: true,
    shape: shape // 存储形状数据
  });

  // 为每个点创建一个方块
  shape.points.forEach(([x, y]) => {
    const rect = new Konva.Rect({
      x: x * config.gridSize,
      y: y * config.gridSize,
      width: config.gridSize - config.padding * 2,
      height: config.gridSize - config.padding * 2,
      fill: shape.color,
      cornerRadius: 4
    });
    group.add(rect);
  });

  if (layer) {
    layer.add(group);
  }
  return group;
}

// 拖拽交互实现
function makeDraggable(block) {
  let isDragging = false;
  let blockClone = null;

  block.on('dragstart', () => {
    isDragging = true;
    
    // 创建一个克隆方块到主棋盘
    const shape = block.attrs.shape;
    blockClone = createBlock(shape, blockLayer);
    blockClone.position(stage.getPointerPosition());
    blockLayer.draw();

    // 更新位置信息
    updatePositionInfo(block.getAbsolutePosition(), shape);
  });

  block.on('dragmove', () => {
    if (blockClone) {
      // 将方块移动到鼠标位置
      const pos = stage.getPointerPosition();
      blockClone.position({
        x: Math.round(pos.x / config.gridSize) * config.gridSize,
        y: Math.round(pos.y / config.gridSize) * config.gridSize
      });
      blockLayer.draw();

      // 更新位置信息
      updatePositionInfo(pos, block.attrs.shape);
    }
  });

  block.on('dragend', () => {
    isDragging = false;
    if (blockClone) {
      const pos = blockClone.position();
      // 这里也传入 blockClone 作为当前方块
      if (!checkCollision(pos, block.attrs.shape, blockClone)) {
        mergeToBoard(blockClone);
        block.destroy(); // 移除原始方块
        
        // 生成新的方块替换被使用的方块
        const newShape = generateBlocks()[0];
        if (newShape) {
          const newBlock = createBlock(newShape, block.getLayer());
          newBlock.position(block.position());
          makeDraggable(newBlock);
          block.getLayer().draw();
        }
      } else {
        blockClone.destroy(); // 如果不能放置，移除克隆的方块
      }
      blockLayer.draw();
      block.getLayer().draw();

      // 清除位置信息
      updatePositionInfo(null);
    }
  });
}

// 生成方块函数
function generateBlocks() {
  const validShapes = predefinedShapes.filter(shape => validateShape(shape));
  // 随机打乱数组顺序
  return validShapes.sort(() => Math.random() - 0.5);
}

// 检查碰撞函数更新
function checkCollision(pos, shape, currentBlock = null) {
  const gridX = Math.round(pos.x / config.gridSize);
  const gridY = Math.round(pos.y / config.gridSize);
  
  // 获取当前方块占用的所有点
  const currentBlockPoints = new Set();
  if (currentBlock) {
    const blockX = Math.round(currentBlock.x() / config.gridSize);
    const blockY = Math.round(currentBlock.y() / config.gridSize);
    currentBlock.attrs.shape.points.forEach(([x, y]) => {
      currentBlockPoints.add(`${blockX + x},${blockY + y}`);
    });
  }
  
  for (const [x, y] of shape.points) {
    const boardX = gridX + x;
    const boardY = gridY + y;
    
    // 检查是否超出边界
    if (boardX < 0 || boardX >= config.boardSize || boardY < 0 || boardY >= config.boardSize) {
      return true;
    }
    
    // 检查是否与其他方块重叠
    if (gameState.board[boardY][boardX] !== 0) {
      // 如果这个位置是当前方块占用的，则不算碰撞
      if (!currentBlockPoints.has(`${boardX},${boardY}`)) {
        return true;
      }
    }
  }
  return false;
}

// 将方块合并到棋盘
function mergeToBoard(block) {
  const pos = block.getAbsolutePosition();
  const gridX = Math.round(pos.x / config.gridSize);
  const gridY = Math.round(pos.y / config.gridSize);
  const shape = block.attrs.shape;
  
  // 更新游戏状态
  shape.points.forEach(([x, y]) => {
    const boardX = gridX + x;
    const boardY = gridY + y;
    gameState.board[boardY][boardX] = shape.id;
  });
  
  // 固定方块位置
  block.position({
    x: gridX * config.gridSize,
    y: gridY * config.gridSize
  });
  
  // 保持方块可拖动
  block.draggable(true);
  addBoardBlockDraggable(block);
  
  // 检查是否胜利
  if (checkWin()) {
    handleWin();
  }
}

// 为棋盘上的方块添加拖动事件
function addBoardBlockDraggable(block) {
  const shape = block.attrs.shape;
  let startPos = null;
  let isMovingToPanel = false;
  
  block.on('dragstart', () => {
    startPos = block.position();
    isMovingToPanel = false;
    // 从游戏状态中临时移除当前方块
    const pos = block.getAbsolutePosition();
    const gridX = Math.round(pos.x / config.gridSize);
    const gridY = Math.round(pos.y / config.gridSize);
    
    shape.points.forEach(([x, y]) => {
      const boardX = gridX + x;
      const boardY = gridY + y;
      if (boardY >= 0 && boardY < config.boardSize && boardX >= 0 && boardX < config.boardSize) {
        gameState.board[boardY][boardX] = 0;
      }
    });

    // 更新位置信息
    updatePositionInfo(pos, shape);
  });

  block.on('dragmove', (e) => {
    if (isMovingToPanel) return;

    const pos = block.getAbsolutePosition();
    // 更新位置信息
    updatePositionInfo(pos, shape);
    
    const mousePos = stage.getPointerPosition();
    const panelRect = document.getElementById('blocks-panel').getBoundingClientRect();
    const stageRect = stage.container().getBoundingClientRect();
    
    // 计算图形所有点的位置
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    shape.points.forEach(([x, y]) => {
      const boardX = Math.round(pos.x / config.gridSize) + x;
      const boardY = Math.round(pos.y / config.gridSize) + y;
      minX = Math.min(minX, boardX);
      maxX = Math.max(maxX, boardX);
      minY = Math.min(minY, boardY);
      maxY = Math.max(maxY, boardY);
    });

    // 检查鼠标是否在右侧面板区域内
    const isMouseInPanel = mousePos && 
      mousePos.x + stageRect.left > panelRect.left && 
      mousePos.x + stageRect.left < panelRect.right &&
      mousePos.y + stageRect.top > panelRect.top && 
      mousePos.y + stageRect.top < panelRect.bottom;

    // 只有当鼠标在右侧面板区域内时才切换
    if (maxX >= config.boardSize && isMouseInPanel) {
      isMovingToPanel = true;
      // 移动到右侧面板
      const newShape = predefinedShapes[Math.floor(Math.random() * predefinedShapes.length)];
      if (newShape && window.blocksPanelLayer) {
        const newBlock = createBlock(newShape, null);
        const index = window.blocksPanelLayer.children ? window.blocksPanelLayer.children.length : 0;
        const column = index % 3;
        const row = Math.floor(index / 3);
        
        newBlock.position({
          x: 20 + column * (config.gridSize * 3 + 20),
          y: 20 + row * (config.gridSize * 3 + 20)
        });
        
        window.blocksPanelLayer.add(newBlock);
        makeDraggable(newBlock);
        window.blocksPanelLayer.batchDraw();
      }
      
      block.destroy();
      blockLayer.batchDraw();
      return;
    }

    // 限制在棋盘范围内移动
    const newX = Math.round(pos.x / config.gridSize) * config.gridSize;
    const newY = Math.round(pos.y / config.gridSize) * config.gridSize;
    
    // 计算新位置是否会导致任何部分超出边界
    let isValidPosition = true;
    shape.points.forEach(([x, y]) => {
      const boardX = Math.round(newX / config.gridSize) + x;
      const boardY = Math.round(newY / config.gridSize) + y;
      if (boardX < 0 || boardY < 0 || boardY >= config.boardSize) {
        isValidPosition = false;
      }
    });

    // 只在有效位置更新方块位置
    if (isValidPosition) {
      block.position({
        x: newX,
        y: newY
      });
    } else {
      block.position(startPos);
    }
    
    blockLayer.batchDraw();
  });

  block.on('dragend', (e) => {
    if (isMovingToPanel) {
      // 清除位置信息
      updatePositionInfo(null);
      return;
    }

    const pos = block.getAbsolutePosition();
    // 在棋盘范围内的处理
    if (!checkCollision(pos, shape, block)) {
      const gridX = Math.round(pos.x / config.gridSize);
      const gridY = Math.round(pos.y / config.gridSize);
      
      shape.points.forEach(([x, y]) => {
        const boardX = gridX + x;
        const boardY = gridY + y;
        gameState.board[boardY][boardX] = shape.id;
      });
      
      block.position({
        x: gridX * config.gridSize,
        y: gridY * config.gridSize
      });
    } else {
      // 如果新位置无效，返回起始位置
      block.position(startPos);
      
      // 恢复游戏状态
      const gridX = Math.round(startPos.x / config.gridSize);
      const gridY = Math.round(startPos.y / config.gridSize);
      
      shape.points.forEach(([x, y]) => {
        const boardX = gridX + x;
        const boardY = gridY + y;
        if (boardY >= 0 && boardY < config.boardSize && boardX >= 0 && boardX < config.boardSize) {
          gameState.board[boardY][boardX] = shape.id;
        }
      });
    }
    
    blockLayer.batchDraw();
    
    // 检查是否胜利
    if (checkWin()) {
      handleWin();
    }
  });
}

// 检查是否完成行或列
function checkCompletion() {
  const completedRows = [];
  const completedCols = [];
  
  // 检查行
  for (let y = 0; y < config.boardSize; y++) {
    if (gameState.board[y].every(cell => cell !== 0)) {
      completedRows.push(y);
    }
  }
  
  // 检查列
  for (let x = 0; x < config.boardSize; x++) {
    if (gameState.board.every(row => row[x] !== 0)) {
      completedCols.push(x);
    }
  }
  
  // 如果有完成的行或列，进行消除
  if (completedRows.length > 0 || completedCols.length > 0) {
    clearLines(completedRows, completedCols);
  }
}

// 触摸事件处理
function setupTouchEvents(block) {
  const hammer = new Hammer(block.getStage().container());
  hammer.on('pan', handlePan);
  hammer.on('panend', handlePanEnd);
}

// 清除完成的行和列
function clearLines(rows, cols) {
  // 获取需要删除的方块
  const blocksToRemove = new Set();
  
  // 标记要删除的行中的方块
  rows.forEach(y => {
    for (let x = 0; x < config.boardSize; x++) {
      if (gameState.board[y][x] !== 0) {
        const blocks = blockLayer.children.filter(block => {
          const blockX = Math.round(block.x() / config.gridSize);
          const blockY = Math.round(block.y() / config.gridSize);
          return block.attrs.shape.points.some(([px, py]) => {
            return blockX + px === x && blockY + py === y;
          });
        });
        blocks.forEach(block => blocksToRemove.add(block));
      }
    }
  });

  // 标记要删除的列中的方块
  cols.forEach(x => {
    for (let y = 0; y < config.boardSize; y++) {
      if (gameState.board[y][x] !== 0) {
        const blocks = blockLayer.children.filter(block => {
          const blockX = Math.round(block.x() / config.gridSize);
          const blockY = Math.round(block.y() / config.gridSize);
          return block.attrs.shape.points.some(([px, py]) => {
            return blockX + px === x && blockY + py === y;
          });
        });
        blocks.forEach(block => blocksToRemove.add(block));
      }
    }
  });

  // 删除方块
  blocksToRemove.forEach(block => {
    block.destroy();
  });

  // 更新游戏状态
  rows.forEach(y => {
    for (let x = 0; x < config.boardSize; x++) {
      gameState.board[y][x] = 0;
    }
  });

  cols.forEach(x => {
    for (let y = 0; y < config.boardSize; y++) {
      gameState.board[y][x] = 0;
    }
  });

  // 更新分数
  const clearedLines = rows.length + cols.length;
  gameState.score += clearedLines * 100;
  updateScore();

  // 重绘图层
  blockLayer.draw();
}

// 更新分数显示
function updateScore() {
  const scoreElement = document.getElementById('score');
  if (scoreElement) {
    scoreElement.textContent = `Score: ${gameState.score}`;
  }
}

// 检查游戏是否结束
function checkGameOver() {
  // 检查是否还有空间放置新方块
  const remainingBlocks = document.querySelector('#blocks-panel').querySelectorAll('.konva-container');
  for (const block of remainingBlocks) {
    const shape = block.attrs.shape;
    // 遍历棋盘每个格子
    for (let y = 0; y < config.boardSize; y++) {
      for (let x = 0; x < config.boardSize; x++) {
        const pos = { x: x * config.gridSize, y: y * config.gridSize };
        if (!checkCollision(pos, shape)) {
          return false; // 还有位置可以放置
        }
      }
    }
  }
  return true; // 没有位置可以放置任何方块
}

// 游戏结束处理
function handleGameOver() {
  alert(`Game Over! Final Score: ${gameState.score}`);
  // 可以添加重新开始游戏的逻辑
}

// 检查游戏是否胜利
function checkWin() {
  // 检查所有格子是否都被填满
  for (let y = 0; y < config.boardSize; y++) {
    for (let x = 0; x < config.boardSize; x++) {
      if (gameState.board[y][x] === 0) {
        return false; // 还有空格
      }
    }
  }
  return true; // 所有格子都被填满
}

// 处理游戏胜利
function handleWin() {
  alert('恭喜你赢得了游戏！');
  // 这里可以添加重新开始游戏的逻辑
}

// 添加更新位置信息的函数
function updatePositionInfo(pos, shape) {
  const blockPosElement = document.getElementById('block-position');
  const gridPosElement = document.getElementById('grid-position');
  
  if (pos) {
    // 更新实际像素位置
    blockPosElement.textContent = `x: ${Math.round(pos.x)}, y: ${Math.round(pos.y)}`;
    
    // 计算并更新网格位置
    const gridX = Math.round(pos.x / config.gridSize);
    const gridY = Math.round(pos.y / config.gridSize);
    
    // 如果有形状信息，显示形状所占用的所有格子
    if (shape) {
      const gridPositions = shape.points.map(([x, y]) => {
        const boardX = gridX + x;
        const boardY = gridY + y;
        return `(${boardX},${boardY})`;
      }).join(' ');
      gridPosElement.textContent = gridPositions;
    } else {
      gridPosElement.textContent = `(${gridX},${gridY})`;
    }
  } else {
    blockPosElement.textContent = '-';
    gridPosElement.textContent = '-';
  }
}

// 初始化游戏
initBoard();