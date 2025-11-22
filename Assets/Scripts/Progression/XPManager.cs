using UnityEngine;

namespace NorthernBlocks.Progression
{
    /// <summary>
    /// Manages player XP, level progression, and unlockables
    /// </summary>
    public class XPManager : MonoBehaviour
    {
        [Header("XP Settings")]
        [SerializeField] private int currentXP = 0;
        [SerializeField] private int currentLevel = 1;
        [SerializeField] private int baseXPRequired = 100;
        [SerializeField] private float xpScalingFactor = 1.2f;
        
        // Singleton
        public static XPManager Instance { get; private set; }
        
        // Events
        public System.Action<int> OnXPGained;
        public System.Action<int> OnLevelUp;
        
        // Properties
        public int CurrentXP => currentXP;
        public int CurrentLevel => currentLevel;
        
        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                LoadXPData();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        public void AddXP(int amount)
        {
            currentXP += amount;
            OnXPGained?.Invoke(amount);
            
            CheckForLevelUp();
            SaveXPData();
        }
        
        private void CheckForLevelUp()
        {
            int xpRequired = GetXPRequiredForLevel(currentLevel + 1);
            
            while (currentXP >= xpRequired)
            {
                currentLevel++;
                OnLevelUp?.Invoke(currentLevel);
                xpRequired = GetXPRequiredForLevel(currentLevel + 1);
            }
        }
        
        public int GetXPRequiredForLevel(int level)
        {
            if (level <= 1) return 0;
            
            int totalXP = 0;
            for (int i = 2; i <= level; i++)
            {
                totalXP += Mathf.RoundToInt(baseXPRequired * Mathf.Pow(xpScalingFactor, i - 2));
            }
            return totalXP;
        }
        
        public int GetXPRequiredForNextLevel()
        {
            return GetXPRequiredForLevel(currentLevel + 1) - currentXP;
        }
        
        private void LoadXPData()
        {
            currentXP = PlayerPrefs.GetInt("CurrentXP", 0);
            currentLevel = PlayerPrefs.GetInt("CurrentLevel", 1);
        }
        
        private void SaveXPData()
        {
            PlayerPrefs.SetInt("CurrentXP", currentXP);
            PlayerPrefs.SetInt("CurrentLevel", currentLevel);
            PlayerPrefs.Save();
        }
    }
}
