using UnityEngine;

namespace NorthernBlocks.Core
{
    /// <summary>
    /// Handles all input for the game including touch controls, gestures, and hardware buttons
    /// </summary>
    public class InputManager : MonoBehaviour
    {
        [Header("Touch Settings")]
        [SerializeField] private float swipeThreshold = 50f;
        [SerializeField] private float tapTimeThreshold = 0.2f;
        [SerializeField] private bool enableHapticFeedback = true;
        
        [Header("Control Scheme")]
        [SerializeField] private ControlScheme currentControlScheme = ControlScheme.TouchAndSwipe;
        
        public enum ControlScheme
        {
            TouchAndSwipe,
            OnScreenButtons,
            Hybrid
        }
        
        // Input Events
        public System.Action OnMoveLeft;
        public System.Action OnMoveRight;
        public System.Action OnMoveDown;
        public System.Action OnRotateClockwise;
        public System.Action OnRotateCounterClockwise;
        public System.Action OnHardDrop;
        public System.Action OnHold;
        public System.Action OnPause;
        
        // Touch tracking
        private Vector2 touchStartPos;
        private float touchStartTime;
        private bool isTouching = false;
        private bool hasProcessedSwipe = false;
        
        // Input state
        private bool backButtonPressed = false;
        
        // Properties
        public ControlScheme CurrentControlScheme => currentControlScheme;
        public bool EnableHapticFeedback { get => enableHapticFeedback; set => enableHapticFeedback = value; }
        
        private void Update()
        {
            HandleInput();
        }
        
        private void HandleInput()
        {
            // Handle Android back button
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                backButtonPressed = true;
            }
            
            // Handle touch input
            HandleTouchInput();
            
            // Handle keyboard input (for testing in editor)
            HandleKeyboardInput();
        }
        
        private void HandleTouchInput()
        {
            if (Input.touchCount > 0)
            {
                Touch touch = Input.GetTouch(0);
                
                switch (touch.phase)
                {
                    case TouchPhase.Began:
                        OnTouchBegan(touch.position);
                        break;
                        
                    case TouchPhase.Moved:
                        OnTouchMoved(touch.position);
                        break;
                        
                    case TouchPhase.Ended:
                    case TouchPhase.Canceled:
                        OnTouchEnded(touch.position);
                        break;
                }
            }
            
            // Handle mouse input for testing in editor
            #if UNITY_EDITOR
            HandleMouseInput();
            #endif
        }
        
        #if UNITY_EDITOR
        private void HandleMouseInput()
        {
            if (Input.GetMouseButtonDown(0))
            {
                OnTouchBegan(Input.mousePosition);
            }
            else if (Input.GetMouseButton(0))
            {
                OnTouchMoved(Input.mousePosition);
            }
            else if (Input.GetMouseButtonUp(0))
            {
                OnTouchEnded(Input.mousePosition);
            }
        }
        #endif
        
        private void OnTouchBegan(Vector2 position)
        {
            touchStartPos = position;
            touchStartTime = Time.time;
            isTouching = true;
            hasProcessedSwipe = false;
        }
        
        private void OnTouchMoved(Vector2 position)
        {
            if (!isTouching || hasProcessedSwipe) return;
            
            Vector2 swipeDelta = position - touchStartPos;
            float swipeDistance = swipeDelta.magnitude;
            
            if (swipeDistance >= swipeThreshold)
            {
                ProcessSwipe(swipeDelta);
                hasProcessedSwipe = true;
            }
        }
        
        private void OnTouchEnded(Vector2 position)
        {
            if (!isTouching) return;
            
            float touchDuration = Time.time - touchStartTime;
            Vector2 swipeDelta = position - touchStartPos;
            float swipeDistance = swipeDelta.magnitude;
            
            // Check if it's a tap (short duration, small movement)
            if (touchDuration <= tapTimeThreshold && swipeDistance < swipeThreshold)
            {
                ProcessTap(position);
            }
            // Check if it's a swipe that hasn't been processed yet
            else if (!hasProcessedSwipe && swipeDistance >= swipeThreshold)
            {
                ProcessSwipe(swipeDelta);
            }
            
            isTouching = false;
            hasProcessedSwipe = false;
        }
        
        private void ProcessSwipe(Vector2 swipeDelta)
        {
            Vector2 normalizedSwipe = swipeDelta.normalized;
            
            // Determine swipe direction
            if (Mathf.Abs(normalizedSwipe.x) > Mathf.Abs(normalizedSwipe.y))
            {
                // Horizontal swipe
                if (normalizedSwipe.x > 0)
                {
                    TriggerMoveRight();
                }
                else
                {
                    TriggerMoveLeft();
                }
            }
            else
            {
                // Vertical swipe
                if (normalizedSwipe.y < 0)
                {
                    TriggerMoveDown();
                }
                else
                {
                    TriggerHardDrop();
                }
            }
        }
        
        private void ProcessTap(Vector2 position)
        {
            // Determine tap area for rotation
            float screenWidth = Screen.width;
            float tapX = position.x;
            
            if (tapX < screenWidth * 0.3f)
            {
                // Left side tap - rotate counter-clockwise
                TriggerRotateCounterClockwise();
            }
            else if (tapX > screenWidth * 0.7f)
            {
                // Right side tap - rotate clockwise
                TriggerRotateClockwise();
            }
            else
            {
                // Center tap - rotate clockwise (default)
                TriggerRotateClockwise();
            }
        }
        
        private void HandleKeyboardInput()
        {
            // Movement
            if (Input.GetKeyDown(KeyCode.A) || Input.GetKeyDown(KeyCode.LeftArrow))
                TriggerMoveLeft();
            
            if (Input.GetKeyDown(KeyCode.D) || Input.GetKeyDown(KeyCode.RightArrow))
                TriggerMoveRight();
            
            if (Input.GetKeyDown(KeyCode.S) || Input.GetKeyDown(KeyCode.DownArrow))
                TriggerMoveDown();
            
            // Rotation
            if (Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow))
                TriggerRotateClockwise();
            
            if (Input.GetKeyDown(KeyCode.Q))
                TriggerRotateCounterClockwise();
            
            // Special actions
            if (Input.GetKeyDown(KeyCode.Space))
                TriggerHardDrop();
            
            if (Input.GetKeyDown(KeyCode.C))
                TriggerHold();
            
            if (Input.GetKeyDown(KeyCode.P) || Input.GetKeyDown(KeyCode.Escape))
                TriggerPause();
        }
        
        // Input trigger methods
        private void TriggerMoveLeft()
        {
            OnMoveLeft?.Invoke();
            TriggerHapticFeedback();
        }
        
        private void TriggerMoveRight()
        {
            OnMoveRight?.Invoke();
            TriggerHapticFeedback();
        }
        
        private void TriggerMoveDown()
        {
            OnMoveDown?.Invoke();
            TriggerHapticFeedback();
        }
        
        private void TriggerRotateClockwise()
        {
            OnRotateClockwise?.Invoke();
            TriggerHapticFeedback();
        }
        
        private void TriggerRotateCounterClockwise()
        {
            OnRotateCounterClockwise?.Invoke();
            TriggerHapticFeedback();
        }
        
        private void TriggerHardDrop()
        {
            OnHardDrop?.Invoke();
            TriggerHapticFeedback();
        }
        
        private void TriggerHold()
        {
            OnHold?.Invoke();
            TriggerHapticFeedback();
        }
        
        private void TriggerPause()
        {
            OnPause?.Invoke();
        }
        
        private void TriggerHapticFeedback()
        {
            if (enableHapticFeedback)
            {
                #if UNITY_ANDROID && !UNITY_EDITOR
                Handheld.Vibrate();
                #endif
            }
        }
        
        public bool GetBackButtonPressed()
        {
            bool pressed = backButtonPressed;
            backButtonPressed = false; // Reset after reading
            return pressed;
        }
        
        public void SetControlScheme(ControlScheme scheme)
        {
            currentControlScheme = scheme;
        }
        
        public void SetHapticFeedback(bool enabled)
        {
            enableHapticFeedback = enabled;
        }
        
        public void SetSwipeThreshold(float threshold)
        {
            swipeThreshold = Mathf.Clamp(threshold, 20f, 200f);
        }
        
        public void SetTapTimeThreshold(float threshold)
        {
            tapTimeThreshold = Mathf.Clamp(threshold, 0.1f, 0.5f);
        }
    }
}
