import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["chart", "stats", "progress"]
  
  connect() {
    this.loadWeeklyData()
  }
  
  loadWeeklyData() {
    fetch('/walking_sessions/weekly_summary')
      .then(response => response.json())
      .then(data => {
        this.updateStats(data)
        this.updateProgressBar(data)
        this.drawChart(data)
      })
  }
  
  updateStats(data) {
    if (this.hasStatsTarget) {
      this.statsTarget.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-lg shadow">
            <div class="text-sm text-gray-600">今週のセッション</div>
            <div class="text-2xl font-bold text-gray-900">${data.total_sessions}</div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow">
            <div class="text-sm text-gray-600">合計距離</div>
            <div class="text-2xl font-bold text-blue-600">${data.total_distance.toFixed(2)} km</div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow">
            <div class="text-sm text-gray-600">合計時間</div>
            <div class="text-2xl font-bold text-green-600">${data.total_duration} 分</div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow">
            <div class="text-sm text-gray-600">達成日数</div>
            <div class="text-2xl font-bold ${data.target_met ? 'text-green-600' : 'text-orange-600'}">
              ${data.days_completed} / ${data.target_days} 日
            </div>
          </div>
        </div>
      `
    }
  }
  
  updateProgressBar(data) {
    if (this.hasProgressTarget) {
      const percentage = Math.min((data.days_completed / data.target_days) * 100, 100)
      const color = data.target_met ? 'bg-green-500' : 'bg-blue-500'
      
      this.progressTarget.innerHTML = `
        <div class="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
          <div class="${color} h-8 rounded-full transition-all duration-500 flex items-center justify-center text-white font-bold" 
               style="width: ${percentage}%">
            ${percentage.toFixed(0)}%
          </div>
        </div>
        <div class="mt-2 text-center text-sm text-gray-600">
          週${data.target_days}日以上の目標: ${data.target_met ? '達成！🎉' : `あと${data.target_days - data.days_completed}日`}
        </div>
      `
    }
  }
  
  drawChart(data) {
    if (!this.hasChartTarget) return
    
    // Create a simple bar chart for daily walking sessions
    const days = ['月', '火', '水', '木', '金', '土', '日']
    const today = new Date().getDay()
    const adjustedToday = today === 0 ? 6 : today - 1 // Adjust for Monday start
    
    let chartHTML = '<div class="flex items-end justify-between h-40 px-4">'
    
    days.forEach((day, index) => {
      const hasSession = index <= adjustedToday && Math.random() > 0.5 // Placeholder logic
      const height = hasSession ? Math.random() * 80 + 20 : 0
      const barColor = index <= adjustedToday 
        ? (hasSession ? 'bg-blue-500' : 'bg-gray-300')
        : 'bg-gray-200'
      
      chartHTML += `
        <div class="flex flex-col items-center flex-1">
          <div class="w-full max-w-12 ${barColor} rounded-t transition-all duration-500" 
               style="height: ${height}%"></div>
          <div class="text-xs mt-2 ${index === adjustedToday ? 'font-bold' : ''}">${day}</div>
        </div>
      `
    })
    
    chartHTML += '</div>'
    this.chartTarget.innerHTML = chartHTML
  }
}