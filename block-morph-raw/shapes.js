const predefinedShapes = [
  // 2x2 正方形
  {
    id: 1,
    color: '#4ECDC4',
    points: [[0,0], [1,0], [0,1], [1,1]]
  },
  // 5点图形 - F形
  {
    id: 2,
    color: '#FF6B6B',
    points: [[0,0], [1,0], [2,0], [0,1], [0,2]]
  },
  // 5点图形 - 反F形
  {
    id: 3,
    color: '#45B7D1',
    points: [[0,0], [1,0], [2,0], [2,1], [2,2]]
  },
  // 5点图形 - T形
  {
    id: 4,
    color: '#96CEB4',
    points: [[0,0], [1,0], [2,0], [1,1], [1,2]]
  },
  // 5点图形 - L形
  {
    id: 5,
    color: '#D4A5A5',
    points: [[0,0], [0,1], [0,2], [1,2], [2,2]]
  },
  // 5点图形 - 反L形
  {
    id: 6,
    color: '#9FA0C3',
    points: [[2,0], [2,1], [2,2], [1,2], [0,2]]
  },
  // 5点图形 - U形
  {
    id: 7,
    color: '#FFD93D',
    points: [[0,0], [0,1], [0,2], [1,0], [2,0]]
  },
  // 5点图形 - 反U形
  {
    id: 8,
    color: '#6BCB77',
    points: [[0,0], [1,0], [2,0], [2,1], [2,2]]
  },
  // 5点图形 - Z形
  {
    id: 9,
    color: '#FF6B6B',
    points: [[0,0], [1,0], [1,1], [1,2], [2,2]]
  },
  // 5点图形 - 反Z形
  {
    id: 10,
    color: '#4D96FF',
    points: [[2,0], [1,0], [1,1], [1,2], [0,2]]
  },
  // 5点图形 - N形
  {
    id: 11,
    color: '#6BCB77',
    points: [[0,0], [0,1], [1,1], [1,2], [2,2]]
  },
  // 5点图形 - 反N形
  {
    id: 12,
    color: '#9FA0C3',
    points: [[2,0], [2,1], [1,1], [1,2], [0,2]]
  },
  // 5点图形 - 十字形
  {
    id: 13,
    color: '#FF6B6B',
    points: [[1,0], [0,1], [1,1], [2,1], [1,2]]
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
