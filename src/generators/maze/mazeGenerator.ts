import { MazeConfig, MazeResult, MazeCell } from '../../types';

export function generateMaze(config: MazeConfig): MazeResult {
    const { difficulty = 'medium', checkpointWord = 'STAR' } = config;
    let width = 12;
    let height = 12;

    if (difficulty === 'easy') {
        width = 8;
        height = 8;
    } else if (difficulty === 'hard') {
        width = 16;
        height = 16;
    }

    // Initialize all walls active
    const grid: MazeCell[][] = Array(height).fill(null).map(() =>
        Array(width).fill(null).map(() => ({
            top: true,
            right: true,
            bottom: true,
            left: true,
            visited: false,
        }))
    );

    // Recursive Backtracker Maze Generation
    const stack: Array<{ r: number; c: number }> = [];
    const start = { r: 0, c: 0 };
    const goal = { r: height - 1, c: width - 1 };

    grid[start.r][start.c].visited = true;
    stack.push(start);

    const directions = [
        { dr: -1, dc: 0, wall: 'top' as const, opp: 'bottom' as const },
        { dr: 0, dc: 1, wall: 'right' as const, opp: 'left' as const },
        { dr: 1, dr2: 0, dc: 0, wall: 'bottom' as const, opp: 'top' as const },
        { dr: 0, dc: -1, wall: 'left' as const, opp: 'right' as const },
    ];

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const unvisitedNeighbors: Array<{ r: number; c: number; wall: 'top' | 'right' | 'bottom' | 'left'; opp: 'top' | 'right' | 'bottom' | 'left' }> = [];

        directions.forEach(dir => {
            const nr = current.r + dir.dr;
            const nc = current.c + dir.dc;
            if (nr >= 0 && nr < height && nc >= 0 && nc < width && !grid[nr][nc].visited) {
                unvisitedNeighbors.push({ r: nr, c: nc, wall: dir.wall, opp: dir.opp });
            }
        });

        if (unvisitedNeighbors.length > 0) {
            const chosen = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
            // Knock down walls between current and chosen
            grid[current.r][current.c][chosen.wall] = false;
            grid[chosen.r][chosen.c][chosen.opp] = false;
            grid[chosen.r][chosen.c].visited = true;
            stack.push({ r: chosen.r, c: chosen.c });
        } else {
            stack.pop();
        }
    }

    // Open entrance and exit
    grid[start.r][start.c].left = false;
    grid[goal.r][goal.c].right = false;

    // Find Solution Path using BFS
    const parent: Record<string, { r: number; c: number } | null> = {};
    const queue: Array<{ r: number; c: number }> = [start];
    const visitedBFS: Record<string, boolean> = { '0,0': true };
    parent['0,0'] = null;

    while (queue.length > 0) {
        const curr = queue.shift()!;
        if (curr.r === goal.r && curr.c === goal.c) break;

        const cell = grid[curr.r][curr.c];
        const neighbors: Array<{ r: number; c: number }> = [];

        if (!cell.top && curr.r > 0) neighbors.push({ r: curr.r - 1, c: curr.c });
        if (!cell.right && curr.c < width - 1) neighbors.push({ r: curr.r, c: curr.c + 1 });
        if (!cell.bottom && curr.r < height - 1) neighbors.push({ r: curr.r + 1, c: curr.c });
        if (!cell.left && curr.c > 0) neighbors.push({ r: curr.r, c: curr.c - 1 });

        for (const n of neighbors) {
            const key = `${n.r},${n.c}`;
            if (!visitedBFS[key]) {
                visitedBFS[key] = true;
                parent[key] = curr;
                queue.push(n);
            }
        }
    }

    // Reconstruct solution path
    const solutionPath: Array<{ r: number; c: number }> = [];
    let currNode: { r: number; c: number } | null = goal;
    while (currNode !== null) {
        solutionPath.unshift(currNode);
        const nodeKey: string = `${currNode.r},${currNode.c}`;
        currNode = parent[nodeKey] !== undefined ? parent[nodeKey] : null;
    }

    // Mark solution cells
    solutionPath.forEach(pos => {
        grid[pos.r][pos.c].isSolution = true;
    });

    // Place checkpoint letters along solution path
    const cleanWord = (checkpointWord || '').trim().toUpperCase();
    if (cleanWord.length > 0 && solutionPath.length > cleanWord.length + 2) {
        const step = Math.floor((solutionPath.length - 2) / cleanWord.length);
        for (let i = 0; i < cleanWord.length; i++) {
            const pos = solutionPath[1 + i * step];
            if (pos) {
                grid[pos.r][pos.c].checkpointLetter = cleanWord[i];
            }
        }
    }

    return {
        grid,
        start,
        goal,
        solutionPath,
    };
}

export function getDefaultMazeConfig(): MazeConfig {
    return {
        title: 'Mê Cung Chữ Cái - Letter Maze Adventure',
        paperSize: 'a4',
        showAnswerKey: false,
        fontSize: 14,
        font: 'Inter',
        studentInfo: {
            showStudentInfo: true,
            showName: true,
            showClass: true,
            showDate: true,
            showScore: false,
        },
        borderStyle: 'none',
        zoom: 0.55,
        difficulty: 'medium',
        width: 12,
        height: 12,
        startEmoji: '🐭',
        goalEmoji: '🧀',
        checkpointWord: 'CHEESE',
        showSolutionPath: false,
    };
}
