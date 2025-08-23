import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { 
    points: Array,
    center: Object
  }
  
  connect() {
    this.loadLeaflet().then(() => {
      this.initializeMap()
      if (this.hasPointsValue && this.pointsValue.length > 0) {
        console.log('Drawing path with points:', this.pointsValue.length)
        this.drawPath()
        this.addMarkers()
      } else {
        console.log('No points data available')
      }
    }).catch(error => {
      console.error('Error loading Leaflet:', error)
    })
  }
  
  loadLeaflet() {
    return new Promise((resolve, reject) => {
      if (typeof L !== 'undefined') {
        console.log('Leaflet already loaded')
        resolve()
        return
      }
      
      // Load Leaflet CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      
      // Load Leaflet JS
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => {
        console.log('Leaflet loaded successfully')
        // Wait a bit to ensure L is properly initialized
        setTimeout(resolve, 100)
      }
      script.onerror = (error) => {
        console.error('Failed to load Leaflet script:', error)
        reject(error)
      }
      document.head.appendChild(script)
    })
  }
  
  initializeMap() {
    try {
      // Ensure we have a valid center coordinate array
      let center = [35.6762, 139.6503] // Tokyo default
      if (this.hasCenterValue && Array.isArray(this.centerValue) && this.centerValue.length === 2) {
        center = this.centerValue
      }
      
      console.log('Initializing map with center:', center)
      
      this.map = L.map(this.element).setView(center, 15)
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.map)
      
      this.bounds = L.latLngBounds()
      console.log('Map initialized successfully')
    } catch (error) {
      console.error('Error initializing map:', error)
      // Fallback: create a simple map instance if initialization fails
      this.bounds = L.latLngBounds()
    }
  }
  
  drawPath() {
    console.log('Drawing path for', this.pointsValue.length, 'points')
    
    if (this.pointsValue.length === 0) {
      console.warn('No points to draw')
      return
    }
    
    if (!this.map || !this.bounds) {
      console.error('Map not properly initialized')
      return
    }
    
    // Create a continuous path with all points
    const allCoords = []
    const fastSegments = []
    const slowSegments = []
    
    let currentSegment = []
    let currentType = null
    
    this.pointsValue.forEach((point, index) => {
      if (!point.latitude || !point.longitude) {
        console.warn('Invalid point at index', index, point)
        return
      }
      
      const coord = [parseFloat(point.latitude), parseFloat(point.longitude)]
      this.bounds.extend(coord)
      allCoords.push(coord)
      
      // Group consecutive points of same type into segments
      if (currentType !== point.interval_type) {
        if (currentSegment.length > 0) {
          if (currentType === 'fast') {
            fastSegments.push([...currentSegment])
          } else {
            slowSegments.push([...currentSegment])
          }
        }
        // Start new segment with the last point from previous segment to maintain continuity
        currentSegment = currentSegment.length > 0 ? [currentSegment[currentSegment.length - 1], coord] : [coord]
        currentType = point.interval_type
      } else {
        currentSegment.push(coord)
      }
    })
    
    // Don't forget the last segment
    if (currentSegment.length > 0) {
      if (currentType === 'fast') {
        fastSegments.push(currentSegment)
      } else {
        slowSegments.push(currentSegment)
      }
    }
    
    console.log('Fast segments:', fastSegments.length, 'Slow segments:', slowSegments.length)
    
    // Draw all segments
    fastSegments.forEach(segment => {
      if (segment.length > 1) {
        L.polyline(segment, {
          color: '#EF4444',
          weight: 4,
          opacity: 0.8
        }).addTo(this.map)
      }
    })
    
    slowSegments.forEach(segment => {
      if (segment.length > 1) {
        L.polyline(segment, {
          color: '#3B82F6',
          weight: 4,
          opacity: 0.8
        }).addTo(this.map)
      }
    })
    
    // Fit map to show entire path
    if (this.pointsValue.length > 0 && this.bounds.isValid()) {
      this.map.fitBounds(this.bounds, { padding: [50, 50] })
      console.log('Map bounds set successfully')
    } else {
      console.warn('Invalid bounds or no points, using default center')
      this.map.setView([35.6762, 139.6503], 15)
    }
  }
  
  addMarkers() {
    if (this.pointsValue.length === 0) return
    
    // Custom icons
    const greenIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
    
    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
    
    // Start marker
    const startPoint = this.pointsValue[0]
    L.marker([startPoint.latitude, startPoint.longitude], { icon: greenIcon })
      .addTo(this.map)
      .bindPopup('スタート')
    
    // End marker
    const endPoint = this.pointsValue[this.pointsValue.length - 1]
    L.marker([endPoint.latitude, endPoint.longitude], { icon: redIcon })
      .addTo(this.map)
      .bindPopup('ゴール')
    
    // Interval change markers
    let previousType = this.pointsValue[0].interval_type
    this.pointsValue.forEach((point, index) => {
      if (index > 0 && point.interval_type !== previousType) {
        const circleColor = point.interval_type === 'fast' ? '#EF4444' : '#3B82F6'
        L.circleMarker([point.latitude, point.longitude], {
          radius: 6,
          fillColor: circleColor,
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        })
        .addTo(this.map)
        .bindPopup(point.interval_type === 'fast' ? '速歩き開始' : 'ゆっくり歩き開始')
        
        previousType = point.interval_type
      }
    })
  }
}