import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["timer", "status", "setCount", "intervalType", "distance", "startBtn", "pauseBtn", "completeBtn"]
  static values = { 
    sessionId: Number,
    intervalDuration: { type: Number, default: 180 }, // 3 minutes in seconds
    totalSets: { type: Number, default: 5 }
  }
  
  connect() {
    this.currentSet = 1
    this.currentInterval = 'fast' // fast or slow
    this.elapsedTime = 0
    this.isRunning = false
    this.isPaused = false
    this.gpsWatchId = null
    this.lastPosition = null
    
    // Only start timer automatically for active sessions
    if (this.hasSessionIdValue && this.sessionIdValue > 0) {
      this.checkSessionStatus().then(sessionData => {
        if (sessionData && sessionData.status === 'active') {
          this.startTimer()
        }
      })
    }
  }
  
  disconnect() {
    this.stopTimer()
    this.stopGPS()
    // Reset background color when component is destroyed
    document.body.style.backgroundColor = ''
  }
  
  start() {
    fetch('/walking_sessions', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.id) {
        this.sessionIdValue = data.id
        window.location.href = `/walking_sessions/${data.id}`
      }
    })
  }
  
  checkSessionStatus() {
    return fetch(`/walking_sessions/current`)
      .then(response => response.json())
      .then(data => {
        // If there's a current active session and it matches our sessionId, return its data
        if (data.active !== false && data.id === this.sessionIdValue) {
          return data
        }
        return null
      })
      .catch(error => {
        console.error('Error checking session status:', error)
        return null
      })
  }
  
  startTimer() {
    if (!this.isRunning) {
      this.isRunning = true
      this.isPaused = false
      this.startGPS()
      this.updateDisplay()
      // Initialize background color when starting
      this.updateBackgroundColor()
      this.timer = setInterval(() => {
        this.elapsedTime++
        this.checkInterval()
        this.updateDisplay()
      }, 1000)
      
      this.updateButtons()
    }
  }
  
  pause() {
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true
      clearInterval(this.timer)
      this.stopGPS()
      
      fetch(`/walking_sessions/${this.sessionIdValue}/pause`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      })
      
      this.updateButtons()
    }
  }
  
  resume() {
    if (this.isPaused) {
      this.isPaused = false
      this.startTimer()
      
      fetch(`/walking_sessions/${this.sessionIdValue}/resume`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      })
    }
  }
  
  complete() {
    this.stopTimer()
    this.stopGPS()
    
    // Reset background color when completing session
    document.body.style.backgroundColor = ''
    
    fetch(`/walking_sessions/${this.sessionIdValue}/complete`, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
      }
    })
    .then(() => {
      // Refresh the page to show completed status, but don't use window.location.href
      // as it causes the timer to restart
      window.location.reload()
    })
  }
  
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.isRunning = false
    // Reset background color when stopping timer
    document.body.style.backgroundColor = ''
  }
  
  checkInterval() {
    const intervalTime = this.elapsedTime % (this.intervalDurationValue * 2)
    const setNumber = Math.floor(this.elapsedTime / (this.intervalDurationValue * 2)) + 1
    
    if (setNumber > this.totalSetsValue) {
      this.complete()
      return
    }
    
    this.currentSet = setNumber
    
    const newInterval = intervalTime < this.intervalDurationValue ? 'fast' : 'slow'
    if (newInterval !== this.currentInterval) {
      this.currentInterval = newInterval
      this.updateBackgroundColor()
      this.playSound()
      this.showNotification()
    }
  }
  
  updateDisplay() {
    const minutes = Math.floor(this.elapsedTime / 60)
    const seconds = this.elapsedTime % 60
    this.timerTarget.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    
    this.setCountTarget.textContent = `セット ${this.currentSet} / ${this.totalSetsValue}`
    this.intervalTypeTarget.textContent = this.currentInterval === 'fast' ? '🏃 速歩き' : '🚶 ゆっくり歩き'
    this.intervalTypeTarget.className = this.currentInterval === 'fast' 
      ? 'text-2xl font-bold text-red-600' 
      : 'text-2xl font-bold text-blue-600'
    
    const intervalTime = this.elapsedTime % (this.intervalDurationValue * 2)
    const currentIntervalRemaining = this.currentInterval === 'fast' 
      ? this.intervalDurationValue - intervalTime
      : this.intervalDurationValue * 2 - intervalTime
      
    this.statusTarget.textContent = `残り ${Math.floor(currentIntervalRemaining / 60)}:${String(currentIntervalRemaining % 60).padStart(2, '0')}`
    
    // Update background color to reflect current walking mode
    this.updateBackgroundColor()
  }
  
  updateBackgroundColor() {
    // Change the entire page background color based on walking mode
    if (this.currentInterval === 'fast') {
      // Red/warm background for fast walking
      document.body.style.backgroundColor = '#fef2f2' // red-50
      document.body.style.transition = 'background-color 0.5s ease'
    } else if (this.currentInterval === 'slow') {
      // Blue/cool background for slow walking  
      document.body.style.backgroundColor = '#eff6ff' // blue-50
      document.body.style.transition = 'background-color 0.5s ease'
    } else {
      // Default background when not in a walking mode
      document.body.style.backgroundColor = ''
    }
  }
  
  updateButtons() {
    if (this.hasStartBtnTarget) {
      this.startBtnTarget.classList.toggle('hidden', this.isRunning)
    }
    if (this.hasPauseBtnTarget) {
      this.pauseBtnTarget.classList.toggle('hidden', !this.isRunning || this.isPaused)
    }
    if (this.hasCompleteBtnTarget) {
      this.completeBtnTarget.classList.toggle('hidden', !this.isRunning)
    }
  }
  
  playSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2+z9NC4Rnx0FUq8BgEAAgYBAQEBAAYDAAAABgABAQMBAAAAAQEBAAAAAQcCAAYCAQMAAAABAAUGAgEBAQUGAQAAAAABAQAIAQEBAAAAAAgBAQECBAgAAAUBCQEBAwADAAgBAAEBAAEFAQUBAAEBCAEBAQIEAwAJAQEEAQABAAgBAQEDAQMAAAABAwEBAQAIAQEBAQYAAwAHAQEDAQEBAAgBAQkBAQQAAAABAQEACAECBQQFBQMBAAAABQABAQYCBgQAAQEABgEBAwEBAQUAAwEBAQAHBQMFAAAAAQgBAQEABQEBAQMIAgABAAkBAgQAAgMJAQEBAAgBAQECAwEFAQEACQEBAwADAQEBAwgBAgEABgEBAQQACAkJAQEBAwABAwUDAQADAQUCBwEBBQEBAQEAAwEFAQABAAgBAwEDAQABAAEFAQECAQEBAQEDAQEBAQMBAQEBAQEBCQEBAQEABgEBAQkBAQEFCQMBAQEBCQEDAwMBBQEBAQkBAQEBAgEBAQUJAwEBAQEJAQEBAwMFAQEBCQEBAQkBAwEDAQUBAQEJAQEBAQIBAQEFCQMBAQEBCQEBAwEDAQEBBQkDAQEBAQkBAQEBAwUBAQEJAQEBAQkBAwEBBQMBAQEJAQEBAQEBAQEJCQMBAQEBCQEBAQEDBQEBCQEBAQEBCQEBAQEDAQMBBQEBAQkBAQEDAQEBAQEDAQEBAQEJAQEBAQEBAwEBAQUBAQEBAQEBAQEBAQEAAQEABQkJCQkJCQMBBQkJCQkBAwAAAAkDAwkJAwEDCQkBAQABAQAAAAEAAAAJAQABAAEAAAABAAAACQEBAAEAAAkBAQEEAAAAAQEAAAABAAAAAAEAAQABAAAAAAEAAQABAAAAAAEAAQABAAAAAAEBAAEBAAABAAEBAQABAAABAAEBAQABAQABAAAAAAEBAAAAAAAAAwkJAwEBCQABAQEAAAABAAEAAAAAAAEAAQAAAAABAAEAAAAAAAEAAQAAAAABAAEAAAAAAAEAAQAAAAABAAEAAAAAAQEBAAAAAAAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=')
    audio.play()
  }
  
  showNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      const message = this.currentInterval === 'fast' ? '速歩きタイム！' : 'ゆっくり歩きタイム'
      new Notification('Japanese Walking', {
        body: message,
        icon: '/icon.png'
      })
    }
  }
  
  startGPS() {
    if ('geolocation' in navigator) {
      // Get initial position
      this.getCurrentPosition()
      
      // Then get position every 60 seconds
      this.gpsInterval = setInterval(() => {
        this.getCurrentPosition()
      }, 60000) // 60 seconds
    }
  }
  
  getCurrentPosition() {
    navigator.geolocation.getCurrentPosition(
      (position) => this.handlePosition(position),
      (error) => console.error('GPS error:', error),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    )
  }
  
  stopGPS() {
    if (this.gpsInterval) {
      clearInterval(this.gpsInterval)
      this.gpsInterval = null
    }
  }
  
  handlePosition(position) {
    const { latitude, longitude, speed } = position.coords
    
    fetch(`/walking_sessions/${this.sessionIdValue}/add_location`, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        location_point: {
          latitude: latitude,
          longitude: longitude,
          speed: speed || 0,
          interval_type: this.currentInterval
        }
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && this.hasDistanceTarget) {
        this.distanceTarget.textContent = `${data.distance.toFixed(2)} km`
      }
    })
    
    this.lastPosition = { latitude, longitude }
  }
  
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }
}