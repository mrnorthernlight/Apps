using UnityEngine;
using System.Collections.Generic;

namespace NorthernBlocks.Gameplay
{
    /// <summary>
    /// Manages the game grid, collision detection, and line clearing
    /// </summary>
    public class GameGrid : MonoBehaviour
    {
        [Header("Grid Settings")]
        [SerializeField] private int gridWidth = 10;
        [SerializeField] private int gridHeight = 22;
        [SerializeField] private int visibleHeight = 20;
        [SerializeField] private float blockSize = 1f;
        
        [Header("Visual Settings")]
        [SerializeField] private GameObject gridLinePrefab;
        [SerializeField] private Material gridLineMaterial;
        [SerializeField] private bool showGridLines = true;
        [SerializeField] private Color gridLineColor = Color.gray;
        
        // Grid data
        private GameObject[,] grid;
        private List<GameObject> gridLines;
        private List<int> completedLines;
        
        // Events
        public System.Action<List<int>> OnLinesCompleted;
        public System.Action<int> OnLinesCleared;
        public System.Action OnGridUpdated;
        
        // Properties
        public int GridWidth => gridWidth;
        public int GridHeight => gridHeight;
        public int VisibleHeight => visibleHeight;
        public float BlockSize => blockSize;
        
        private void Awake()
        {
            InitializeGrid();
            CreateGridLines();
        }
        
        private void InitializeGrid()
        {
            grid = new GameObject[gridWidth, gridHeight];
            completedLines = new List<int>();
            gridLines = new List<GameObject>();
        }
        
        private void CreateGridLines()
        {
            if (!showGridLines) return;
            
            // Create vertical lines
            for (int x = 0; x <= gridWidth; x++)
            {
                CreateGridLine(
                    new Vector3(x * blockSize - gridWidth * blockSize * 0.5f, 0, 0),
                    new Vector3(x * blockSize - gridWidth * blockSize * 0.5f, visibleHeight * blockSize, 0)
                );
            }
            
            // Create horizontal lines
            for (int y = 0; y <= visibleHeight; y++)
            {
                CreateGridLine(
                    new Vector3(-gridWidth * blockSize * 0.5f, y * blockSize, 0),
                    new Vector3(gridWidth * blockSize * 0.5f, y * blockSize, 0)
                );
            }
        }
        
        private void CreateGridLine(Vector3 start, Vector3 end)
        {
            GameObject line = new GameObject("GridLine");
            line.transform.SetParent(transform);
            
            LineRenderer lr = line.AddComponent<LineRenderer>();
            lr.material = gridLineMaterial;
            lr.color = gridLineColor;
            lr.startWidth = 0.05f;
            lr.endWidth = 0.05f;
            lr.positionCount = 2;
            lr.useWorldSpace = false;
            lr.sortingOrder = -1;
            
            lr.SetPosition(0, start);
            lr.SetPosition(1, end);
            
            gridLines.Add(line);
        }
        
        public bool IsValidPosition(Vector2Int position, List<Vector2Int> shape)
        {
            foreach (var offset in shape)
            {
                Vector2Int worldPos = position + offset;
                
                // Check bounds
                if (worldPos.x < 0 || worldPos.x >= gridWidth || worldPos.y < 0)
                {
                    return false;
                }
                
                // Check collision with existing blocks
                if (worldPos.y < gridHeight && grid[worldPos.x, worldPos.y] != null)
                {
                    return false;
                }
            }
            
            return true;
        }
        
        public void PlaceBlock(Block block)
        {
            var worldPositions = block.GetWorldPositions();
            
            foreach (var pos in worldPositions)
            {
                if (pos.x >= 0 && pos.x < gridWidth && pos.y >= 0 && pos.y < gridHeight)
                {
                    // Create a static block piece at this position
                    GameObject staticPiece = CreateStaticBlockPiece(block);
                    staticPiece.transform.position = new Vector3(pos.x * blockSize, pos.y * blockSize, 0);
                    grid[pos.x, pos.y] = staticPiece;
                }
            }
            
            // Check for completed lines
            CheckForCompletedLines();
            OnGridUpdated?.Invoke();
        }
        
        private GameObject CreateStaticBlockPiece(Block block)
        {
            GameObject piece = GameObject.CreatePrimitive(PrimitiveType.Cube);
            piece.transform.localScale = Vector3.one * blockSize;
            piece.transform.SetParent(transform);
            
            // Copy material and color from the original block
            var renderer = piece.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material = new Material(renderer.material);
                renderer.material.color = block.BlockColor;
            }
            
            // Remove collider as we don't need physics
            var collider = piece.GetComponent<Collider>();
            if (collider != null)
            {
                DestroyImmediate(collider);
            }
            
            return piece;
        }
        
        private void CheckForCompletedLines()
        {
            completedLines.Clear();
            
            for (int y = 0; y < gridHeight; y++)
            {
                if (IsLineComplete(y))
                {
                    completedLines.Add(y);
                }
            }
            
            if (completedLines.Count > 0)
            {
                OnLinesCompleted?.Invoke(new List<int>(completedLines));
                ClearCompletedLines();
            }
        }
        
        private bool IsLineComplete(int y)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                if (grid[x, y] == null)
                {
                    return false;
                }
            }
            return true;
        }
        
        private void ClearCompletedLines()
        {
            // Sort lines from bottom to top for proper clearing
            completedLines.Sort();
            
            foreach (int lineY in completedLines)
            {
                ClearLine(lineY);
            }
            
            // Drop lines above cleared lines
            DropLinesAbove();
            
            OnLinesCleared?.Invoke(completedLines.Count);
        }
        
        private void ClearLine(int y)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                if (grid[x, y] != null)
                {
                    DestroyImmediate(grid[x, y]);
                    grid[x, y] = null;
                }
            }
        }
        
        private void DropLinesAbove()
        {
            int linesCleared = completedLines.Count;
            
            // Start from the bottom cleared line and work up
            for (int clearY = completedLines[0]; clearY < gridHeight - linesCleared; clearY++)
            {
                for (int x = 0; x < gridWidth; x++)
                {
                    // Move block from above down
                    int sourceY = clearY + linesCleared;
                    if (sourceY < gridHeight)
                    {
                        grid[x, clearY] = grid[x, sourceY];
                        grid[x, sourceY] = null;
                        
                        // Update visual position
                        if (grid[x, clearY] != null)
                        {
                            grid[x, clearY].transform.position = new Vector3(x * blockSize, clearY * blockSize, 0);
                        }
                    }
                }
            }
        }
        
        public bool IsGameOver()
        {
            // Check if any blocks are above the visible area
            for (int x = 0; x < gridWidth; x++)
            {
                if (grid[x, visibleHeight] != null)
                {
                    return true;
                }
            }
            return false;
        }
        
        public void ClearGrid()
        {
            for (int x = 0; x < gridWidth; x++)
            {
                for (int y = 0; y < gridHeight; y++)
                {
                    if (grid[x, y] != null)
                    {
                        DestroyImmediate(grid[x, y]);
                        grid[x, y] = null;
                    }
                }
            }
            OnGridUpdated?.Invoke();
        }
        
        public int GetBlockCount()
        {
            int count = 0;
            for (int x = 0; x < gridWidth; x++)
            {
                for (int y = 0; y < gridHeight; y++)
                {
                    if (grid[x, y] != null)
                    {
                        count++;
                    }
                }
            }
            return count;
        }
        
        public float GetGridFillPercentage()
        {
            int totalCells = gridWidth * visibleHeight;
            int filledCells = 0;
            
            for (int x = 0; x < gridWidth; x++)
            {
                for (int y = 0; y < visibleHeight; y++)
                {
                    if (grid[x, y] != null)
                    {
                        filledCells++;
                    }
                }
            }
            
            return (float)filledCells / totalCells;
        }
        
        public Vector3 GetGridCenter()
        {
            return new Vector3(
                (gridWidth - 1) * blockSize * 0.5f,
                visibleHeight * blockSize * 0.5f,
                0
            );
        }
        
        public Vector3 GetSpawnPosition()
        {
            return new Vector3(
                (gridWidth / 2) * blockSize,
                visibleHeight * blockSize,
                0
            );
        }
        
        public void SetGridLineVisibility(bool visible)
        {
            showGridLines = visible;
            
            foreach (var line in gridLines)
            {
                if (line != null)
                {
                    line.SetActive(visible);
                }
            }
        }
        
        public void SetGridLineColor(Color color)
        {
            gridLineColor = color;
            
            foreach (var line in gridLines)
            {
                if (line != null)
                {
                    var lr = line.GetComponent<LineRenderer>();
                    if (lr != null)
                    {
                        lr.color = color;
                    }
                }
            }
        }
        
        // Debug visualization
        private void OnDrawGizmos()
        {
            if (!Application.isPlaying) return;
            
            Gizmos.color = Color.yellow;
            
            // Draw grid bounds
            Vector3 center = GetGridCenter();
            Vector3 size = new Vector3(gridWidth * blockSize, visibleHeight * blockSize, 0.1f);
            Gizmos.DrawWireCube(center, size);
            
            // Draw filled cells
            Gizmos.color = Color.red;
            for (int x = 0; x < gridWidth; x++)
            {
                for (int y = 0; y < visibleHeight; y++)
                {
                    if (grid != null && grid[x, y] != null)
                    {
                        Vector3 pos = new Vector3(x * blockSize, y * blockSize, 0);
                        Gizmos.DrawWireCube(pos, Vector3.one * blockSize * 0.9f);
                    }
                }
            }
        }
    }
}
