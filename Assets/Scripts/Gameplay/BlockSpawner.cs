using UnityEngine;
using System.Collections.Generic;

namespace NorthernBlocks.Gameplay
{
    /// <summary>
    /// Handles spawning of new blocks with proper randomization and preview system
    /// </summary>
    public class BlockSpawner : MonoBehaviour
    {
        [Header("Spawning Settings")]
        [SerializeField] private GameObject blockPrefab;
        [SerializeField] private Transform spawnPoint;
        [SerializeField] private int nextBlocksToShow = 3;
        [SerializeField] private bool use7BagRandomizer = true;
        
        [Header("Block Colors")]
        [SerializeField] private Color[] blockColors = new Color[]
        {
            Color.cyan,    // I block
            Color.yellow,  // O block
            Color.magenta, // T block
            Color.green,   // S block
            Color.red,     // Z block
            Color.blue,    // J block
            new Color(1f, 0.5f, 0f) // L block (orange)
        };
        
        // Spawning state
        private Queue<Block.BlockType> nextBlocks;
        private List<Block.BlockType> currentBag;
        private Block currentBlock;
        private Block heldBlock;
        private bool canHold = true;
        
        // Events
        public System.Action<Block> OnBlockSpawned;
        public System.Action<Block> OnBlockHeld;
        public System.Action<Queue<Block.BlockType>> OnNextBlocksUpdated;
        
        // Properties
        public Block CurrentBlock => currentBlock;
        public Block HeldBlock => heldBlock;
        public Queue<Block.BlockType> NextBlocks => nextBlocks;
        public bool CanHold => canHold;
        
        private void Awake()
        {
            InitializeSpawner();
        }
        
        private void InitializeSpawner()
        {
            nextBlocks = new Queue<Block.BlockType>();
            currentBag = new List<Block.BlockType>();
            
            // Fill initial queue
            FillNextBlocks();
        }
        
        private void FillNextBlocks()
        {
            while (nextBlocks.Count < nextBlocksToShow + 1) // +1 for current block
            {
                if (use7BagRandomizer)
                {
                    FillBagRandomizer();
                }
                else
                {
                    AddRandomBlock();
                }
            }
        }
        
        private void FillBagRandomizer()
        {
            if (currentBag.Count == 0)
            {
                // Add all 7 block types to the bag
                currentBag.AddRange(System.Enum.GetValues(typeof(Block.BlockType)) as Block.BlockType[]);
                
                // Shuffle the bag
                for (int i = 0; i < currentBag.Count; i++)
                {
                    var temp = currentBag[i];
                    int randomIndex = Random.Range(i, currentBag.Count);
                    currentBag[i] = currentBag[randomIndex];
                    currentBag[randomIndex] = temp;
                }
            }
            
            // Take the next block from the bag
            nextBlocks.Enqueue(currentBag[0]);
            currentBag.RemoveAt(0);
        }
        
        private void AddRandomBlock()
        {
            var blockTypes = System.Enum.GetValues(typeof(Block.BlockType)) as Block.BlockType[];
            var randomType = blockTypes[Random.Range(0, blockTypes.Length)];
            nextBlocks.Enqueue(randomType);
        }
        
        public Block SpawnNextBlock()
        {
            if (nextBlocks.Count == 0)
            {
                FillNextBlocks();
            }
            
            var blockType = nextBlocks.Dequeue();
            currentBlock = CreateBlock(blockType);
            
            // Position at spawn point
            if (spawnPoint != null)
            {
                currentBlock.transform.position = spawnPoint.position;
            }
            else
            {
                var gameGrid = FindObjectOfType<GameGrid>();
                if (gameGrid != null)
                {
                    currentBlock.transform.position = gameGrid.GetSpawnPosition();
                }
            }
            
            // Set up block events
            currentBlock.OnBlockLocked += OnCurrentBlockLocked;
            
            // Reset hold ability
            canHold = true;
            
            // Refill queue if needed
            FillNextBlocks();
            
            OnBlockSpawned?.Invoke(currentBlock);
            OnNextBlocksUpdated?.Invoke(nextBlocks);
            
            return currentBlock;
        }
        
        private Block CreateBlock(Block.BlockType blockType)
        {
            GameObject blockObj;
            
            if (blockPrefab != null)
            {
                blockObj = Instantiate(blockPrefab);
            }
            else
            {
                blockObj = new GameObject($"Block_{blockType}");
                blockObj.AddComponent<Block>();
            }
            
            var block = blockObj.GetComponent<Block>();
            if (block == null)
            {
                block = blockObj.AddComponent<Block>();
            }
            
            // Set block properties
            block.SetBlockType(blockType);
            block.SetColor(GetBlockColor(blockType));
            
            return block;
        }
        
        private Color GetBlockColor(Block.BlockType blockType)
        {
            int index = (int)blockType;
            if (index >= 0 && index < blockColors.Length)
            {
                return blockColors[index];
            }
            return Color.white;
        }
        
        public bool HoldCurrentBlock()
        {
            if (!canHold || currentBlock == null) return false;
            
            Block blockToSpawn = null;
            
            if (heldBlock == null)
            {
                // First time holding - store current block and spawn next
                heldBlock = currentBlock;
                blockToSpawn = SpawnNextBlock();
            }
            else
            {
                // Swap current block with held block
                Block temp = currentBlock;
                blockToSpawn = heldBlock;
                heldBlock = temp;
            }
            
            // Reset held block position and state
            if (heldBlock != null)
            {
                heldBlock.transform.position = Vector3.zero;
                heldBlock.gameObject.SetActive(false);
            }
            
            // Set up new current block
            currentBlock = blockToSpawn;
            if (currentBlock != null)
            {
                currentBlock.gameObject.SetActive(true);
                
                // Position at spawn point
                if (spawnPoint != null)
                {
                    currentBlock.transform.position = spawnPoint.position;
                }
                else
                {
                    var gameGrid = FindObjectOfType<GameGrid>();
                    if (gameGrid != null)
                    {
                        currentBlock.transform.position = gameGrid.GetSpawnPosition();
                    }
                }
                
                currentBlock.OnBlockLocked += OnCurrentBlockLocked;
            }
            
            canHold = false;
            OnBlockHeld?.Invoke(heldBlock);
            
            return true;
        }
        
        private void OnCurrentBlockLocked(Block block)
        {
            if (block == currentBlock)
            {
                // Place block on grid
                var gameGrid = FindObjectOfType<GameGrid>();
                if (gameGrid != null)
                {
                    gameGrid.PlaceBlock(block);
                    
                    // Check for game over
                    if (gameGrid.IsGameOver())
                    {
                        var gameManager = Core.GameManager.Instance;
                        if (gameManager != null)
                        {
                            gameManager.EndGame();
                        }
                        return;
                    }
                }
                
                // Destroy the current block object
                Destroy(block.gameObject);
                currentBlock = null;
                
                // Spawn next block
                SpawnNextBlock();
            }
        }
        
        public void SetSpawnPoint(Transform point)
        {
            spawnPoint = point;
        }
        
        public void SetBlockColors(Color[] colors)
        {
            if (colors != null && colors.Length >= 7)
            {
                blockColors = colors;
            }
        }
        
        public void SetRandomizerType(bool use7Bag)
        {
            use7BagRandomizer = use7Bag;
            
            // Reset the system
            nextBlocks.Clear();
            currentBag.Clear();
            FillNextBlocks();
            OnNextBlocksUpdated?.Invoke(nextBlocks);
        }
        
        public void ResetSpawner()
        {
            // Clear current state
            if (currentBlock != null)
            {
                Destroy(currentBlock.gameObject);
                currentBlock = null;
            }
            
            if (heldBlock != null)
            {
                Destroy(heldBlock.gameObject);
                heldBlock = null;
            }
            
            nextBlocks.Clear();
            currentBag.Clear();
            canHold = true;
            
            // Refill queue
            FillNextBlocks();
            OnNextBlocksUpdated?.Invoke(nextBlocks);
        }
        
        public List<Block.BlockType> GetNextBlocksList()
        {
            return new List<Block.BlockType>(nextBlocks);
        }
        
        public Block.BlockType PeekNextBlock()
        {
            if (nextBlocks.Count > 0)
            {
                return nextBlocks.Peek();
            }
            
            FillNextBlocks();
            return nextBlocks.Count > 0 ? nextBlocks.Peek() : Block.BlockType.I;
        }
    }
}
