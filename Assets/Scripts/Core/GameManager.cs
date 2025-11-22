using UnityEngine;
using UnityEngine.SceneManagement;

namespace NorthernBlocks.Core
{
    /// <summary>
    /// Central game manager that coordinates all game systems and manages game state
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        [Header("Game Settings")]
        [SerializeField] private bool debugMode = false;
        [SerializeField] private float targetFrameRate = 60f;
        
        [Header("System References")]
        [SerializeField] private InputManager inputManager;
        [SerializeField] private AudioManager audioManager;
        [SerializeField] private UIManager uiManager;
        
        // Game State
        public enum GameState
        {
            MainMenu,
            Playing,
            Paused,
            GameOver,
            Settings,
            Achievements,
            DailyChallenge
        }
        
        private GameState currentState = GameState.MainMenu;
        private GameState previousState;
        
        // Singleton pattern
        public static GameManager Instance { get; private set; }
        
        // Events
        public System.Action<GameState> OnGameStateChanged;
        public System.Action<int> OnScoreChanged;
        public System.Action<int> OnLevelChanged;
        public System.Action<int> OnLinesCleared;
        
        // Game Statistics
        private int currentScore = 0;
        private int currentLevel = 1;
        private int totalLinesCleared = 0;
        private float gameTime = 0f;
        
        // Properties
        public GameState CurrentState => currentState;
        public int CurrentScore => currentScore;
        public int CurrentLevel => currentLevel;
        public int TotalLinesCleared => totalLinesCleared;
        public float GameTime => gameTime;
        public bool IsPlaying => currentState == GameState.Playing;
        public bool IsPaused => currentState == GameState.Paused;
        
        private void Awake()
        {
            // Singleton setup
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeGame();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        private void Start()
        {
            SetupGame();
        }
        
        private void Update()
        {
            if (IsPlaying)
            {
                gameTime += Time.deltaTime;
            }
            
            HandleInput();
        }
        
        private void InitializeGame()
        {
            // Set target frame rate
            Application.targetFrameRate = (int)targetFrameRate;
            
            // Prevent screen from sleeping during gameplay
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            
            // Initialize core systems
            if (inputManager == null)
                inputManager = FindObjectOfType<InputManager>();
            
            if (audioManager == null)
                audioManager = FindObjectOfType<AudioManager>();
                
            if (uiManager == null)
                uiManager = FindObjectOfType<UIManager>();
        }
        
        private void SetupGame()
        {
            ChangeGameState(GameState.MainMenu);
        }
        
        private void HandleInput()
        {
            // Handle global input (pause, back button, etc.)
            if (Input.GetKeyDown(KeyCode.Escape) || inputManager?.GetBackButtonPressed() == true)
            {
                HandleBackButton();
            }
        }
        
        private void HandleBackButton()
        {
            switch (currentState)
            {
                case GameState.Playing:
                    PauseGame();
                    break;
                case GameState.Paused:
                    ResumeGame();
                    break;
                case GameState.Settings:
                case GameState.Achievements:
                    ChangeGameState(GameState.MainMenu);
                    break;
                case GameState.MainMenu:
                    // Exit game or minimize
                    Application.Quit();
                    break;
            }
        }
        
        public void ChangeGameState(GameState newState)
        {
            if (currentState == newState) return;
            
            previousState = currentState;
            currentState = newState;
            
            OnGameStateChanged?.Invoke(currentState);
            
            // Handle state-specific logic
            switch (currentState)
            {
                case GameState.MainMenu:
                    Time.timeScale = 1f;
                    break;
                case GameState.Playing:
                    Time.timeScale = 1f;
                    break;
                case GameState.Paused:
                    Time.timeScale = 0f;
                    break;
                case GameState.GameOver:
                    Time.timeScale = 0f;
                    HandleGameOver();
                    break;
            }
            
            if (debugMode)
                Debug.Log($"Game state changed: {previousState} -> {currentState}");
        }
        
        public void StartNewGame()
        {
            ResetGameStats();
            ChangeGameState(GameState.Playing);
        }
        
        public void PauseGame()
        {
            if (currentState == GameState.Playing)
            {
                ChangeGameState(GameState.Paused);
            }
        }
        
        public void ResumeGame()
        {
            if (currentState == GameState.Paused)
            {
                ChangeGameState(GameState.Playing);
            }
        }
        
        public void EndGame()
        {
            ChangeGameState(GameState.GameOver);
        }
        
        public void ReturnToMainMenu()
        {
            ChangeGameState(GameState.MainMenu);
        }
        
        private void ResetGameStats()
        {
            currentScore = 0;
            currentLevel = 1;
            totalLinesCleared = 0;
            gameTime = 0f;
            
            OnScoreChanged?.Invoke(currentScore);
            OnLevelChanged?.Invoke(currentLevel);
        }
        
        public void AddScore(int points)
        {
            currentScore += points;
            OnScoreChanged?.Invoke(currentScore);
        }
        
        public void AddLinesCleared(int lines)
        {
            totalLinesCleared += lines;
            OnLinesCleared?.Invoke(lines);
            
            // Check for level progression
            int newLevel = (totalLinesCleared / 10) + 1;
            if (newLevel > currentLevel)
            {
                currentLevel = newLevel;
                OnLevelChanged?.Invoke(currentLevel);
            }
        }
        
        private void HandleGameOver()
        {
            // Save high score and statistics
            var playerData = PlayerData.Instance;
            if (playerData != null)
            {
                playerData.UpdateGameStats(currentScore, currentLevel, totalLinesCleared, gameTime);
            }
            
            // Award XP based on performance
            var xpManager = XPManager.Instance;
            if (xpManager != null)
            {
                int xpEarned = CalculateXPEarned();
                xpManager.AddXP(xpEarned);
            }
        }
        
        private int CalculateXPEarned()
        {
            // Base XP calculation
            int baseXP = currentScore / 100;
            int levelBonus = currentLevel * 10;
            int lineBonus = totalLinesCleared * 5;
            int timeBonus = Mathf.RoundToInt(gameTime / 60f) * 2;
            
            return baseXP + levelBonus + lineBonus + timeBonus;
        }
        
        public void QuitGame()
        {
            Application.Quit();
        }
        
        private void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus && IsPlaying)
            {
                PauseGame();
            }
        }
        
        private void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus && IsPlaying)
            {
                PauseGame();
            }
        }
    }
}
