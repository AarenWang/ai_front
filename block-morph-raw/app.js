// 游戏配置
const config = {
  gridSize: 60,
  boardSize: 9,
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

// 音效
const sounds = {
  place: new Howl({ src: ['assets/sounds/place.mp3'] }),
  complete: new Howl({ src: ['assets/sounds/complete.mp3'] }),
  error: new Howl({ src: ['assets/sounds/error.mp3'] })
};

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
    width: 300,
    height: 600
  });
  const blocksPanelLayer = new Konva.Layer();
  blockStage.add(blocksPanelLayer);
  
  // 生成三个随机方块
  generateBlocks().slice(0, 3).forEach((shape, index) => {
    const block = createBlock(shape, blocksPanelLayer);
    block.position({
      x: 50,
      y: 50 + index * 150
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

  layer.add(group);
  return group;
}

// 检查碰撞
function checkCollision(pos, shape) {
  const gridX = Math.round(pos.x / config.gridSize);
  const gridY = Math.round(pos.y / config.gridSize);
  
  for (const [x, y] of shape.points) {
    const boardX = gridX + x;
    const boardY = gridY + y;
    
    // 检查是否超出边界
    if (boardX < 0 || boardX >= config.boardSize || boardY < 0 || boardY >= config.boardSize) {
      return true;
    }
    
    // 检查是否与其他方块重叠
    if (gameState.board[boardY][boardX] !== 0) {
      return true;
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
  block.draggable(false);
  
  // 检查是否需要消除
  checkCompletion();
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

// 方块生成逻辑
function generateBlocks() {
  return predefinedShapes.filter(shape => {
    return validateShape(shape); // 自定义验证逻辑
  });
}

// 拖拽交互实现
function makeDraggable(shapeNode) {
  let isDragging = false;
  shapeNode.on('dragstart', () => { isDragging = true });
  shapeNode.on('dragend', () => {
    isDragging = false;
    const pos = shapeNode.getAbsolutePosition();
    if (checkCollision(pos)) {
      mergeToBoard(shapeNode); // 合并到棋盘
    } else {
      shapeNode.position({ x: 0, y: 0 }); // 复位
    }
  });
}

// 初始化游戏
initBoard();