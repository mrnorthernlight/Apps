using UnityEngine;

namespace NorthernBlocks.Data
{
    /// <summary>
    /// Manages player data, statistics, and save/load functionality
    /// </summary>
    public class PlayerData : MonoBehaviour
    {
        [Header("Player Statistics")]
        [SerializeField] private int highScore = 0;
        [SerializeField] private int totalGamesPlayed = 0;
        [SerializeField] private int totalLinesCleared = 0;
        [SerializeField] private float totalPlayTime = 0f;
        
        // Singleton
        public static PlayerData Instance { get; private set; }
        
        // Properties
        public int HighScore => highScore;
        public int TotalGamesPlayed => totalGamesPlayed;
        public int TotalLinesCleared => totalLinesCleared;
        public float TotalPlayTime => totalPlayTime;
        
        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                LoadPlayerData();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        public void UpdateGameStats(int score, int level, int linesCleared, float gameTime)
        {
            if (score > highScore)
            {
                highScore = score;
            }
            
            totalGamesPlayed++;
            totalLinesCleared += linesCleared;
            totalPlayTime += gameTime;
            
            SavePlayerData();
        }
        
        private void LoadPlayerData()
        {
            highScore = PlayerPrefs.GetInt("HighScore", 0);
            totalGamesPlayed = PlayerPrefs.GetInt("TotalGamesPlayed", 0);
            totalLinesCleared = PlayerPrefs.GetInt("TotalLinesCleared", 0);
            totalPlayTime = PlayerPrefs.GetFloat("TotalPlayTime", 0f);
        }
        
        private void SavePlayerData()
        {
            PlayerPrefs.SetInt("HighScore", highScore);
            PlayerPrefs.SetInt("TotalGamesPlayed", totalGamesPlayed);
            PlayerPrefs.SetInt("TotalLinesCleared", totalLinesCleared);
            PlayerPrefs.SetFloat("TotalPlayTime", totalPlayTime);
            PlayerPrefs.Save();
        }
        
        public void ResetPlayerData()
        {
            highScore = 0;
            totalGamesPlayed = 0;
            totalLinesCleared = 0;
            totalPlayTime = 0f;
            
            SavePlayerData();
        }
    }
}
