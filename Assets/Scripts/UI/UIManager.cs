using UnityEngine;

namespace NorthernBlocks.UI
{
    /// <summary>
    /// Manages all UI elements and screen transitions
    /// </summary>
    public class UIManager : MonoBehaviour
    {
        [Header("UI Panels")]
        [SerializeField] private GameObject mainMenuPanel;
        [SerializeField] private GameObject gameplayPanel;
        [SerializeField] private GameObject pausePanel;
        [SerializeField] private GameObject gameOverPanel;
        [SerializeField] private GameObject settingsPanel;
        
        // Singleton
        public static UIManager Instance { get; private set; }
        
        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                InitializeUI();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        private void Start()
        {
            ShowMainMenu();
        }
        
        private void InitializeUI()
        {
            // Subscribe to game state changes
            if (Core.GameManager.Instance != null)
            {
                Core.GameManager.Instance.OnGameStateChanged += OnGameStateChanged;
            }
        }
        
        private void OnGameStateChanged(Core.GameManager.GameState newState)
        {
            HideAllPanels();
            
            switch (newState)
            {
                case Core.GameManager.GameState.MainMenu:
                    ShowMainMenu();
                    break;
                case Core.GameManager.GameState.Playing:
                    ShowGameplay();
                    break;
                case Core.GameManager.GameState.Paused:
                    ShowPause();
                    break;
                case Core.GameManager.GameState.GameOver:
                    ShowGameOver();
                    break;
                case Core.GameManager.GameState.Settings:
                    ShowSettings();
                    break;
            }
        }
        
        private void HideAllPanels()
        {
            if (mainMenuPanel != null) mainMenuPanel.SetActive(false);
            if (gameplayPanel != null) gameplayPanel.SetActive(false);
            if (pausePanel != null) pausePanel.SetActive(false);
            if (gameOverPanel != null) gameOverPanel.SetActive(false);
            if (settingsPanel != null) settingsPanel.SetActive(false);
        }
        
        public void ShowMainMenu()
        {
            if (mainMenuPanel != null) mainMenuPanel.SetActive(true);
        }
        
        public void ShowGameplay()
        {
            if (gameplayPanel != null) gameplayPanel.SetActive(true);
        }
        
        public void ShowPause()
        {
            if (pausePanel != null) pausePanel.SetActive(true);
        }
        
        public void ShowGameOver()
        {
            if (gameOverPanel != null) gameOverPanel.SetActive(true);
        }
        
        public void ShowSettings()
        {
            if (settingsPanel != null) settingsPanel.SetActive(true);
        }
        
        // Button handlers
        public void OnPlayButtonClicked()
        {
            Core.GameManager.Instance?.StartNewGame();
        }
        
        public void OnPauseButtonClicked()
        {
            Core.GameManager.Instance?.PauseGame();
        }
        
        public void OnResumeButtonClicked()
        {
            Core.GameManager.Instance?.ResumeGame();
        }
        
        public void OnMainMenuButtonClicked()
        {
            Core.GameManager.Instance?.ReturnToMainMenu();
        }
        
        public void OnSettingsButtonClicked()
        {
            Core.GameManager.Instance?.ChangeGameState(Core.GameManager.GameState.Settings);
        }
        
        public void OnQuitButtonClicked()
        {
            Core.GameManager.Instance?.QuitGame();
        }
    }
}
