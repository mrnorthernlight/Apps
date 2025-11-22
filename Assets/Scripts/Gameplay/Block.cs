using UnityEngine;
using System.Collections.Generic;

namespace NorthernBlocks.Gameplay
{
    /// <summary>
    /// Represents a single Tetris block (tetromino) with its shape, rotation, and position
    /// </summary>
    public class Block : MonoBehaviour
    {
        [Header("Block Settings")]
        [SerializeField] private BlockType blockType;
        [SerializeField] private Color blockColor = Color.white;
        [SerializeField] private Material blockMaterial;
        
        [Header("Visual Settings")]
        [SerializeField] private float blockSize = 1f;
        [SerializeField] private GameObject blockPrefab;
        [SerializeField] private bool enableGlow = false;
        
        // Block data
        private Vector2Int gridPosition;
        private int currentRotation = 0;
        private List<Vector2Int> blockShape;
        private List<GameObject> blockPieces;
        private bool isActive = true;
        private bool isLocked = false;
        
        // Movement
        private float fallTimer = 0f;
        private float fallSpeed = 1f;
        private bool fastFalling = false;
        
        // Events
        public System.Action<Block> OnBlockLocked;
        public System.Action<Block> OnBlockMoved;
        public System.Action<Block> OnBlockRotated;
        
        // Properties
        public BlockType Type => blockType;
        public Vector2Int GridPosition => gridPosition;
        public int CurrentRotation => currentRotation;
        public List<Vector2Int> Shape => blockShape;
        public bool IsActive => isActive;
        public bool IsLocked => isLocked;
        public Color BlockColor => blockColor;
        
        public enum BlockType
        {
            I, // Line
            O, // Square
            T, // T-shape
            S, // S-shape
            Z, // Z-shape
            J, // J-shape
            L  // L-shape
        }
        
        private void Awake()
        {
            blockPieces = new List<GameObject>();
            InitializeBlock();
        }
        
        private void Update()
        {
            if (isActive && !isLocked)
            {
                HandleFalling();
            }
        }
        
        private void InitializeBlock()
        {
            // Initialize block shape based on type
            blockShape = GetBlockShape(blockType, currentRotation);
            
            // Create visual representation
            CreateBlockPieces();
            
            // Set initial position
            gridPosition = new Vector2Int(5, 20); // Start at top center
            UpdateVisualPosition();
        }
        
        private List<Vector2Int> GetBlockShape(BlockType type, int rotation)
        {
            var shape = new List<Vector2Int>();
            
            switch (type)
            {
                case BlockType.I:
                    shape = GetIBlockShape(rotation);
                    break;
                case BlockType.O:
                    shape = GetOBlockShape(rotation);
                    break;
                case BlockType.T:
                    shape = GetTBlockShape(rotation);
                    break;
                case BlockType.S:
                    shape = GetSBlockShape(rotation);
                    break;
                case BlockType.Z:
                    shape = GetZBlockShape(rotation);
                    break;
                case BlockType.J:
                    shape = GetJBlockShape(rotation);
                    break;
                case BlockType.L:
                    shape = GetLBlockShape(rotation);
                    break;
            }
            
            return shape;
        }
        
        private List<Vector2Int> GetIBlockShape(int rotation)
        {
            var shape = new List<Vector2Int>();
            
            if (rotation % 2 == 0) // Horizontal
            {
                shape.Add(new Vector2Int(-1, 0));
                shape.Add(new Vector2Int(0, 0));
                shape.Add(new Vector2Int(1, 0));
                shape.Add(new Vector2Int(2, 0));
            }
            else // Vertical
            {
                shape.Add(new Vector2Int(0, -1));
                shape.Add(new Vector2Int(0, 0));
                shape.Add(new Vector2Int(0, 1));
                shape.Add(new Vector2Int(0, 2));
            }
            
            return shape;
        }
        
        private List<Vector2Int> GetOBlockShape(int rotation)
        {
            var shape = new List<Vector2Int>();
            
            // O block doesn't rotate
            shape.Add(new Vector2Int(0, 0));
            shape.Add(new Vector2Int(1, 0));
            shape.Add(new Vector2Int(0, 1));
            shape.Add(new Vector2Int(1, 1));
            
            return shape;
        }
        
        private List<Vector2Int> GetTBlockShape(int rotation)
        {
            var shape = new List<Vector2Int>();
            
            switch (rotation % 4)
            {
                case 0: // T pointing up
                    shape.Add(new Vector2Int(-1, 0));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(1, 0));
                    shape.Add(new Vector2Int(0, 1));
                    break;
                case 1: // T pointing right
                    shape.Add(new Vector2Int(0, -1));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(0, 1));
                    shape.Add(new Vector2Int(1, 0));
                    break;
                case 2: // T pointing down
                    shape.Add(new Vector2Int(-1, 0));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(1, 0));
                    shape.Add(new Vector2Int(0, -1));
                    break;
                case 3: // T pointing left
                    shape.Add(new Vector2Int(0, -1));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(0, 1));
                    shape.Add(new Vector2Int(-1, 0));
                    break;
            }
            
            return shape;
        }
        
        private List<Vector2Int> GetSBlockShape(int rotation)
        {
            var shape = new List<Vector2Int>();
            
            if (rotation % 2 == 0) // Horizontal
            {
                shape.Add(new Vector2Int(-1, 0));
                shape.Add(new Vector2Int(0, 0));
                shape.Add(new Vector2Int(0, 1));
                shape.Add(new Vector2Int(1, 1));
            }
            else // Vertical
            {
                shape.Add(new Vector2Int(0, -1));
                shape.Add(new Vector2Int(0, 0));
                shape.Add(new Vector2Int(1, 0));
                shape.Add(new Vector2Int(1, 1));
            }
            
            return shape;
        }
        
        private List<Vector2Int> GetZBlockShape(int rotation)
        {
            var shape = new List<Vector2Int>();
            
            if (rotation % 2 == 0) // Horizontal
            {
                shape.Add(new Vector2Int(-1, 1));
                shape.Add(new Vector2Int(0, 1));
                shape.Add(new Vector2Int(0, 0));
                shape.Add(new Vector2Int(1, 0));
            }
            else // Vertical
            {
                shape.Add(new Vector2Int(0, 1));
                shape.Add(new Vector2Int(0, 0));
                shape.Add(new Vector2Int(1, 0));
                shape.Add(new Vector2Int(1, -1));
            }
            
            return shape;
        }
        
        private List<Vector2Int> GetJBlockShape(int rotation)
        {
            var shape = new List<Vector2Int>();
            
            switch (rotation % 4)
            {
                case 0:
                    shape.Add(new Vector2Int(-1, 1));
                    shape.Add(new Vector2Int(-1, 0));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(1, 0));
                    break;
                case 1:
                    shape.Add(new Vector2Int(0, 1));
                    shape.Add(new Vector2Int(1, 1));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(0, -1));
                    break;
                case 2:
                    shape.Add(new Vector2Int(-1, 0));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(1, 0));
                    shape.Add(new Vector2Int(1, -1));
                    break;
                case 3:
                    shape.Add(new Vector2Int(0, 1));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(0, -1));
                    shape.Add(new Vector2Int(-1, -1));
                    break;
            }
            
            return shape;
        }
        
        private List<Vector2Int> GetLBlockShape(int rotation)
        {
            var shape = new List<Vector2Int>();
            
            switch (rotation % 4)
            {
                case 0:
                    shape.Add(new Vector2Int(1, 1));
                    shape.Add(new Vector2Int(-1, 0));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(1, 0));
                    break;
                case 1:
                    shape.Add(new Vector2Int(0, 1));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(0, -1));
                    shape.Add(new Vector2Int(1, -1));
                    break;
                case 2:
                    shape.Add(new Vector2Int(-1, 0));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(1, 0));
                    shape.Add(new Vector2Int(-1, -1));
                    break;
                case 3:
                    shape.Add(new Vector2Int(-1, 1));
                    shape.Add(new Vector2Int(0, 1));
                    shape.Add(new Vector2Int(0, 0));
                    shape.Add(new Vector2Int(0, -1));
                    break;
            }
            
            return shape;
        }
        
        private void CreateBlockPieces()
        {
            // Clear existing pieces
            foreach (var piece in blockPieces)
            {
                if (piece != null)
                    DestroyImmediate(piece);
            }
            blockPieces.Clear();
            
            // Create new pieces based on shape
            foreach (var offset in blockShape)
            {
                GameObject piece = CreateBlockPiece();
                piece.transform.SetParent(transform);
                piece.transform.localPosition = new Vector3(offset.x * blockSize, offset.y * blockSize, 0);
                blockPieces.Add(piece);
            }
        }
        
        private GameObject CreateBlockPiece()
        {
            GameObject piece;
            
            if (blockPrefab != null)
            {
                piece = Instantiate(blockPrefab);
            }
            else
            {
                // Create default cube
                piece = GameObject.CreatePrimitive(PrimitiveType.Cube);
                piece.transform.localScale = Vector3.one * blockSize;
            }
            
            // Apply material and color
            var renderer = piece.GetComponent<Renderer>();
            if (renderer != null)
            {
                if (blockMaterial != null)
                {
                    renderer.material = blockMaterial;
                }
                renderer.material.color = blockColor;
            }
            
            return piece;
        }
        
        private void HandleFalling()
        {
            fallTimer += Time.deltaTime;
            float currentFallSpeed = fastFalling ? fallSpeed * 10f : fallSpeed;
            
            if (fallTimer >= 1f / currentFallSpeed)
            {
                MoveDown();
                fallTimer = 0f;
            }
        }
        
        public bool MoveLeft()
        {
            return TryMove(new Vector2Int(-1, 0));
        }
        
        public bool MoveRight()
        {
            return TryMove(new Vector2Int(1, 0));
        }
        
        public bool MoveDown()
        {
            bool moved = TryMove(new Vector2Int(0, -1));
            if (!moved)
            {
                LockBlock();
            }
            return moved;
        }
        
        public void HardDrop()
        {
            while (TryMove(new Vector2Int(0, -1)))
            {
                // Keep moving down until we can't
            }
            LockBlock();
        }
        
        public bool Rotate(bool clockwise = true)
        {
            int newRotation = clockwise ? (currentRotation + 1) % 4 : (currentRotation + 3) % 4;
            var newShape = GetBlockShape(blockType, newRotation);
            
            // Check if rotation is valid
            if (IsValidPosition(gridPosition, newShape))
            {
                currentRotation = newRotation;
                blockShape = newShape;
                CreateBlockPieces();
                UpdateVisualPosition();
                OnBlockRotated?.Invoke(this);
                return true;
            }
            
            return false;
        }
        
        private bool TryMove(Vector2Int direction)
        {
            Vector2Int newPosition = gridPosition + direction;
            
            if (IsValidPosition(newPosition, blockShape))
            {
                gridPosition = newPosition;
                UpdateVisualPosition();
                OnBlockMoved?.Invoke(this);
                return true;
            }
            
            return false;
        }
        
        private bool IsValidPosition(Vector2Int position, List<Vector2Int> shape)
        {
            var gameGrid = FindObjectOfType<GameGrid>();
            if (gameGrid == null) return true; // Allow movement if no grid found
            
            return gameGrid.IsValidPosition(position, shape);
        }
        
        private void UpdateVisualPosition()
        {
            transform.position = new Vector3(gridPosition.x * blockSize, gridPosition.y * blockSize, 0);
        }
        
        private void LockBlock()
        {
            if (isLocked) return;
            
            isLocked = true;
            isActive = false;
            OnBlockLocked?.Invoke(this);
        }
        
        public void SetFallSpeed(float speed)
        {
            fallSpeed = speed;
        }
        
        public void SetFastFalling(bool fast)
        {
            fastFalling = fast;
        }
        
        public void SetBlockType(BlockType type)
        {
            blockType = type;
            currentRotation = 0;
            blockShape = GetBlockShape(blockType, currentRotation);
            CreateBlockPieces();
        }
        
        public void SetColor(Color color)
        {
            blockColor = color;
            
            // Update existing pieces
            foreach (var piece in blockPieces)
            {
                var renderer = piece.GetComponent<Renderer>();
                if (renderer != null)
                {
                    renderer.material.color = blockColor;
                }
            }
        }
        
        public void SetMaterial(Material material)
        {
            blockMaterial = material;
            
            // Update existing pieces
            foreach (var piece in blockPieces)
            {
                var renderer = piece.GetComponent<Renderer>();
                if (renderer != null)
                {
                    renderer.material = blockMaterial;
                }
            }
        }
        
        public List<Vector2Int> GetWorldPositions()
        {
            var worldPositions = new List<Vector2Int>();
            foreach (var offset in blockShape)
            {
                worldPositions.Add(gridPosition + offset);
            }
            return worldPositions;
        }
    }
}
