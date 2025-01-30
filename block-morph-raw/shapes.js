const predefinedShapes = [
  {
    id: 1,
    color: '#FF0000',
    points: [[0,0], [1,0], [0,1]], // L形状
  },
  {
    id: 2,
    color: '#00FF00',
    points: [[0,0], [1,0], [1,1]], // 反L形状
  },
  {
    id: 3,
    color: '#0000FF',
    points: [[0,0], [1,0], [2,0]], // 长条形
  },
  {
    id: 4,
    color: '#FFFF00',
    points: [[0,0], [1,0], [0,1], [1,1]], // 方块
  },
  {
    id: 5,
    color: '#FF00FF',
    points: [[0,0], [1,0], [1,1], [2,1]], // Z形状
  }
];

// 形状验证函数
function validateShape(shape) {
  if (!shape || !Array.isArray(shape.points)) {
    return false;
  }
  
  // 检查是否有重复点
  const pointMap = new Set();
  for (const [x, y] of shape.points) {
    const key = `${x},${y}`;
    if (pointMap.has(key)) {
      return false;
    }
    pointMap.add(key);
  }
  
  // 检查所有点是否相连
  return isConnected(shape.points);
}

function isConnected(points) {
  if (points.length === 0) return true;
  
  const visited = new Set();
  const queue = [points[0]];
  
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    const key = `${cx},${cy}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    // 检查四个方向的相邻点
    for (const [nx, ny] of points) {
      if (Math.abs(nx - cx) + Math.abs(ny - cy) === 1) {
        queue.push([nx, ny]);
      }
    }
  }
  
  return visited.size === points.length;
}
